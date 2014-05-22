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

describe('pick', function () {
  describe('mw.body(key).pick()', pickKey('body'));
  describe('mw.body(key).pick()', pickKey('query'));
  describe('mw.body(key).pick()', pickKey('params'));
  describe('mw.body(keys..).pick()', pickKeys('body'));
  describe('mw.body(keys..).pick()', pickKeys('query'));
  describe('mw.body(keys..).pick()', pickKeys('params'));
});

function pickKey (dataType) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.blockedKey = 'blocked1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).pick());
    });
    it('should pick key', function (done) {
      var data = {};
      data[this.key] = 'value';
      data[this.blockedKey] = 'value';
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

function pickKeys (dataType) {
  return function () {
    before(function () {
      this.keys = ['key1', 'key2'];
      this.blockedKeys = ['blocked1', 'blocked2'];
      this.app = createAppWithMiddleware(mw[dataType](this.keys[0], this.keys[1]).pick());
    });
    it('should pick keys', function (done) {
      var data = {};
      data[this.keys[0]] = 'value';
      data[this.keys[1]] = 'value';
      data[this.blockedKeys[0]] = 'value';
      data[this.blockedKeys[1]] = 'value';
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