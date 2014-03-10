module.exports = {
  // req: require('./request'),
  // res: require('./response'),
  Boom: require('boom'),
  body: require('./lib/body'),
  query: require('./lib/query'),
  params: require('./lib/params'),
  // headers: require('./headers')
  errorHandler: require('./lib/errorHandler')
};