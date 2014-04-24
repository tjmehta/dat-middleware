var pick = require('map-utils').pick;
var exists = require('map-utils').exists;
var NODE_ENV = process.env.NODE_ENV;

module.exports = function (opts) {
  opts = opts || {};
  opts.showStack = exists(opts.showStack) ? opts.showStack :
    NODE_ENV === 'development';
  opts.log = exists(opts.log) ? opts.log :
    NODE_ENV !== 'testing';
  var keys = ['message'];
  if (opts.showStack) {
    keys.push('stack');
  }
  return function (err, req, res, next) {
    if (opts.log) logErrors(err);
    var errs;
    if (Array.isArray(err)) {
      errs = err.map(pick(keys));
      var statusCode = errs[0].output.statusCode;
      res.json(statusCode, { errors: errs });
    }
    else if (err.isBoom) {
      res.json(err.output.statusCode, pick(keys)(err));
    }
    else {
      res.json(500, pick(keys)(err));
    }
  };
};

function logErrors (errs) {
  errs = Array.isArray(errs) ? errs : [errs];
  errs.forEach(function (err) {
    console.error(err);
    console.error(err.stack);
  });
}
