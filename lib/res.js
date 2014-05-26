var isString = require('101/is-string');
var exists = require('101/exists');
var keypather = require('keypather')();

function replaceKeypaths (req, args, dontReplace) {
  return args.map(function (arg) {
    var kpArgs;
    if (isString(arg)) {
      kpArgs = [arg];
    }
    else if (Array.isArray(arg)) {
      kpArgs = arg;
    }
    else {
      return arg;
    }
    if (!dontReplace && kpArgs.length>1) {
      kpArgs = [kpArgs[0]].concat(replaceKeypaths(req, kpArgs.slice(1), true));
    }
    kpArgs = [req].concat(kpArgs);
    var keypathVal = keypather.get.apply(keypather, kpArgs);
    return exists(keypathVal) ? keypathVal : arg;
  });
}

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