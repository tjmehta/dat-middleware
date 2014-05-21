module.exports = function (fn /*, bindArgs */) {
  var bindArgs = Array.prototype.slice.call(arguments, 1);

  return function (/* arguments */) {
    var args = Array.prototype.slice.call(arguments);
    args = args.concat(bindArgs);
    return fn.apply(null, args);
  };
};