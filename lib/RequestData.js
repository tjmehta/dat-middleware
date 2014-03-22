var error = require('./error');
var utils = require('map-utils');
var flow = require('middleware-flow');
var keypather = require('keypather')();
var returnTrue = function () { return true; };
var notUndefined = function (v) {
  console.log(v, void(0));
  return v !== void(0);
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
  } else {
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
    var errored = this.steps.some(some);
    if (!errored) {
      next();
    }
  }
  else {
    this.steps.every(every);
  }
  function some (step) {
    var err;
    if (step.type === 'validation') {
      err = self._validateStep(req, step);
      if (err) {
        next(err);
        return true; // break loop
      }
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
    console.log('dat-middleware pick does not take arguments.');
  }
  return this.transform(utils.pick.apply(null, this._keys));
};
/**
 * set keys or extend with obj
 * @param {key} string - key to set value for or key-value set object
 * @param {value} string - value to set for key
 * or
 * @param {obj} string - key to set value for or key-value set object
 */
RequestData.prototype.set = function (key, value) {
  return this.transform(utils.set(key, value));
};
/**
 * delete keys from data object
 * @param {...key} string - keys on the request data to delete.
 */
RequestData.prototype.unset = function (/* ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  return this.transform(utils.unset.apply(null, keys));
};

/*************** CONDITIONALS ***************/
/*************** CONDITIONALS ***************/
/*************** CONDITIONALS ***************/

/**
 * @method function
 * @param {...key} string - keys checked to be true.
 */
RequestData.prototype.if = function (/* keys */) {
  if (this._keys.length) {
    throw new Error('"if" should not be used with any other methods, invoke it with keys');
  }
  var self = this;
  var conditional;
  this._keys = Array.prototype.slice.call(arguments);
  if (this._keys[0] && this._keys[0].or) { // or
    this._keys = this._keys[0].or;
    conditional = flow.syncIf(keypathsTrue('some'));
  }
  else {
    conditional = flow.syncIf(keypathsTrue('every'));
  }
  return conditional;
  function keypathsTrue (method) {
    return function (req) {
      return self._keys
        .map(self.keypath.bind(self))
        [method](keypather.get.bind(keypather, req));
    };
  }
};
/**
 * @method function
 * @param {...key} string - keys checked to exist.
 */
RequestData.prototype.ifExists = function (/* keys */) {
  if (this._keys.length) {
    throw new Error('"exists" should not be used with any other methods, invoke it with keys');
  }
  var self = this;
  var conditional;
  this._keys = Array.prototype.slice.call(arguments);
  if (this._keys[0] && this._keys[0].or) { // or
    this._keys = this._keys[0].or;
    conditional = flow.syncIf(keypathsExist('some'));
  }
  else {
    conditional = flow.syncIf(keypathsExist('every'));
  }
  return conditional;
  function keypathsExist (method) {
    return function (req) {
      return self._keys
        .map(self.keypath.bind(self))
        .map(keypather.get.bind(keypather, req))
        [method](utils.exists);
    };
  }
};


/*************** INTERNALS ***************/

RequestData.prototype._validateStep = function (req, step) {
  var self = this;
  var err, errs;
  var keypath = this.keypath.bind(this);
  var filter = this.required ?
    returnTrue : reqValueNotUndefined;
  if (this.nextOnFirstError) {
    var keys = this._keys
      .map(keypath)
      .filter(filter);
    keys
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
    var key = keys[i];
    err.message = [self.dataName, '"'+key+'"', err.message].join(' ').trim();
    return err;
  }
};
RequestData.prototype._transformStep = function (req, step) {
  if (step.type === 'transform') {
    var keypath = this.keypath.bind(this);
    var keypaths = this._keys
      .map(keypath);
    keypaths
      .map(reqValueForKeypath)
      .map(step.transformation)
      .forEach(setValueForKey);
  }
  else if (step.type === 'transformObject') {
    var dataType = this.dataType;
    req[dataType] = step.transformation(req[dataType]);
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