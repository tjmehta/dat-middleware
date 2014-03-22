var express = require('express');
var mw = require('../../index');

module.exports = function createAppWithMiddleware (middleware) {
  var app = express();
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(app.router);
  app.use(mw.errorHandler({ showStack: true, log: false }));
  app.all('/body',
    // inspect,
    middleware,
    mw.body().send());
  app.all('/query',
    // inspect,
    middleware,
    mw.query().send());
  app.all('/params/:key1?/:key2?/:key3?/:key4?/:key5?',
    // inspect,
    middleware,
    mw.params().send());
  return app;
};

function inspect (req, res, next) {
  console.log('req.body', req.body);
  console.log('req.query', req.query);
  console.log('req.params', req.params);
  next();
}