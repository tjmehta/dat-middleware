var express = require('express');
var mw = require('../../index');

module.exports = function createAppWithMiddleware (middleware) {
  var app = express();
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(mw.errorHandler({ showStack: true }));
  app.all('/body',
    middleware,
    mw.body().send());
  // app.all('/query', sendQuery);
  // app.all('/params', sendParams);
  return app;
};