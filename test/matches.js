var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

describe('matches', function () {
  describe('mw.body(key).matches(/value/)', matches('body', /value/, 'value'));
  describe('mw.query(key).matches(/value/)', matches('query', /value/, 'value'));
  describe('mw.params(key).matches(/value/)', matches('params', /value/, 'value'));

  describe('mw.body(keys...).matches("string")', matchesKeys('body', /value/, 'value'));
  describe('mw.query(keys...).matches("string")', matchesKeys('query', /value/, 'value'));
  describe('mw.params(keys...).matches("string")', matchesKeys('params', /value/, 'value'));
});


function matches (dataType, re, value) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).matches(re));
    });
    // body is the only dataType that supports more than just string
    // query array is tested in array test
    it('should error if key\'s value doesnt match '+re+' (if value exists)', function (done) {
      var data = {};
      data[this.key] = 'notmatch';
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(400)
        .end(done);
    });
    it('should succeed if key\'s value matches '+re, function (done) {
      var data = {};
      data[this.key] = value;
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200, data)
        .end(done);
    });
    it('should succeed if key does not exist', function (done) {
      var data = {};
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200, data)
        .end(done);
    });
  };
}

function matchesKeys (dataType, re, value) {
  return function () {
    before(function () {
      var keys = this.keys = ['key1', 'key2'];
      this.app = createAppWithMiddleware(mw[dataType](keys[0], keys[1]).matches(re));
    });
    it('should succeed if all keys are not included', function (done) {
      var data = {};
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200, data)
        .end(done);
    });
    if (dataType === 'body') {
      // body is the only dataType that supports more than just string
      // query array is tested in array test
      it('should error if one key is included and doesn\'t match '+re, function (done) {
        var reRE = new RegExp(re);
        var keys = this.keys;
        var count = createCounter(done);
        var body1 = {};
        body1[keys[0]] = re === 'string' ? {} : 'foo'; // aka wrong re
        request(this.app)
          .post('/body')
          .send(body1)
          .expect(400)
          .expect(function (res) {
            res.body.message.should.match(new RegExp(keys[0]));
            res.body.message.should.match(reRE);
          })
          .end(count.inc().next);
        var body2 = {};
        body2[keys[1]] = re === 'string' ? {} : 'foo'; // aka wrong re
        request(this.app)
          .post('/body')
          .send(body2)
          .expect(400)
          .expect(function (res) {
            res.body.message.should.match(new RegExp(keys[1]));
            res.body.message.should.match(reRE);
          })
          .end(count.inc().next);
      });
    }
    it('should succeed if all keys match '+re, function (done) {
      var keys = this.keys;
      var data = {};
      keys.forEach(function (key) {
        data[key] = value;
      });
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(200, data)
        .end(done);
    });
  };
}