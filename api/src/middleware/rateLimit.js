/**
 * Simple in-memory rate limiter (per IP / custom key).
 * Suitable for single-node and development.
 * Production multi-node: swap for Redis-backed store (same interface).
 */

import config from '../config/index.js';
import { TooManyRequestsError } from '../lib/errors.js';

const hits = new Map();

function prune(now, windowMs) {
  for (const [key, entry] of hits) {
    if (now - entry.start > windowMs) hits.delete(key);
  }
}

/**
 * @param {{ windowMs?: number, max?: number, keyGenerator?: (req) => string, name?: string }} [opts]
 */
export function rateLimit(opts = {}) {
  const windowMs = opts.windowMs ?? config.rateLimit.windowMs;
  const max = opts.max ?? config.rateLimit.max;
  const name = opts.name || 'default';
  const keyGenerator =
    opts.keyGenerator ??
    ((req) => `${name}:${req.ip || req.socket?.remoteAddress || 'unknown'}`);

  return (req, res, next) => {
    // Skip health in tests
    if (config.isTest) return next();

    const now = Date.now();
    if (hits.size > 20_000) prune(now, windowMs);

    const key = keyGenerator(req);
    let entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader(
      'X-RateLimit-Reset',
      String(Math.ceil((entry.start + windowMs) / 1000))
    );

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return next(new TooManyRequestsError());
    }
    next();
  };
}

/** Stricter limits for auth-sensitive endpoints */
export const authRateLimit = rateLimit({
  name: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 30,
});

/** Payment intents / webhooks */
export const paymentRateLimit = rateLimit({
  name: 'payment',
  windowMs: 15 * 60 * 1000,
  max: 40,
});

/** Analytics event ingestion (higher volume) */
export const analyticsRateLimit = rateLimit({
  name: 'analytics',
  windowMs: 60 * 1000,
  max: 120,
});

/** Checkout / cart mutations */
export const checkoutRateLimit = rateLimit({
  name: 'checkout',
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/** Reset for tests */
export function resetRateLimitStore() {
  hits.clear();
}

export default rateLimit;
