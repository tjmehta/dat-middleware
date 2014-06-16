var replaceKeypaths = require('./utils/replaceKeypaths');
module.exports = function () {
  var args = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    var nextArgs = replaceKeypaths(req, args);
    next.apply(null, nextArgs);
  };
};