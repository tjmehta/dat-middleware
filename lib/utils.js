module.exports = {
  /**
   * @method
   * @param {...key} string - keys which you want to keep.
   */
  pick: function (/* ...keys */) {
    var keys = Array.prototype.slice.call(arguments);
    return function (obj) {
      return keys.reduce(copyKey, {});
    };
    function copyKey (result, key) {
      result[key] = obj[key];
      return result;
    }
  },
  /**
   * @method
   * @param {...key} string - keys which you want to keep.
   */
  pluck: function (/* ...keys */) {
    var keys = Array.prototype.slice.call(arguments);
    return function (obj) {
      var results = keys.reduce(pluckObj, []);
      return results.length === 1 ? results[0] : results;
      function pluckObj (results, key, i) {
        results[i] = results[i] || [];
        results[i].push(obj[key]);
        return results;
      }
    };
  },
  /**
   * @method
   * @param {...key} string - keys which you want to keep.
   */
  set: function (key, val) {
    var keys = Array.prototype.slice.call(arguments);
    return function (obj) {
      obj[key] = val;
      return obj;
    };
  },
  /**
   * @method
   * @param {...val} any - keys which you want to keep.
   */
  exists: function (/* ...keys */) {
    var vals = Array.prototype.slice.call(arguments);
    return vals.length !== 0 &&
      vals.every(notNullOrUndefined);
    function notNullOrUndefined (val) {
      return val !== null && val !== undefined;
    }
  }
};