var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var fno = require('fn-object');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var clone = require('101/clone');
var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};
var extend = function (obj, key, value) {
  var extend;
  if (typeof key === 'object') {
    extend = key;
  }
  else {
    extend = {};
    extend[key] = value;
  }
  Object.keys(extend).forEach(function (key) {
    obj[key] = extend[key];
  });
  return obj;
};

describe('each', function () {
  describe('mw.body("arrayKey").each(middlewares)', eachSpecs([1, 2, 3], [
    function (eachReq, res, next) {
      eachReq.body.count++;
      next();
    },
    function (item, req, eachReq, res, next) {
      req.body.sum += item;
      req.body.count = eachReq.body.count;
      next();
    }
  ]));
});

function eachSpecs (arr, middlewares) {
  return function () {
    before(function () {
      this.key = 'key1';
      var bodyArr = mw.body('arr');
      this.app = createAppWithMiddleware(
        bodyArr.each.apply(bodyArr, middlewares)
      );
    });
    it('should run middlewares for each item in array', function (done) {
      request(this.app)
        .post('/body')
        .send({
          arr: arr,
          count: 0,
          sum: 0
        })
        .expect(200)
        .expect(function (res) {
          res.body.arr.should.eql([1, 2, 3]);
          res.body.sum.should.eql(6);
          res.body.count.should.eql(3);
        })
        .end(done);
    });
  };
}