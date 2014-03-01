var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var createCounter = require('callback-count');
var request = require('./lib/superdupertest');
var values = function (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

describe('mw.body(key).typeOf("string")', typeOf('body', 'string', 'value'));
describe('mw.query(key).typeOf("string")', typeOf('query', 'string', 'value'));
describe('mw.params(key).typeOf("string")', typeOf('params', 'string', 'value'));

// query and params do not support numbers, objects, or booleans
describe('mw.body(key).typeOf("number")', typeOf('body', 'number', 1));
describe('mw.body(key).typeOf("object")', typeOf('body', 'object', {}));
describe('mw.body(key).typeOf("boolean")', typeOf('body', 'boolean', true));

function typeOf (dataType, type, value) {
  return function () {
    beforeEach(function () {
      this.key = 'key1';
      this.app = createAppWithMiddleware(mw[dataType](this.key).typeOf(type));
    });
    if (dataType === 'body') { // body is the only dataType that supports more than just string
      it('should error if key\'s value is not a '+type+' (if key exists)', function (done) {
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
    if (dataType === 'body') { // body is the only dataType that supports non-existant key
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
    }
  };
}

// describe('mw.body(keys...).typeOf("string")', typeOfKeys('body', 'string', 'value'));
// describe('mw.query(keys...).typeOf("string")', typeOfKeys('query', 'string', 'value'));
// describe('mw.params(keys...).typeOf("string")', typeOfKeys('params', 'string', 'value'));

// function typeOfKeys (dataType, type, value) {
//   return function () {
//     beforeEach(function () {
//       var keys = this.keys = ['key1', 'key2'];
//       this.app = createAppWithMiddleware(mw[dataType](keys[0], keys[1]).require());
//     });
//     it('should error if all keys are not included', function (done) {
//       var keys = this.keys;
//       var body = {};
//       var query = {};
//       var params = values({});
//       request(this.app)
//         .post('/'+dataType, params, query)
//         .send(body)
//         .expect(400)
//         .expect(function (res) {
//           res.body.message.should.match(new RegExp(keys[0]));
//           res.body.message.should.match(/required/);
//         })
//         .end(done);
//     });
//     it('should error if one key is not included', function (done) {
//       var keys = this.keys;
//       var count = createCounter(done);
//       var data1 = {};
//       data1[keys[0]] = 'value1';
//       var body1 = dataType === 'body' ? data1 : {};
//       var query1 = dataType === 'query' ? data1 : {};
//       var params1 = dataType === 'params' ? values(data1) : [];
//       request(this.app)
//         .post('/'+dataType, params1, query1)
//         .send(data1)
//         .expect(400)
//         .expect(function (res) {
//           res.body.message.should.match(new RegExp(keys[1]));
//           res.body.message.should.match(/required/);
//         })
//         .end(count.inc().next);
//       if (dataType !== 'params') {
//         var data2 = {};
//         data2[keys[1]] = 'value2';
//         var body2 = dataType === 'body' ? data2 : {};
//         var query2 = dataType === 'query' ? data2 : {};
//         request(this.app)
//           .post('/'+dataType, query2)
//           .send(data2)
//           .expect(400)
//           .expect(function (res) {
//             res.body.message.should.match(new RegExp(keys[0]));
//             res.body.message.should.match(/required/);
//           })
//           .end(count.inc().next);
//       }
//     });
//     it('should succeed if required key included', function (done) {
//       var keys = this.keys;
//       var data = {};
//       data[keys[0]] = 'value1';
//       data[keys[1]] = 'value2';
//       var body = dataType === 'body' ? data : {};
//       var query = dataType === 'query' ? data : {};
//       var params = dataType === 'params' ? values(data) : [];
//       request(this.app)
//         .post('/'+dataType, params, query)
//         .send(body)
//         .expect(200, data)
//         .end(done);
//     });
//   };
// }