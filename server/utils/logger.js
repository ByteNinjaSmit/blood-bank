// server/utils/logger.js
//
// pino-based application logger. Kept here (legacy path) for backwards
// compatibility with existing `require('./utils/logger')` call sites in the
// old controllers. The new `server/src/` tree imports from
// `infra/logger` directly.
//
// API exposed: info, warn, error, debug, verbose, fatal, trace, child.
// Same shape the old winston wrapper offered, so no caller needs to change.
//
// Output:
//   - dev (NODE_ENV !== 'production'): pretty-printed colourised stdout
//   - prod: structured JSON to stdout (Docker json-file driver handles
//     rotation; ship to Loki/CloudWatch later via a transport).
//
// Sensitive paths are redacted regardless of environment.

const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.jwt',
  '*.secret',
  '*.apiKey',
  '*.otp',
  '*.code',
  'EMAIL_PASS',
  'JWT_SECRET',
  'JWT_SECRET_KEY',
  'TWILIO_AUTH_TOKEN',
  'AWS_SECRET_ACCESS_KEY',
  'MONGODB_URI',
];

const baseOptions = {
  level,
  base: {
    service: 'blood-bank-api',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
    remove: false,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

const transport = isProd
  ? undefined
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,service,env',
        singleLine: false,
      },
    });

const logger = transport ? pino(baseOptions, transport) : pino(baseOptions);

// Verbose is a winston level; map to debug for callers that still use it.
logger.verbose = logger.debug.bind(logger);

module.exports = logger;
