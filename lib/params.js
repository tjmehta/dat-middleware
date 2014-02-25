var RequestData = require('./RequestData');

module.exports = function (/* keys */) {
  var requestData = RequestData.createRequestData('params');
  var _super = Object.getPrototypeOf(requestData);
  var keys = Array.prototype.slice.call(arguments);
  requestData.send = function () {
    var superSend = _super.send.apply(this, arguments);
    return function (req, res, next) {
      var paramsObj = {};
      Object.keys(req.params).forEach(function (key) {
        paramsObj[key] = req.params[key];
      });
      req.params = paramsObj;
      superSend(req, res, next);
    };
  };

  return requestData.keys.apply(requestData, keys);
};