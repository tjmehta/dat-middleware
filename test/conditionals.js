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
  describe('then', function () {
    before(function () {
      this.app = createAppWithMiddleware(
        mw.body('key').require()
          .then(appendReqBody('key', '1'))
          .else(appendReqBody('key', '2'))
      );
    });
    it('should execute "then-middlewares" the validation passes', function (done) {
      request(this.app)
        .post('/body')
        .send({ key: 'val' })
        .expect({ key: 'val1' })
        .end(done);
    });
  });
  describe('only then, failing', function () {
    before(function () {
      this.app = createAppWithMiddleware(
        mw.body('nonexistant').require()
          .then(appendReqBody('key', '3'))
      );
    });
    it('should not execute "then-middlewares" the validation passes', function (done) {
      request(this.app)
        .post('/body')
        .send({ key: 'val' })
        .expect({ key: 'val' })
        .end(done);
    });
  });
  describe('match, only then, failing', function () {
    before(function () {
      this.app = createAppWithMiddleware(
        mw.body('nonexistant').matches(/^nope$/)
          .then(appendReqBody('key', '3'))
      );
    });
    it('should not execute "then-middlewares" the validation passes', function (done) {
      request(this.app)
        .post('/body')
        .send({ key: 'val' })
        .expect({ key: 'val' })
        .end(done);
    });
  });
  describe('else', function () {
    before(function () {
      this.app = createAppWithMiddleware(
        mw.body('nonexistant').require()
          .then(appendReqBody('key', '1'))
          .else(appendReqBody('key', '2'))
      );
    });
    it('should execute "else-middlewares" the validation passes', function (done) {
      request(this.app)
        .post('/body')
        .send({ key: 'val' })
        .expect({ key: 'val2' })
        .end(done);
    });
  });
});
