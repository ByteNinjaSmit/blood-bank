// AppError taxonomy. Every error thrown out of a service or controller
// should be an AppError subclass so the single error middleware can
// map it to a stable HTTP response shape.

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INVALID_UNIT_TRANSITION'
  | 'COMPATIBILITY_VIOLATION'
  | 'TTI_QUARANTINE_VIOLATION'
  | 'COLD_CHAIN_BREACH'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super('NOT_FOUND', id ? `${entity} ${id} not found` : `${entity} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient privileges') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
  }
}

export class InvalidUnitTransition extends AppError {
  constructor(from: string, event: string, unitId?: string) {
    super(
      'INVALID_UNIT_TRANSITION',
      `Invalid BloodUnit transition: ${from} --${event}--> (unit=${unitId ?? 'n/a'})`,
      409,
      { from, event, unitId },
    );
  }
}

export class CompatibilityViolation extends AppError {
  constructor(message: string, details?: unknown) {
    super('COMPATIBILITY_VIOLATION', message, 422, details);
  }
}

export class TtiQuarantineViolation extends AppError {
  constructor(message: string, details?: unknown) {
    super('TTI_QUARANTINE_VIOLATION', message, 422, details);
  }
}

export class ColdChainBreach extends AppError {
  constructor(message: string, details?: unknown) {
    super('COLD_CHAIN_BREACH', message, 422, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, cause?: unknown) {
    super('EXTERNAL_SERVICE_ERROR', `External service failed: ${service}`, 502, { cause });
  }
}
