var _ = require('lodash');
var error = require('./error');
var utils = require('./utils');
var pick   = utils.pick;
var exists = utils.exists;
var valueForKeypath = require('value-for-keypath');
var objectHasKeypath = function (obj, keypath) {
  var keys = keypath.split('.');
  var lastKey = keys.pop();
  try {
    if (keys.length) {
      obj = valueForKeypath(obj, keys.join('.'));
    }
    return Boolean(~Object.keys(obj).indexOf(lastKey));
  }
  catch (err) {
    return false;
  }
};
var returnTrue = function () { return true; };
var or = utils.or;
var ternary = utils.ternary;
var series = utils.series;
var validations = require('./validations');

/**
 * Represents a RequestData middleware.
 * @constructor
 * @param {string} dataType - query, body, params, headers, or other.
 */
var RequestData = module.exports = function (dataType) {
  this.dataType = dataType;
  if (dataType === 'query') {
    this.dataName = 'query parameter';
  } else if (dataType === 'body') {
    this.dataName = 'body parameter';
  } else if (dataType === 'params') {
    this.dataName = 'url parameter';
  } else if (dataType === 'headers') {
    this.dataName = 'header';
  } else {
    this.dataName = '';
  }
  this.steps = [];
  this.nextOnFirstError = true;
};
RequestData.prototype._validateStep = function (req, step) {
  var self = this;
  var err, errs;
  var keypath = self.keypath.bind(self);
  var reqValueForKeyPath = valueForKeypath.bind(null, req);
  var filter = this.required ?
    returnTrue : objectHasKeypath.bind(null, req);
  if (this.nextOnFirstError) {
    this._keys
      .map(keypath)
      .filter(filter)
      .map(reqValueForKeyPath)
      .some(firstError);
    return err;
  }
  else {
    errs = this._keys
      .map(keypath)
      .filter(returnTrue)
      .map(reqValueForKeyPath)
      .map(step.validate)
      .filter(exists)
      .map(formatError);
    return errs;
  }
  function firstError (value, i) {
    err = step.validate(value);
    if (err) {
      err = formatError(err, i);
    }
    return err;
  }
  function formatError (err, i) {
    var key = self._keys[i];
    err.message = [self.dataName, '"'+key+'"', err.message].join(' ').trim();
    return err;
  }
};
RequestData.prototype._transformStep = function (req, step) {

};
/**
 * @method
 */
RequestData.prototype.keypath = function (key) {
  return [this.dataType, key].filter(exists).join('.');
};
/**
 * @method
 * @param {...key} string - keys on the request data to validate.
 */
RequestData.prototype.keys = function (/* ...keys */) {
  this._keys = Array.prototype.slice.call(arguments);

  return this;
};
/**
 * @method
 */
RequestData.prototype.exec = function (req, res, next) {
  var self = this;
  var errors = [];
  if (this.nextOnFirstError) {
    this.steps.some(some);
  }
  else {
    this.steps.every(every);
  }
  function some (step) {
    var err;
    if (step.type === 'validation') {
      err = self._validateStep(req, step);
      next(err);
      return true; // break loop
    }
    else if (step.type.indexOf('transform') === 0) {
      self._transformStep(req, step);
    }
    else {
      console.error('invalid step:');
      console.error(step);
      err = new Error('unknown step type: ' + step.type);
      next(err);
    }
  }
  function every (step) {
    if (step.type === 'validation') {
      errors.concat(self._validateStep(req, step));
    }
    else if (step.type.indexOf('transform') === 0) {
      self._transformStep(req, step);
    }
    else {
      console.error('invalid step:');
      console.error(step);
      err = new Error('unknown step type: ' + step.type);
      next(err);
    }
  }
};
/**
 * @method
 */
RequestData.prototype.all = function () {
  this.nextOnFirstError = false;
};
/**
 * @method
 * @param {code} [number] - status code
 * @param {code} [key] - key on data to send, if no key it will send the whole object.
 */
RequestData.prototype.send = respond('send');
/**
 * @method
 * @param {code} [number] - status code
 * @param {code} [key] - key on data to send as json, if no key it will send the whole object.
 */
