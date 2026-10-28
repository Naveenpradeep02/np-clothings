/**
 * Security headers + request timeout + body hardening.
 */

import config from '../config/index.js';
import { ServiceUnavailableError } from '../lib/errors.js';

/**
 * Apply baseline security headers (helmet-like without hard dependency).
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // modern browsers; rely on CSP
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

  // Minimal CSP for API (JSON only)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );

  if (config.isProd) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
}

/**
 * Abort long-running requests (default 30s).
 */
export function requestTimeout(ms = 30_000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(new ServiceUnavailableError('Request timed out'));
      }
    }, ms);

    const clear = () => clearTimeout(timer);
    res.on('finish', clear);
    res.on('close', clear);
    next();
  };
}

/**
 * Strip common prototype-pollution keys from body.
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    for (const key of dangerous) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        delete req.body[key];
      }
    }
  }
  next();
}

export default { securityHeaders, requestTimeout, sanitizeBody };
