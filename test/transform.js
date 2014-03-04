var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var fno = require('fn-object');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

describe('transform', function () {
  describe('mw.body(key).tranform(parseInt)', transformKey('body', '1', parseInt));
});

function transformKey (dataType, value, transformation) {
  return function () {
    beforeEach(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).transform(transformation));
    });
    it('should transform key', function (done) {
      var data = {};
      data[this.key] = value;
      var transformedData = fno(data).vals.map(transformation).val();
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200)
        .expect(function (res) {
          res.body.should.eql(transformedData);
        })
        .end(done);
    });
  };
}