var RequestData = require('./lib/RequestData');
var requestDataFactory = require('./lib/requestDataFactory');

var mw = module.exports = function () {
  return requestDataFactory.apply(null, arguments);
};

mw.Boom        = require('boom');
mw.req         = requestDataFactory();
mw.res         = require('./lib/res');
mw.next        = require('./lib/next');
mw.body        = requestDataFactory('body');
mw.query       = requestDataFactory('query');
mw.headers     = requestDataFactory('headers');
mw.params      = require('./lib/params');
mw.log         = require('./lib/log');
mw.errorHandler= require('./lib/errorHandler');
