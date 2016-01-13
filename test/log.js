var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var createCount = require('callback-count');
var mw = require('../index');
var request = require('./lib/superdupertest');
var series = require('middleware-flow').series;
var sinon = require('sinon');

describe('log', function() {
  describe('normal logging', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.log('hello', 10, 'world'),
        mw.res.send(200)
      );
    });
    it('should work pass args to console.log', function (done) {
      var count = createCount(2, done);
      sinon.stub(console, 'log', function () {
        var args = Array.prototype.slice.call(arguments);
        if (args[0] === 'hello') {
          ['hello', 10, 'world'].should.eql(args);
          console.log.restore();
          count.next();
        }
      });
      request(this.app)
        .get('/')
        .expect(200)
        .end(count.next);
    });
  });

  describe('keypaths', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.log('body'),
        mw.res.send(200)
      );
    });
    it('should work replace keypaths before console.log', function (done) {
      var count = createCount(2, done);
      sinon.stub(console, 'log', function () {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === 'object' && args[0].foo) {
          args[0].should.eql({ foo: 'bar' });
          console.log.restore();
          count.next();
        }
      });
      request(this.app)
        .get('/')
        .send({ foo: 'bar' })
        .expect(200)
        .end(count.next);
    });
  });
});
