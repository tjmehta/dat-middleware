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
var parseAsInt = function (v) {
  return parseInt(v);
};

describe('set (keypath)', function () {
  // describe('mw("body")().setFromReq()', transformKey(null, 'copyMe'));
  describe('mw.body().setFromReq(key, keypath)', transformKey('body', 'body.copyMe'));
  describe('mw.query().setFromReq(key, keypath)', transformKey('query', 'body.copyMe'));
  describe('mw.params().setFromReq(key, keypath)', transformKey('params', 'body.copyMe'));
});

function transformKey (dataType, keypath) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.app = dataType ?
        createAppWithMiddleware(mw[dataType]().set(this.key, keypath)):
        createAppWithMiddleware(mw('body')().set(this.key, keypath));
      dataType = dataType || 'body'; // for mw("body")...
    });
    it('should transform '+dataType+' values', function (done) {
      var expectedResponse = {};
      expectedResponse[this.key] = 1;
      if (dataType === 'body') {
        expectedResponse.copyMe = 1;
      }
      request(this.app)
        .post('/'+dataType)
        .send({ copyMe:1 })
        .expect(200)
        .expect(function (res) {
          res.body.should.eql(expectedResponse);
        })
        .end(done);
    });
  };
}