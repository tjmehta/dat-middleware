var RequestData = require('./RequestData');

module.exports = function (/* keys */) {
  var requestData = RequestData.createRequestData('query');
  var keys = Array.prototype.slice.call(arguments);

  return requestData.keys.apply(requestData, keys);
};