var replaceKeypaths = require('./utils/replaceKeypaths');

var endMethods = ['send', 'json', 'end', 'redirect'];
function middlewarizeResMethod (method) {
  return function (/* keypathArgs */) {
    var keypathArgs = Array.prototype.slice.call(arguments);
    return function (req, res, next) {
      var args = keypathArgs[2]? // if exact=true, dont replace keypaths
        keypathArgs.slice(0,2):
        replaceKeypaths(req, keypathArgs.slice(0,2));
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

module.exports = res;