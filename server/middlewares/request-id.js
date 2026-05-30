// server/middlewares/request-id.js
//
// Attach a stable request id to every incoming request and echo it on the
// response. Used by the http logger to correlate log lines, and by clients
// to quote when reporting a failure.

const crypto = require('node:crypto');

const HEADER = 'x-request-id';

function requestId(req, res, next) {
  const inbound = req.headers[HEADER];
  const id = typeof inbound === 'string' && inbound.length > 0
    ? inbound
    : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestId;
module.exports.HEADER = HEADER;
