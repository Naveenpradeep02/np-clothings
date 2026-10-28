import logger from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.message?.includes('not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      error: { code: 'CORS_DENIED', message: 'Origin not allowed' },
    });
  }

  // express body-parser size errors
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' },
    });
  }

  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : err.status || err.statusCode || 500;
  const code = isAppError ? err.code : err.code || 'INTERNAL_ERROR';
  const isDev = process.env.NODE_ENV !== 'production';

  if (status >= 500) {
    logger.error('Unhandled error', err);
  } else {
    logger.warn(err.message || 'Request error', { status, code, path: req.path });
  }

  // Never leak internal stack or raw SQL in production
  const message =
    status >= 500 && !isDev
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(isAppError && err.details !== undefined ? { details: err.details } : {}),
      ...(isDev && !isAppError && err.stack ? { stack: err.stack } : {}),
    },
  });
}
