var Boom = require('boom');

module.exports = function (/* messageSplit */) {
  var message = Array.prototype.slice.call(arguments).join(' ');
  var err = Boom.badRequest(message);
  return err;
};