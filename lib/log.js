var replaceKeypaths = require('./utils/replaceKeypaths');

module.exports = log;

function log (/* keypathArgs */) {
  var keypathArgs = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    var args = replaceKeypaths(req, keypathArgs);
    console.log.apply(console, args);
    next();
  };
}