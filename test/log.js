var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var series = require('middleware-flow').series;
var request = require('./lib/superdupertest');
var spyOnMethod = require('function-proxy').spyOnMethod;
var createCount = require('callback-count');

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
      spyOnMethod(console, 'log', function () {
        var args = Array.prototype.slice.call(arguments);
        if (args[0] === 'hello') {
          ['hello', 10, 'world'].should.eql(args);
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
      spyOnMethod(console, 'log', function () {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === 'object' && args[0].foo) {
          args[0].should.eql({ foo: 'bar' });
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
