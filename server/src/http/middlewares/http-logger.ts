import type { RequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const httpLogger = require('../../../middlewares/http-logger.js') as RequestHandler;

export default httpLogger;
