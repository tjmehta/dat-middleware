var utils = require('map-utils');
var error = require('./error');

module.exports = {
  instanceOf: function (Class) {
    return function (val) {
      if (!val instanceof Class) {
        var err = error('must be instance of', Class.name);
        err.val = val;
        return err;
      }
    };
  },
  typeOf: function (type) {
    return function (val) {
      var typeOf = (typeof val === type);
      if (!typeOf) {
        var a = type.match(/^[aeiouAEIOU]/) ? 'an' : 'a';
        var err = error('must be', a, type);
        err.val = val;
        return err;
      }
    };
  },
  require: function () {
    return function (val) {
      if (!utils.exists(val)) {
        var err = error('is required');
        err.val = val;
        return err;
      }
    };
  },
  matches: function (re) {
    return function (val) {
      if (!re.test(val)) {
        var err = error('should match '+re.toString());
        err.val = val;
        return err;
      }
    };
  }
};