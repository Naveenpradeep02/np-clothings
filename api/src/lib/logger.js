/**
 * Structured logging with secret redaction.
 * Levels: debug | info | warn | error
 */

import env from '../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const current = LEVELS[env.logLevel] ?? LEVELS.info;

const SENSITIVE_KEYS = new Set([
  'password',
  'privatekey',
  'private_key',
  'secret',
  'secretkey',
  'secret_key',
  'token',
  'authorization',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
  'client_secret',
  'firebase_private_key',
  'razorpay_key_secret',
  'twilio_auth_token',
  'shipping_api_key',
  'credit_card',
  'card_number',
  'cvv',
]);

function redact(value, depth = 0) {
  if (depth > 6) return '[MaxDepth]';
  if (value == null) return value;
  if (typeof value === 'string') {
    // crude JWT / long secret detection
    if (value.length > 40 && /^[A-Za-z0-9\-_=.]{40,}$/.test(value)) {
      return '[REDACTED]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    if (value instanceof Error) {
      return {
        message: value.message,
        stack: env.isDev ? value.stack : undefined,
        code: value.code,
      };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(String(k).toLowerCase().replace(/-/g, '_'))) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

function ts() {
  return new Date().toISOString();
}

function fmt(level, message, meta) {
  const base = {
    ts: ts(),
    level,
    service: 'aurea-api',
    msg: message,
  };
  if (meta !== undefined) {
    if (meta instanceof Error) {
      base.error = redact(meta);
    } else if (typeof meta === 'object') {
      Object.assign(base, redact(meta));
    } else {
      base.meta = meta;
    }
  }
  return JSON.stringify(base);
}

function shouldLog(level) {
  return (LEVELS[level] ?? 99) >= current;
}

const logger = {
  debug(message, meta) {
    if (shouldLog('debug')) console.debug(fmt('debug', message, meta));
  },
  info(message, meta) {
    if (shouldLog('info')) console.info(fmt('info', message, meta));
  },
  warn(message, meta) {
    if (shouldLog('warn')) console.warn(fmt('warn', message, meta));
  },
  error(message, meta) {
    if (shouldLog('error')) console.error(fmt('error', message, meta));
  },
  request(req, res, durationMs) {
    if (shouldLog('info')) {
      console.info(
        fmt('info', 'request', {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl?.split('?')[0],
          status: res.statusCode,
          durationMs,
          ip: req.ip,
        })
      );
    }
  },
  redact,
};

export default logger;
export { redact };
