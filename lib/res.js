var isNumber = require('101/is-number');
var replaceKeypaths = require('./utils/replaceKeypaths');

var endMethods = ['send', 'json', 'end', 'redirect'];
function middlewarizeResMethod (method) {
  return function (/* keypathArgs */) {
    var keypathArgs = Array.prototype.slice.call(arguments);
    return function (req, res, next) {
      var args = keypathArgs[2]? // if exact=true, dont replace keypaths
        keypathArgs.slice(0,2):
        replaceKeypaths(req, keypathArgs.slice(0,2));
      if (args[0] && isNumber(args[0]) && method !== 'redirect') {
        var code = args.shift();
        res.status(code);
      }
      // 'cause we used status, have to just check it again
      if (method !== 'status') {
        res[method].apply(res, args);
      }
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
