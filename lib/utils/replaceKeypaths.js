var isString = require('101/is-string');
var exists = require('101/exists');
var keypather = require('keypather')();

module.exports = function replaceKeypaths (req, args, dontReplace) {
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
};