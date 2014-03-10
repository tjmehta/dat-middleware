var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var request = require('./lib/superdupertest');
var err = new Error('boom');
var appendReqBody = function (key, val) {
  return function (req, res, next) {
    var bodyVal = req.body[key];
    req.body[key] = bodyVal === undefined ? val : bodyVal + val;
    next();
  };
};
var nextError = function (err) {
  return function (req, res, next) {
    next(err);
  };
};
function pass (req, res, cb) { cb(); }

describe('conditionals', function () {
  describe('ifPass', function () {
    describe('mw.body().if(key).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('if', 'key1', { key1: true}));
      describe('else', conditionalFail('if', 'key2', { key1: true}));
    });
    describe('mw.body().if(keys...).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('if', ['key1', 'key2'], { key1: true, key2: true }));
      describe('else', conditionalFail('if', ['key2', 'key3'], { key1: true, key2: true }));
    });
    describe('mw.body().if({ or: keys... }).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('if', {or:['key1', 'key2']}, { key1: true }));
      describe('else', conditionalFail('if', {or:['key2', 'key3']}, { key1: true }));
    });
    describe('mw.body().ifExists(key).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('ifExists', 'key1', { key1: true}));
      describe('else', conditionalFail('ifExists', 'key2', { key1: true}));
    });
    describe('mw.body().ifExists(keys...).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('ifExists', ['key1', 'key2'], { key1: true, key2: true }));
      describe('else', conditionalFail('ifExists', ['key2', 'key3'], { key1: true, key2: true }));
    });
    describe('mw.body().ifExists({ or: keys... }).then(mw..).else(mw...)', function () {
      describe('if then', conditionalPass('ifExists', {or:['key1', 'key2']}, { key1: true }));
      describe('else', conditionalFail('ifExists', {or:['key2', 'key3']}, { key1: true }));
    });
  });
});

function conditionalPass (method, key, body) {
  return function () {
    beforeEach(function () {
      var mwBody = mw.body();
      var conditional = Array.isArray(key) ?
        mwBody[method].apply(mwBody, key):
        mwBody[method].call(mwBody, key);
      this.app = createAppWithMiddleware(
        conditional
          .then(
            appendReqBody('key', '1'),
            appendReqBody('key', '2'),
            appendReqBody('key', '3')
          )
          .else(nextError(err))
      );
    });
    it('should run middlewares in then if it passes', function (done) {
      request(this.app)
        .post('/body')
        .send(body)
        .expect(200)
        .expect(function (res) {
          res.body.key.should.equal('123');
        })
        .end(done);
    });
  };
}

function conditionalFail (method, key, body) {
  return function () {
    before(function () {
      var mwBody = mw.body();
      var conditional = Array.isArray(key) ?
        mwBody[method].apply(mwBody, key):
        mwBody[method].call(mwBody, key);
      this.app = createAppWithMiddleware(
        conditional
          .then(
            appendReqBody('key', '1'),
            appendReqBody('key', '2'),
            appendReqBody('key', '3')
          )
          .else(nextError(err))
      );
    });
    it('should run middlewares in then if it passes', function (done) {
      request(this.app)
        .post('/body')
        .send(body)
        .expect(500)
        .expect(function (res) {
          res.body.message.should.equal('boom');
        })
        .end(done);
    });
  };
}