RequestData.prototype.json = respond('json');
function respond (method) {
  return function (code, key) {
    code = (typeof code === 'number') ? code : 200;
    key  = (typeof code === 'string') ? code : key;
    key  = key || (this._keys.length === 1) ? this._keys[0] : key;
    var dataType = this.dataType;
    var self = this;

    return function (req, res, next) {
      if (self._keys.length) {
        self.exec(req, res, send);
      }
      else {
        send();
      }
      function send (err) {
        if (err) {
          return next(err);
        }
        var data = valueForKeypath(req, self.keypath(key));
        res[method](code, data);
      }
    };
  };
}

/*************** VALIDATIONS ***************/
/*************** VALIDATIONS ***************/
/*************** VALIDATIONS ***************/

/**
 * @method
 * @param {function} Class - Class to assert keys are an instance of.
 */
RequestData.prototype.instanceOf = function (Class) {
  if (!Class) {
    throw new Error('instanceOf requires a Class');
  }
  this.steps.push({
    type: 'validation',
    validate: validations.instanceOf(Class)
  });
  return this;
};
/**
 * @method
 * @param {string} type - type to assert keys are a type of.
 */
RequestData.prototype.typeOf = function (type) {
  if (!type) {
    throw new Error('typeOf requires a type string');
  }
  this.steps.push({
    type: 'validation',
    validate: validations.typeOf(type)
  });
  return this;
};
/**
 * assert keys are typeOf('string')
 * @method string
 */
/**
 * assert keys are typeOf('number')
 * @method number
 */
/**
 * assert keys are typeOf('object')
 * @method object
 */
/**
 * assert keys are typeOf('function')
 * @method function
 */
/**
 * assert keys are typeOf('boolean')
 * @method function
 */
['string', 'number', 'object', 'function', 'boolean'].forEach(function (typeString) {
  RequestData.prototype[typeString] = function () {
    this.typeOf(typeString);
    return this;
  };
});
/**
 * assert keys are instanceOf(Array)
 * @method function
 */
RequestData.prototype.array = function () {
  this.instanceOf(Array);
  return this;
};
/**
 * assert keys exist
 * @method function
 */
RequestData.prototype.require = function () {
  this.required = true;
  this.steps.push({
    type: 'validation',
    validate: validations.require()
  });
  return this;
};

/*************** TRANSFORMATIONS ***************/
/*************** TRANSFORMATIONS ***************/
/*************** TRANSFORMATIONS ***************/

/**
 * transform key using function
 * @method function
 * @param {function} transformation - function to transform value of key with.
 */
RequestData.prototype.transform = function (transformation) {
  this.steps.push({
    type: 'transform',
    transformation: transformation
  });
};
/**
 * transform pick keys
 * @param {...key} string - keys on the request data to validate.
 */
