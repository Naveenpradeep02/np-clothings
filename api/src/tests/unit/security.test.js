import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/** Pure copy of sanitize logic (avoids loading dotenv via middleware imports) */
function sanitizeBodyPure(body) {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    for (const key of dangerous) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        delete body[key];
      }
    }
  }
  return body;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'private_key',
  'secret',
  'token',
  'api_key',
  'authorization',
]);

function redact(value, depth = 0) {
  if (depth > 6) return '[MaxDepth]';
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
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

function securityHeadersMap(isProd = false) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };
  if (isProd) {
    h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return h;
}

describe('sanitizeBody', () => {
  it('strips prototype pollution keys', () => {
    const body = { name: 'ok' };
    Object.defineProperty(body, 'constructor', {
      value: { x: 1 },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    sanitizeBodyPure(body);
    assert.equal(body.name, 'ok');
    assert.equal(Object.prototype.hasOwnProperty.call(body, 'constructor'), false);
  });
});

describe('logger redact', () => {
  it('redacts secret keys', () => {
    const out = redact({
      password: 'secret123',
      token: 'abc',
      email: 'a@b.com',
      nested: { api_key: 'xyz', ok: 1 },
    });
    assert.equal(out.password, '[REDACTED]');
    assert.equal(out.token, '[REDACTED]');
    assert.equal(out.email, 'a@b.com');
    assert.equal(out.nested.api_key, '[REDACTED]');
    assert.equal(out.nested.ok, 1);
  });
});

describe('security headers', () => {
  it('includes nosniff and frame deny', () => {
    const h = securityHeadersMap(false);
    assert.equal(h['X-Content-Type-Options'], 'nosniff');
    assert.equal(h['X-Frame-Options'], 'DENY');
  });

  it('adds HSTS in production', () => {
    const h = securityHeadersMap(true);
    assert.ok(h['Strict-Transport-Security'].includes('max-age='));
  });
});
