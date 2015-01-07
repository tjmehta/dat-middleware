var clone = require('101/clone');
var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var createCounter = require('callback-count');
var fno = require('fn-object');
var isFunction = require('101/is-function');
var mw = require('../index');
var request = require('./lib/superdupertest');
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

function formatFunction (val) {
  return val + '_';
}

describe('set', function () {
  describe('mw.body().set(key, value, formatFunction)', setKey('body', 'key2', 'key2', formatFunction));
  describe('mw.query().set(key, value, formatFunction)', setKey('query', 'key2', 'key2', formatFunction));
  describe('mw.params().set(key, value, formatFunction)', setKey('params', 'key2', 'key2', formatFunction));

  describe('mw.body().set(key, value)', setKey('body', 'key2', true));
  describe('mw.query().set(key, value)', setKey('query', 'key2', true));
  describe('mw.params().set(key, value)', setKey('params', 'key2', true));

  describe('mw.body().set(obj)', setKeys('body', {key2: true, key3: true}));
  describe('mw.query().set(obj)', setKeys('query', {key2: true, key3: true}));
  describe('mw.params().set(obj)', setKeys('params', {key2: true, key3: true}));
});

function setKey (dataType, key, value, formatFunction) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType]().set(key, value, formatFunction));
    });
    it('should set key', function (done) {
      var data = {};
      data[this.key] = 'value';
      if (isFunction(formatFunction)) {
        var expected = extend(clone(data), key, formatFunction(value));
      }
      else {
        var expected = extend(clone(data), key, value);
      }
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
    before(function () {
      this.keys = ['key1', 'key2'];
      this.app = createAppWithMiddleware(mw[dataType]().set(obj));
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
