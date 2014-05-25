var isString = require('101/is-string');
var exists = require('101/exists');
var keypather = require('keypather')();

function replaceKeypaths (req, args) {
  return args.map(function (arg) {
    if (isString(arg)) {
      var keypathVal = keypather.get(req, arg);
      return exists(keypathVal) ? keypathVal : arg;
    }
    else {
      return arg;
    }
  });
}

var endMethods = ['send', 'json', 'end'];
function middlewarizeResMethod (method) {
  return function (/* keypathArgs */) {
    var keypathArgs = Array.prototype.slice.call(arguments);
    return function (req, res, next) {
      var args = replaceKeypaths(req, keypathArgs);
      res[method].apply(res, args);
      if (!~endMethods.indexOf(method)) {
        next();
      }
    };
  };
}

var res = {};
[
  'send',
  'json',
  'write',
  'end',
  'status',
  'redirect'
].forEach(function (method) {
  res[method] = middlewarizeResMethod(method);
});

// only a function to match the rest of the middlewares
module.exports = function () {
  return res;
};