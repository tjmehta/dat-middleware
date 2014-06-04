var error = require('./error');
var utils = require('map-utils');
var flow = require('middleware-flow');
var keypather = require('keypather')();
var pick = require('101/pick');
var Boom = require('boom');
var clone = require('clone');
var pluck = require('101/pluck');
var bindRight = require('./bindRight');
var notEquals = function (compare) {
  return function (val) {
    return val !== compare;
  };
};
var returnTrue = function () { return true; };
var notUndefined = function (v) {
  return v !== void(0);
};
var arrayToString = function (arr, conjunction, after) {
  arr = clone(arr);
  var last = '"'+arr.pop()+'"';

  return (arr.length === 0) ?
    last :
    ['"'+arr.join('", "')+'"', conjunction, last, after].join(' ');
};

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
  } else { // request
    this.dataName = '';
  }
  this.steps = [];
  this.nextOnFirstError = true;
};
/**
 * @method
 */
RequestData.prototype.keypath = function (key) {
  return [this.dataType, key].filter(utils.exists).join('.');
};
/**
 * @method
 * @param {...key} string - keys on the request data to validate.
 */
RequestData.prototype.keys = function (/* ...keys */) {
  if (typeof arguments[0] === 'object') {
    if (arguments[0].or) {
      this._keys = arguments[0].or;
      this.orTheValidations = true;
    }
    else {
      throw new TypeError('invalid key format');
    }
  }
  else {
    this._keys = Array.prototype.slice.call(arguments);
  }

  return this;
};
RequestData.prototype.execErr = function (err, req, res, next) {
  this.exec(req, res, next, err);
};
/**
 * @method
 */
