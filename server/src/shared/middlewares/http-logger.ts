import pinoHttp from 'pino-http';
import { logger } from '@/core/logger';

const httpLogger = pinoHttp({
  logger,
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return { method: req.method, url: req.url, id: req.id };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
});

export default httpLogger;
