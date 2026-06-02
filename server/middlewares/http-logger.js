// server/middlewares/http-logger.js
//
// pino-http request logger. Emits one structured log line per request,
// keyed by req.id, with severity derived from status code.

const pinoHttp = require('pino-http');
const logger = require('../utils/logger');

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} ${err.message}`,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        userAgent: req.headers && req.headers['user-agent'],
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});

module.exports = httpLogger;
