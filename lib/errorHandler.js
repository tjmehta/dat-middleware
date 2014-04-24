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
      var statusCode = errs[0].output.statusCode;
      res.json(statusCode, { errors: errs });
    }
    else {
      if (err.isBoom) {
        res.json(err.output.statusCode, utils.pick(keys)(err));
      }
      else {
        res.json(500, utils.pick(keys)(err));
      }
    }
  };
};