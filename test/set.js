var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var fno = require('fn-object');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var clone = require('clone');
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
  describe('mw.body(key).set(key, value)', setKey('body', 'key2', true));
  describe('mw.body(key).set(key, value)', setKey('query', 'key2', true));
  describe('mw.body(key).set(key, value)', setKey('params', 'key2', true));
  describe('mw.body(key).set(obj)', setKeys('body', {key2: true, key3: true}));
  describe('mw.body(key).set(obj)', setKeys('query', {key2: true, key3: true}));
  describe('mw.body(key).set(obj)', setKeys('params', {key2: true, key3: true}));
});

function setKey (dataType, key, value) {
  return function () {
    beforeEach(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).set(key, value));
    });
    it('should set key', function (done) {
      var data = {};
      data[this.key] = 'value';
      var expected = extend(clone(data), key, value);
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

function setKeys (dataType, obj) {
  return function () {
    beforeEach(function () {
      this.keys = ['key1', 'key2'];
      this.app = createAppWithMiddleware(mw[dataType](this.keys[0], this.keys[1]).set(obj));
    });
    it('should set key', function (done) {
      var data = {};
      data[this.keys[0]] = 'value';
      data[this.keys[1]] = 'value';
      var expected = extend(clone(data), obj);
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