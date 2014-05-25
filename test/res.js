var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var series = require('middleware-flow').series;
var request = require('./lib/superdupertest');

describe('res', function() {
  describe('send', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.res().send(201, 'hello')
      );
    });
    it('should work like res.send', function (done) {
      request(this.app)
        .get('/')
        .expect(201, 'hello')
        .end(done);
    });
  });
  describe('json', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        mw.res().json(201, {foo:'bar'})
      );
    });
    it('should work like res.json', function (done) {
      request(this.app)
        .get('/')
        .expect(201, {foo:'bar'})
        .end(done);
    });
  });
  describe('status, write, and end', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        series(
          mw.res().status(201),
          mw.res().write('h'),
          mw.res().write('e'),
          mw.res().write('y'),
          mw.res().end()
        )
      );
    });
    it('should work like res.json', function (done) {
      request(this.app)
        .get('/')
        .expect(201, 'hey')
        .end(done);
    });
  });
  describe('redirect', function() {
    beforeEach(function () {
      this.app = createAppWithMiddleware(
        series(
          mw.res().redirect(301, '/body')
        )
      );
    });
    it('should work like res.json', function (done) {
      request(this.app)
        .get('/')
        .send('echo')
        .expect(301)
        .end(done);
    });
  });
});