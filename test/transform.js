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

describe('transform', function () {
  describe('mw.body(key).transform(parseAsInt)', transformKey('body', '1', parseAsInt));
  describe('mw.body(key).transform(parseAsInt)', transformKey('query', '1', parseAsInt));
  describe('mw.body(key).transform(parseAsInt)', transformKey('params', '1', parseAsInt));
  describe('mw.body(keys...).transform(parseAsInt)', transformKeys('body', '1', parseAsInt));
  describe('mw.body(keys...).transform(parseAsInt)', transformKeys('query', '1', parseAsInt));
  describe('mw.body(keys...).transform(parseAsInt)', transformKeys('params', '1', parseAsInt));
});

function transformKey (dataType, value, transformation) {
  return function () {
    beforeEach(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).transform(transformation));
    });
    it('should transform '+dataType+' key', function (done) {
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

function transformKeys (dataType, value, transformation) {
  return function () {
    beforeEach(function () {
      this.keys = ['key1', 'key2'];
      this.app = createAppWithMiddleware(mw[dataType](this.keys[0], this.keys[1]).transform(transformation));
    });
    it('should transform '+dataType+' keys', function (done) {
      var data = {};
      data[this.keys[0]] = value;
      data[this.keys[1]] = value;
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