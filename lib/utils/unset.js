var keypather = require('keypather')();

module.exports = function () {
  var keypaths = Array.prototype.slice.call(arguments);
  return function (obj) {
    keypaths.forEach(function (keypath) {
      keypather.del(obj || {}, keypath);
    });
    return obj;
  };
};