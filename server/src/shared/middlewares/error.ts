// Single error-handling middleware. Maps every error (AppError or
// otherwise) to a stable response shape:
//   { success: false, code, message, details?, requestId }
//
// Always 4xx for operational errors (validation, forbidden, conflict),
// 5xx only for genuine internal failures.

import type { ErrorRequestHandler } from 'express';
import { AppError } from '@/shared/errors';
import { logger } from '@/core/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, 'AppError 5xx');
    } else {
      logger.warn({ code: err.code, requestId, msg: err.message }, 'AppError');
    }
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    });
    return;
  }

  // Unknown / unexpected error path. Do not leak internals to client.
  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    requestId,
  });
};
