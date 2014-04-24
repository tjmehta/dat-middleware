# dat-middleware [![Build Status](https://travis-ci.org/tjmehta/dat-middleware.png?branch=master)](https://travis-ci.org/tjmehta/dat-middleware)

Common request, response, body, query, and param validation, transformation, and flow control middleware

# Installation
```bash
npm install dat-middleware
```

# Examples

# Validations:

## require()

requires the keys specified, and nexts a 400 error if one does not exist

```js
mw.body(keys..).require()
mw.query(keys..).require()
mw.params(keys..).require()
```

```js
var mw = require('dat-middleware');
var app = require('express')();

// requires that req.body.key1 and req.body.key2 are not undefined
app.use(mw.body('key1, key2').require());
// example error:
// 400 { message: body parameter "key1" is required }
```

## string()

requires the keys are strings (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).string()
mw.query(keys..).string()
mw.params(keys..).string()
```

## number()

requires the keys are numbers (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).number()
mw.query(keys..).number()
mw.params(keys..).number()
```

## object()

requires the keys are objects (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).object()
mw.query(keys..).object()
mw.params(keys..).object()
```

## function()

requires the keys are functions (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).function()
mw.query(keys..).function()
mw.params(keys..).function()
```

## boolean()

requires the keys are booleans (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).boolean()
mw.query(keys..).boolean()
mw.params(keys..).boolean()
```

## array()

requires the keys are arrays (if they exist), and nexts a 400 error if one is not

```js
mw.body(keys..).array()
mw.query(keys..).array()
mw.params(keys..).array()
```

```js
var mw = require('dat-middleware');
var app = require('express')();

// requires that req.body.key1 and req.body.key2 arrays *if they exist*
app.use(mw.body('key1, key2').array());
// example error:
// 400 { message: body parameter "key1" must be an array }
```

```js
mw.body(keys..).instanceOf(Class)
mw.query(keys..).instanceOf(Class)
mw.params(keys..).instanceOf(Class)
```

## instanceOf(Class)

requires the keys are an instance of the specified class (if they exist), and nexts a 400 error if one is not

```js
var mw = require('dat-middleware');
var app = require('express')();

// requires that req.body.key1 and req.body.key2 arrays *if they exist*
app.use(mw.body('key1, key2').instanceOf(Class));
// example error:
// 400 { message: body parameter "key1" must be an instance of Class }
```

## validate(validation)

requires the keys pass the validation (if they exist), and nexts a 400 error if one is not
dat-middleware uses [spumko/boom](https://github.com/spumko/boom) for http errors (exported as mw.Boom)

```js
var mw = require('dat-middleware');
var app = require('express')();
function is24Chars (val) {
  return (val.length !== 24) ?
    mw.Boom.badRequest('is not 24 characters'):
    null; // pass
}

// requires that req.body.key1 and req.body.key2 arrays *if they exist*
app.use(mw.body('key1, key2').validate(is24Chars));
// example error:
// 400 { message: body parameter "key1" is not 24 characters }
```

# Transformations:

## mapValues(transformation)

transforms the values of the keys specified using the transformation function

```js
var mw = require('dat-middleware');
var app = require('express')();
function toInt (v) {
  return parseInt(v);
}

// transforms the req.body.key1 and req.body.key2 to integers
app.use(mw.body('key1, key2').mapValues(toInt));
```

## transform(transformation)

transforms the entire dataType object using the transformation function

```js
var mw = require('dat-middleware');
var app = require('express')();
function valuesToInt (body) {
  Object.keys(body).forEach(function (key) {
    body[key] = parseInt(body[key]);
  });
}

// transforms the req.body.key1 and req.body.key2 to integers
app.use(mw.body().transform(valuesToInt));
```

## pick()

picks the keys specified and ignores the rest. a way of filtering data values by key.

```js
var mw = require('dat-middleware');
var app = require('express')();

// a body of { key1: true, key2: true, key3:true } becomes { key1: true }
app.use(mw.body('key1').pick());
```

## set()

sets the keys and values on the data type.

```js
var mw = require('dat-middleware');
var app = require('express')();

// a body of { key1: true, key2: true, key3:true } becomes { key1: true }
app.use(mw.body().set('key', 'value'));
app.use(mw.body().set(obj));
```

## unset()

deletes the keys on the data type.

```js
var mw = require('dat-middleware');
var app = require('express')();

// a body of { key1: true, key2: true, key3:true } becomes { key3:true }
app.use(mw.body().unset('key1', 'key2'));
```

# Conditionals (flow control):

for more flow control checkout [middleware-flow](http://github.com/tjmehta/middleware-flow)

## if(keys...).then(middlewares...).else(middlewares...)

if the values of the key's specified are all truthy it will run the 'then middlewares'
else if will run the 'else middlewares'

```js
var mw = require('dat-middleware');
var app = require('express')();

// body of {key1:<truthy>} runs mw1 and mw2
// body of {key1:<falsy>} runs mw3
app.use(mw.body().if('key1')
  .then(mw1, mw2)
  .else(mw3));
```

## using if with or
```js
var mw = require('dat-middleware');
var app = require('express')();

// body of {key1:<truthy>} runs mw1 and mw2
// body of {key2:<truthy>} runs mw1 and mw2
// body of {key1:<truthy>, key2:<truthy>} runs mw1 and mw2
// body of {key1:<falsy>} runs mw3
// body of {key1:<falsy>, key2:<falsy>} runs mw3
app.use(mw.body().if({ or: ['key1', 'key2'] })
  .then(mw1, mw2)
  .else(mw3));
```

## ifExists(keys...).then(middlewares...).else(middlewares...)

if the values of the key's specified all exist it will run the 'then middlewares'
else if will run the 'else middlewares'

```js
var mw = require('dat-middleware');
var app = require('express')();

// body of {key1:true} runs mw1 and mw2
// body of {key1:null} runs mw3
app.use(mw.body().ifExists('key1')
  .then(mw1, mw2)
  .else(mw3));
```

## using ifExists with or
```js
var mw = require('dat-middleware');
var app = require('express')();

// body of {key1:'val'} runs mw1 and mw2
// body of {key2:true} runs mw1 and mw2
// body of {key1:'val', key2:'val'} runs mw1 and mw2
// body of {key1:undefined} runs mw3
// body of {key1:null, key2:null} runs mw3
app.use(mw.body().ifExists({ or: ['key1', 'key2'] })
  .then(mw1, mw2)
  .else(mw3));
```

# Chaining: chained methods will run in order

note: conditionals do not chain with validations and transformations

```js
var mw = require('dat-middleware');
var app = require('express')();
function hasLengthOf3 (val) {
  return (val.length !== 3) ?
    mw.Boom.badRequest('is not 3 characters'):
    null; // pass
}
function toInt (v) {
  return parseInt(v);
}

// requires that req.body.key1 and req.body.key2 exist and are 24 characters
app.use(mw.body('key1, key2').require().validate(hasLengthOf3).transform(toInt));
```

# License
### MIT