RequestData.prototype.pick = function (/* ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  this.keys.apply(this, keys);
  this.steps.push({
    type: 'transformObject',
    transformation: pick(keys)
  });
};
/**
 * transform pick keys
 * @param {...key} string - keys on the request data to validate.
 */
RequestData.prototype.pick = function (/* ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  this.keys.apply(this, keys);
  this.steps.push({
    type: 'transformObject',
    transformation: pick(keys)
  });
};


module.exports.createRequestData = function (dataType) {
  var requestDataObject = new RequestData(dataType);
  var requestData = function (req, res, next) {
    requestData.exec.call(requestData, req, res, next);
  };
  for (var key in requestDataObject) {
    if (requestDataObject.hasOwnProperty(key)) {
      requestData[key] = requestDataObject[key];
    }
  }
  requestData.__proto__ = Object.getPrototypeOf(requestDataObject);

  return requestData;
};



// RequestData.prototype.transform = function (key, fn) {
//   return function (req, res, next) {
//     req[key] = fn(req[key]);
//     next();
//   };
// };
// RequestData.prototype.decodeId = function (/*keys*/) {
//   var dataType = this.dataType;
//   var keys = Array.prototype.slice.call(arguments);
//   return series(
//     this.isObjectId64.apply(this, keys),
//     decodeAll
//   );
//   function decodeAll (req, res, next) {
//     keys.forEach(function (key) {
//       req[dataType][key] = utils.decodeId(req[dataType][key]);
//     });
//     next();
//   }
// };
// RequestData.prototype.pickAndRequire = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   return series(
//     this.pick.apply(this, args),
//     this.require.apply(this, args)
//   );
// };
// RequestData.prototype.pickAndRequireOne = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   return series(
//     this.pick.apply(this, args),
//     this.requireOne.apply(this, args)
//   );
// };
// RequestData.prototype.require = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' is required';
//   return this.every(utils.exists, 400, errMessage)(args);
// };
// RequestData.prototype.requireOne = function (/* keys */) {
//   var self = this;
//   var keys = Array.prototype.slice.call(arguments);
//   var requires = keys.map(function (key) {
//     return self.require(key);
//   });
//   var requireOne = or.apply(null, requires);
//   var message = utils.arrayToString(keys, 'or', this.dataName+' is required');
//   return ternary(requireOne,
//       utils.next,
//       utils.error(400, message));
// };
// RequestData.prototype.equals = function (key, value) {
//   var self = this;
//   return function (req, res, next) {
//     if (req[self.dataType][key] === value) {
//       next();
//     } else {
//       next(error(400, self.dataName + ' ' + key + ' does not match ' + value));
//     }
//   };
// };
// RequestData.prototype.contains = function (key, value) {
//   var self = this;
//   var re = new RegExp(value);
//   return function (req, res, next) {
//     if (re.test(req[self.dataType][key])) {
//       next();
//     } else {
//       next(error(400, self.dataName + ' ' + key + ' does not match ' + value));
//     }
//   };
// };
// RequestData.prototype.pick = function (/* keys */) {
//   var keys = Array.prototype.slice.call(arguments);
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     req[dataType] = _.pick(req[dataType], keys);
//     next();
//   };
// };
// RequestData.prototype.isTrue = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' must be true';
//   return this.every(isTrue, 400, errMessage)(args);
//   function isTrue (val) {
//     return val === true;
//   }
// };
// RequestData.prototype.trim = function (/* keys */) {
//   var keys = Array.prototype.slice.call(arguments);
//   var dataType = this.dataType;
//   return series(
//     this.isString.apply(this, arguments),
//     trimAll
//   );
//   function trimAll (req, res, next) {
//     keys.forEach(function (keyKey) {
//       var key = utils.replacePlaceholders(req, keyKey);
//       req[dataType][key] = req[dataType][key].trim();
//       next();
//     });
//   }
// };
// RequestData.prototype.isString = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' must be a string';
//   return this.every(utils.isString, 400, errMessage)(args);
// };
// RequestData.prototype.isNumber = function (/* keys */) {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' must be a number';
//   return this.every(utils.isNumber, 400, errMessage)(args);
// };
// RequestData.prototype.instanceOf = function (key, Class) {
//   var dataType = this.dataType;
//   var self = this;
//   return function (req, res, next) {
//     var lowercaseClassName = (Class.name || '').toLowerCase();
//     var instanceofClass = (req[dataType][key] instanceof Class);
//     var typeofClassName = typeof req[dataType][key] === lowercaseClassName;
//     if (!instanceofClass && !typeofClassName) {
//       return next(error(400, '"'+key+'" '+self.dataName+' must be an '+lowercaseClassName));
//     }
//     next();
//   };
// };
// RequestData.prototype.isObjectId = function () {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' must be an object id';
//   return this.every(utils.isObjectId, 400, errMessage)(args);
// };
// RequestData.prototype.isObjectIdArray = function () {
//   var args = Array.prototype.slice.call(arguments);
//   args = args.map(function (arg) {
//     return !Array.isArray(arg)? [arg] : arg;
//   });
//   var errMessage = '"{{key}}" '+this.dataName+' must be an array of object ids';
//   return this.every(utils.isObjectIdArray, 400, errMessage)(args);
// };
// RequestData.prototype.isObjectId64 = function () {
//   var args = Array.prototype.slice.call(arguments);
//   var errMessage = '"{{key}}" '+this.dataName+' must be an encoded object id';
//   return this.every(utils.isObjectId64, 400, errMessage)(args);
// };
// RequestData.prototype.castAsArray = function (key) {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     var val = req[dataType][key];
//     req[dataType][key] = Array.isArray(val) ? req[dataType][key] : [req[dataType][key]];
//     next();
//   };
// };
// RequestData.prototype.castAsMongoQuery = function () {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     var requestData = req[dataType];
//     Object.keys(requestData).forEach(function (key) {
//       if (Array.isArray(requestData[key])) {
//         requestData[key] = { $in: requestData[key] };
//       }
//     });
//     next();
//   };
// };
// RequestData.prototype.if = function (keys /*, middlewares */) {
//   var middlewares = Array.prototype.slice.call(arguments, 1);
//   keys = Array.isArray(keys) ? keys : [keys];
//   return ternary(this.isTrue.apply(this, keys),
//     series.apply(this, middlewares),
//     utils.next);
// };
// RequestData.prototype.unless = function (keys /*, middlewares */) {
//   var middlewares = Array.prototype.slice.call(arguments, 1);
//   keys = Array.isArray(keys) ? keys : [keys];
//   return ternary(this.isTrue.apply(this, keys),
//     utils.next,
//     series.apply(this, middlewares));
// };
// RequestData.prototype.ifExists = function (keys /*, middlewares */) {
//   var middlewares = Array.prototype.slice.call(arguments, 1);
//   keys = Array.isArray(keys) ? keys : [keys];
//   return ternary(this.require.apply(this, keys),
//     series.apply(this, middlewares),
//     utils.next);
// };
// RequestData.prototype.unlessExists = function (keys /*, middlewares */) {
//   var middlewares = Array.prototype.slice.call(arguments, 1);
//   keys = Array.isArray(keys) ? keys : [keys];
//   return ternary(this.require.apply(this, keys),
//     utils.next,
//     series.apply(this, middlewares));
// };
// RequestData.prototype.strToBoolean = function (/* keys */) {
//   var keys = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     keys.forEach(function (key) {
//       var val = req[dataType][key];
//       if (utils.exists(val)) {
//         req[dataType][key] = utils.strToBoolean(val);
//       }
//     });
//     next();
//   };
// };
// RequestData.prototype.ifOneExists = function (keys /*, middlewares */) {
//   var middlewares = Array.prototype.slice.call(arguments, 1);
//   keys = Array.isArray(keys) ? keys : [keys];
//   return ternary(this.requireOne.apply(this, keys),
//     series.apply(utils, middlewares),
//     utils.next);
// };
// RequestData.prototype.replaceMeWithMyId = function (key) {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     if (req[dataType][key] === 'me') {
//       req[dataType][key] = req.user_id;
//     }
//     next();
//   };
// };
// RequestData.prototype.setFromQuery = setFrom('query');
// RequestData.prototype.setFromBody = setFrom('body');
// RequestData.prototype.setFromParams = setFrom('params');
// RequestData.prototype.set = function (key, fromKeyPath) {
//   var dataType = this.dataType;
//   if (typeof key === 'string') {
//     return function (req, res, next) {
//       var value = utils.replacePlaceholders(req, fromKeyPath);
//       req[dataType][key] = value;
//       next();
//     };
//   }
//   else {
//     var obj = key;
//     var tasks = Object.keys(obj).map(function (key) {
//       return this.set(key, obj[key]);
//     });
//     return series(tasks);
//   }
// };
// RequestData.prototype.unset = function (key) {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     delete req[dataType][key];
//     next();
//   };
// };
// RequestData.prototype.setDefault = function (key, val) {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     var existing = req[dataType][key];
//     req[dataType][key] = utils.exists(existing) ? existing : val;
//     next();
//   };
// };
// RequestData.prototype.max = function (key, max) {
//   var dataType = this.dataType;
//   return function (req, res, next) {
//     req[dataType][key] = req[dataType][key] > max ? max : req[dataType][key];
//     next();
//   };
// };
// RequestData.prototype.allowValues = function (key, vals, required) {
//   var dataType = this.dataType;
//   var self = this;
//   return function (req, res, next) {
//     var valExists = utils.exists(req[dataType][key]);
//     var isAllowed = ~vals.indexOf(req[dataType][key]);
//     if ((required && !isAllowed) || (!required && valExists && !isAllowed)) {
//       var valsStr = utils.arrayToString(vals, 'or', '.');
//       return next(error(400, '"'+key+'" '+self.dataName+' must be '+valsStr));
//     }
//     next();
//   };
// };
// function setFrom (dataType) {
//   return function (selfDatakey, dataKey) {
//     var self = this;
//     return function (req, res, next) {
//       req[self.dataType] = req[self.dataType] || {};
//       req[self.dataType][selfDatakey] = req[dataType][dataKey];
//       next();
//     };
//   };
// }