var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');

var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

describe('validations', function () {
  describe('mw.body(keys...).string()', matches('body', 'string', ''));
  describe('mw.body(keys...).string()', matches('body', 'string', 'a b c'));
  describe('mw.body(keys...).string()', matches('body', 'string', 'test-string'));
  describe('mw.body(keys...).number()', matches('body', 'number', 0));
  describe('mw.body(keys...).number()', matches('body', 'number', -123));
  describe('mw.body(keys...).number()', matches('body', 'number', 123));
  describe('mw.body(keys...).object()', matches('body', 'object', {}));
  describe('mw.body(keys...).object()', matches('body', 'object', {foo: 'bar'}));
  describe('mw.body(keys...).boolean()', matches('body', 'boolean', true));
  describe('mw.body(keys...).boolean()', matches('body', 'boolean', false));
  describe('mw.body(keys...).array()', matches('body', 'array', []));
  describe('mw.body(keys...).array()', matches('body', 'array', [1, 2, 3]));
});

function checkResponseMatch(dataType, headers, data) {
  return function (res) {
    if (dataType === 'headers') {
      Object.keys(headers).forEach(function (key) {
        res.body[key].should.match(data[key]);
      });
    } else {
      res.body.should.match(data);
    }
  };
}

function matches (dataType, checkType, value) {
  return function () {
    before(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key)[checkType]());
    });
    // body is the only dataType that supports more than just string
    // query array is tested in array test
    it('should error if key\'s value is not instance of '+checkType+' (if value exists)', function (done) {
      var data = {};
      data[this.key] = (checkType === 'string') ? 1 : 'notmatch';
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      var headers = dataType === 'headers' ? data : {};
      request(this.app)
        .post('/'+dataType, params, query)
        .set(headers)
        .send(body)
        .expect(400)
        .end(done);
    });
    it('should succeed if key\'s value is instanceof '+checkType, function (done) {
      var data = {};
      data[this.key] = value;
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      var headers = dataType === 'headers' ? data : {};
      request(this.app)
        .post('/'+dataType, params, query)
        .set(headers)
        .send(body)
        .expect(200)
        .expect(checkResponseMatch(dataType, headers, data))
        .end(done);
    });
    it('should fail if key does not exist', function (done) {
      var data = {};
      var body = dataType === 'body' ? data : {};
      var query = dataType === 'query' ? data : {};
      var params = dataType === 'params' ? values(data) : [];
      var headers = dataType === 'headers' ? data : {};
      request(this.app)
        .post('/'+dataType, params, query)
        .set(headers)
        .send(body)
        .expect(400)
        .end(done);
    });
  };
}