RequestData.prototype.exec = function (req, res, next) {
  var self = this;
  var mwErr = arguments[3]; // hack, cant accept 4 args else middleware will be considered errorHandler
  var errors = [];
  if (this.nextOnFirstError) {
    var errored = this.steps.some(some);
    if (!errored) {
      next();
    }
  }
  else {
    this.steps.every(every);
  }
  function some (step, i) {
    var err;
    if (step.type === 'validation') {
      err = self._validateStep(req, step);
      if (err) {
        next(err);
        return true; // break loop
      }
    }
    else if (step.type.indexOf('transform') === 0) {
      self._transformStep(step, req, mwErr);
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
      self._transformStep(step, req, mwErr);
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
        var data = keypather.get(req, self.keypath(key));
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
 * @param {function} validation - function that accepts a value and returns an error if it does not validate.
 */
RequestData.prototype.validate = function (validation) {
  var self = this;
  if (this.orTheValidations) {
    var dataName = this.dataName + (this._keys.length ? 's' : '');
    var origValidation = validation;
    validation = function (req) {
      var err;
      self._keys
        .map(self.keypath.bind(self))
        .map(keypather.get.bind(keypather, req))
        .some(function (val, i) {
          err = origValidation(val);
          return !err;
        });
      if (err) {
        return Boom.badRequest(dataName+' '+arrayToString(self._keys, 'or', err.message));
      }
    };
  }
  else {
  }

  this.steps.push({
    type: 'validation',
    validate: validation
  });
  return this;
};

/**
 * @method
 * @param {function} Class - Class to assert keys are an instance of.
 */
RequestData.prototype.instanceOf = function (Class) {
  if (!Class) {
    throw new Error('instanceOf requires a Class');
  }
  this.validate(validations.instanceOf(Class));
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
  this.validate(validations.typeOf(type));
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
 * @method
 * @param {regexp} re - keys sh.
 */
RequestData.prototype.matches = function (re) {
  if (!re) {
    throw new Error('match requires a regexp');
  }
  this.validate(validations.matches(re));
  return this;
};
/**
 * assert keys exist
 * @method function
 */
RequestData.prototype.require = function () {
  this.required = true;
  this.validate(validations.require());
  return this;
};

/*************** TRANSFORMATIONS ***************/
/*************** TRANSFORMATIONS ***************/
/*************** TRANSFORMATIONS ***************/

/**
 * transform key values using function
 * @method function
 * @param {function} transformation - function to transform value of key with.
 */
RequestData.prototype.mapValues = function (transformation) {
  if (!transformation) {
    throw new Error('mapValues requires a transformation fn');
  }
  this.steps.push({
    type: 'transform',
    transformation: transformation
  });
  return this;
};
/**
 * transform data object with function
 * @method function
 * @param {function} transformation - function to transform value of key with.
 */
RequestData.prototype.transform = function (transformation) {
  if (!transformation) {
    throw new Error('transform requires a transformation fn');
  }
  this.steps.push({
    type: 'transformObject',
    transformation: transformation
  });
  return this;
};
/**
 * pick keys from data object
 * @param {...key} string - keys on the request data to validate.
 */
RequestData.prototype.pick = function () {
  if (arguments.length) {
  }
  return this.transform(pick(this._keys));
};
/**
 * set keys or extend with obj
 * @param {key} string - key to set value for or key-value set object
 * @param {value} string - value to set for key
 * or
 * @param {obj} string - key to set value for or key-value set object
 */
RequestData.prototype.set = function (key, value) {
  return this.transform(function (data, req, err) {
    data = utils.set(key, value)(data);
    if (typeof key === 'object') {
      Object.keys(key).forEach(function (key) {
        if (typeof data[key] === 'string') {
          data[key] = keypather.get(req, data[key]) || data[key];
        }
      });
    }
    else {
      if (typeof data[key] === 'string') {
        data[key] = keypather.get(req, value) || value;
      }
    }
    return data;
  });
};
/**
 * delete keys from data object
 * @param {...key} string - keys on the request data to delete.
 */
RequestData.prototype.unset = function (/* ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  return this.transform(utils.unset.apply(null, keys));
};

/**
 * set key to err
 * @param {key} string - key to set value for or key-value set object
 * @param {value} string - value to set for key
 * or
 * @param {obj} string - key to set value for or key-value set object
 */
RequestData.prototype.setToErr = function (key) {
  this.transform(function (data, req, err) {
    data[key] = err;
    return data;
  });
  return this.execErr.bind(this);
};

/*************** CONDITIONALS ***************/
/*************** CONDITIONALS ***************/
/*************** CONDITIONALS ***************/

/**
 * @method function
 * @param {function} ...middlewares - middlewares to execute if the exec passes
 */
RequestData.prototype.then = function () {
  if (this.steps.map(pluck('type')).every(notEquals('validation'))) {
    throw new Error('then should be used after some validation steps have been specified');
  }
  var mwIf = flow.mwIf(this.exec.bind(this));
  return mwIf.then.apply(mwIf, arguments);
};
/**
 * @method function
 * @param {function} ...middlewares - middlewares to execute if the exec passes
 */
RequestData.prototype.else = function () {
  if (this.steps.map(pluck('type')).every(notEquals('validation'))) {
    throw new Error('then should be used after some validation steps have been specified');
  }
  var mwIf = flow.mwIf(this.exec.bind(this));
  return mwIf.else.apply(mwIf, arguments);
};

/*************** INTERNALS ***************/

RequestData.prototype._validateStep = function (req, step) {
  var self = this;
  var err, errs;
  var keypath = this.keypath.bind(this);
  var dataTypeRE = new RegExp('^'+this.dataType+'.');
  var filter = this.required ?
    returnTrue : reqValueNotUndefined;
  if (this.orTheValidations) {
    return step.validate(req);
  }
  else if (this.nextOnFirstError) {
    var keypaths = this._keys
      .map(keypath)
      .filter(filter);
    keypaths
      .map(reqValueForKeypath)
      .some(firstError);
    return err;
  }
  else {
    errs = this._keys
      .map(keypath)
      // .filter(returnTrue)
      .map(reqValueForKeypath)
      .map(step.validate)
      .filter(exists)
      .map(formatError);
    return errs;
  }
  function reqValueForKeypath (keypath) {
    return keypather.get(req, keypath);
  }
  function reqValueNotUndefined (keypath) {
    return reqValueForKeypath(keypath) !== undefined; // null is okay
  }
  function firstError (value, i) {
    err = step.validate(value);
    if (err) {
      err = formatError(err, i);
    }
    return err;
  }
  function formatError (err, i) {
    var key = keypaths[i].replace(dataTypeRE, '');
    err.message = [self.dataName, '"'+key+'"', err.message].join(' ').trim();
    return err;
  }
};
RequestData.prototype._transformStep = function (step, req, err) {
  if (step.type === 'transform') {
    var keypath = this.keypath.bind(this);
    var keypaths = this._keys
      .map(keypath);
    keypaths
      .map(reqValueForKeypath)
      .map(bindRight(step.transformation, req, err))
      .forEach(setValueForKey);
  }
  else if (step.type === 'transformObject') {
    var dataType = this.dataType;
    req[dataType] = step.transformation(req[dataType], req, err);
  }
  else {
    console.error('unknown transform step:');
    console.error(step);
  }
  function reqValueForKeypath (keypath) {
    return keypather.get(req, keypath);
  }
  function setValueForKey (value, i) {
    keypather.set(req, keypaths[i], value);
  }
};

// Exports - Factory Method
// Exports - Factory Method
// Exports - Factory Method

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
