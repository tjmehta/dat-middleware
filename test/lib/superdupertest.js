var superRequest = require('supertest');
var path = require('path');
var qs = require('querystring');
var methods = require('methods');
var noop = function () {};

module.exports = function (app) { // or (url[, params][, query])
  var request = superRequest(app);
  methods.forEach(function (method) {
    method = method.toLowerCase();
    if (!request[method]) return;
    var origFn = request[method].bind(request);
    request[method] = acceptParamsAndQuery(origFn);
  });
  return request;
};

function acceptParamsAndQuery (origFn) {
  return function (url, params, query) { // or (url[, params][, query])
    if (!Array.isArray(params)) {
      query = params;
      params = [];
    }
    if (params && params.length) {
      url = path.join.apply(path, [url].concat(params));
    }
    if (query) {
      url += '?' + qs.stringify(query);
    }
    var req = origFn(url);
    var origEnd = req.end.bind(req);
    req.end = function (cb) {
      origEnd(logOnError(cb));
    };
    return req;
  };
}

function logOnError (cb) {
  return function (err, res) {
    if (err && res) {
      console.error(res.statusCode, res.req.method, res.req.path);
      if (res.body && res.body.stack) {
        console.error(res.body.stack);
      }
      else {
        console.error(res.body);
      }
    }
    cb(err, res);
  };
}