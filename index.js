var RequestData = require('./lib/RequestData');
var requestDataFactory = require('./lib/requestDataFactory');

var mw = module.exports = function () {
  return requestDataFactory.apply(null, arguments);
};

mw.Boom        = require('boom');
mw.req         = requestDataFactory();
mw.body        = requestDataFactory('body');
mw.query       = requestDataFactory('query');
mw.params      = require('./lib/params');
mw.errorHandler= require('./lib/errorHandler');