var _ = require('lodash');
var utils = require('map-utils');

module.exports = function (opts) {
  var keys = ['message'];
  if (opts.showStack) {
    keys.push('stack');
  }
  return function (err, req, res, next) {
    var errs;
    if (Array.isArray(err)) {
      errs = err.map(utils.pick(keys));
      var statusCode = _.first(errs).output.statusCode;
      res.json(statusCode, { errors: errs });
    }
    else {
      if (err.isBoom) {
        res.json(err.output.statusCode, _.pick(err, keys));
      }
      else {
        res.json(500, _.pick(err, keys));
      }
    }
  };
};