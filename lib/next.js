module.exports = function () {
  var args = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    next.apply(null, args);
  };
};