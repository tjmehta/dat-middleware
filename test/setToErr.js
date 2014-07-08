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

describe('set', function () {
  describe('mw.body().setToErr(key)', setKeyToErr('body', 'key2'));
  describe('mw.query().setToErr(key)', setKeyToErr('query', 'key2'));
  describe('mw.params().setToErr(key)', setKeyToErr('params', 'key2'));
});

function setKeyToErr (dataType, key) {
  return function () {
    before(function () {
      this.key = key;
      this.app = createAppWithMiddleware(
        function (req, res, next) { next(new Error('boom')); },
        mw[dataType]().setToErr(key),
        mw.res.json(200, dataType+'.'+key+'.message')
      );
    });
    it('should set key', function (done) {
      var data = {};
      request(this.app)
        .post('/')
        .expect(200)
        .expect(function (res) {
          res.body.should.eql('boom');
        })
        .end(done);
    });
  };
}
