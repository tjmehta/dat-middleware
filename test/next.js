var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var series = require('middleware-flow').series;
var request = require('./lib/superdupertest');
var spyOnMethod = require('function-proxy').spyOnMethod;
var createCount = require('callback-count');

describe('next', function() {
  describe('normal next', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.next(new Error('boom'))
      );
    });
    it('should work pass args to console.log', function (done) {
      request(this.app)
        .get('/')
        .expect(500)
        .expect(function (res) {
          res.body.message.should.equal('boom');
        })
        .end(done);
    });
  });

  describe('keypaths', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.req().set('err', new Error('boom')),
        mw.next('err')
      );
    });
    it('should work replace keypaths before console.log', function (done) {
      request(this.app)
        .get('/')
        .expect(500)
        .expect(function (res) {
          res.body.message.should.equal('boom');
        })
        .end(done);
    });
  });
});