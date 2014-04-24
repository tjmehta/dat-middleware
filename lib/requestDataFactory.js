var RequestData = require('./RequestData');

module.exports = function (reqKey) {
  return function (/* keys */) {
    var requestData = RequestData.createRequestData(reqKey);
    var keys = Array.prototype.slice.call(arguments);

    return requestData.keys.apply(requestData, keys);
  };
};