var express = require('express');
var mw = require('../../index');
var next = function (req, res, next) {next();};

module.exports = function createAppWithMiddleware (middleware, middleware2, middleware3) {
  middleware2 = middleware2 || next;
  middleware3 = middleware3 || next;
  var app = express();
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(app.router);
  app.use(mw.errorHandler({ showStack: true, log: false }));
  app.all('/',
    middleware,
    middleware2,
    middleware3);
  app.all('/body',
    // inspect,
    middleware,
    mw.body().send());
  app.all('/query',
    // inspect,
    middleware,
    mw.query().send());
  app.all('/headers',
    // inspect,
    middleware,
    mw.headers().send());
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
  console.log('req.headers', req.headers);
  next();
}
