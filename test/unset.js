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

describe('unset', function () {
  describe('mw.body().unset(key)', unsetKey('body'));
  describe('mw.query().unset(key)', unsetKey('query'));
  describe('mw.params().unset(key)', unsetKey('params'));
  describe('mw.body().unset(keys..)', unsetKeys('body'));
  describe('mw.query().unset(keys..)', unsetKeys('query'));
  describe('mw.params().unset(keys..)', unsetKeys('params'));
});

function unsetKey (dataType) {
  return function () {
    beforeEach(function () {
      this.key = 'key1';
      this.unsetKey = 'key2';
      this.app = createAppWithMiddleware(mw[dataType]().unset(this.unsetKey));
    });
    it('should unset key', function (done) {
      var data = {};
      data[this.key] = 'value';
      data[this.unsetKey] = 'value';
      var expected = {};
      expected[this.key] = 'value';
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200)
        .expect(function (res) {
          res.body.should.eql(expected);
        })
        .end(done);
    });
  };
}

function unsetKeys (dataType) {
  return function () {
    beforeEach(function () {
      this.keys = ['key1', 'key2'];
      this.unsetKeys = ['key3', 'key4'];
      this.app = createAppWithMiddleware(mw[dataType]().unset(this.unsetKeys[0], this.unsetKeys[1]));
    });
    it('should unset keys', function (done) {
      var data = {};
      data[this.keys[0]] = 'value';
      data[this.keys[1]] = 'value';
      data[this.unsetKeys[0]] = 'value';
      data[this.unsetKeys[1]] = 'value';
      var expected = {};
      expected[this.keys[0]] = 'value';
      expected[this.keys[1]] = 'value';
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200)
        .expect(function (res) {
          res.body.should.eql(expected);
        })
        .end(done);
    });
  };
}