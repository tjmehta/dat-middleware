var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

describe('typeOf', function () {
  describe('mw.body(key).typeOf("string")', typeOf('body', 'string', 'value'));
  describe('mw.query(key).typeOf("string")', typeOf('query', 'string', 'value'));
  describe('mw.params(key).typeOf("string")', typeOf('params', 'string', 'value'));

  // query and params do not support numbers, objects, or booleans
  describe('mw.body(key).typeOf("number")',  typeOf('body', 'number', 1));
  describe('mw.body(key).typeOf("object")',  typeOf('body', 'object', {}));
  describe('mw.body(key).typeOf("boolean")', typeOf('body', 'boolean', true));

  describe('mw.body(keys...).typeOf("string")', typeOfKeys('body', 'string', 'value'));
  describe('mw.query(keys...).typeOf("string")', typeOfKeys('query', 'string', 'value'));
  describe('mw.params(keys...).typeOf("string")', typeOfKeys('params', 'string', 'value'));

  // query and params do not support numbers, objects, or booleans
  describe('mw.body(keys...).typeOf("number")',  typeOfKeys('body', 'number', 1));
  describe('mw.body(keys...).typeOf("object")',  typeOfKeys('body', 'object', {}));
  describe('mw.body(keys...).typeOf("boolean")', typeOfKeys('body', 'boolean', true));
});


function typeOf (dataType, type, value) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).typeOf(type));
    });
    if (dataType === 'body') {
      // body is the only dataType that supports more than just string
      // query array is tested in array test
      it('should error if key\'s value is not a '+type+' (if value exists)', function (done) {
        var body = {};
        body[this.key] = type === 'string' ? {} : 'foo'; // aka wrong type
        var typeRE = new RegExp(type);
        request(this.app)
          .post('/'+dataType)
          .send(body)
          .expect(400)
          .expect(function (res) {
            res.body.message.should.match(typeRE);
          })
          .end(done);
      });
    }
    it('should succeed if key\'s value is a '+type, function (done) {
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
    it('should fail if key does not exist', function (done) {
      var data = {};
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(400)
        .end(done);
    });
  };
}

function typeOfKeys (dataType, type, value) {
  return function () {
    before(function () {
      var keys = this.keys = ['key1', 'key2'];
      this.app = createAppWithMiddleware(mw[dataType](keys[0], keys[1]).typeOf(type));
    });
    it('should fail if all keys are not included', function (done) {
      var data = {};
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      request(this.app)
        .post('/'+dataType, params, query)
        .send(body)
        .expect(400)
        .end(done);
    });
    if (dataType === 'body') {
      // body is the only dataType that supports more than just string
      // query array is tested in array test
      it('should error if one key is included and not of type '+type, function (done) {
        var typeRE = new RegExp(type);
        var keys = this.keys;
        var count = createCounter(done);
        var body1 = {};
        body1[keys[0]] = type === 'string' ? {} : 'foo'; // aka wrong type
        request(this.app)
          .post('/body')
          .send(body1)
          .expect(400)
          .expect(function (res) {
            res.body.message.should.match(new RegExp(keys[0]));
            res.body.message.should.match(typeRE);
          })
          .end(count.inc().next);
        var body2 = {};
        body2[keys[1]] = type === 'string' ? {} : 'foo'; // aka wrong type
        request(this.app)
          .post('/body')
          .send(body2)
          .expect(400)
          .expect(function (res) {
            res.body.message.should.match(new RegExp(keys[0]));
            res.body.message.should.match(typeRE);
          })
          .end(count.inc().next);
      });
    }
    it('should succeed if all keys are of type '+type, function (done) {
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
