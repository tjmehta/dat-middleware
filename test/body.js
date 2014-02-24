var createAppWithMiddleware = require('./fixtures/createAppWithMiddleware');
var mw = require('../index');
var request = require('supertest');

describe('mw.body(keys...).require()', function () {
  beforeEach(function () {
    this.app = createAppWithMiddleware(mw.body('data').require());
  });
  it('should error if required key not included', function (done) {
    request(this.app)
      .post('/body')
      .send({})
      .expect(400)
      .expect(function (res) {
        res.body.message.should.match(/required/);
      })
      .end(done);
  });
  it('should succeed if required key included', function (done) {
    var data = {data:1};
    request(this.app)
      .post('/body')
      .send(data)
      .expect(200, data)
      .end(done);
  });
});