/**
 * Application error hierarchy.
 * Controllers/services throw these; errorHandler maps them to HTTP responses.
 */

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {object} [opts]
   * @param {number} [opts.status]
   * @param {string} [opts.code]
   * @param {unknown} [opts.details]
   * @param {boolean} [opts.isOperational]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = opts.status || 500;
    this.code = opts.code || 'INTERNAL_ERROR';
    this.details = opts.details;
    this.isOperational = opts.isOperational !== false;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(message, { status: 400, code: 'BAD_REQUEST', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, { status: 409, code: 'CONFLICT', details });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { status: 422, code: 'VALIDATION_ERROR', details });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, { status: 429, code: 'RATE_LIMITED' });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, { status: 503, code: 'SERVICE_UNAVAILABLE' });
  }
}
