/**
 * Record HTTP metrics after response finishes.
 */
import { recordHttpRequest } from '../lib/metrics.js';

function normalizeRoute(req) {
  // Prefer Express route path when available; fall back to path without query
  if (req.route?.path) {
    const base = req.baseUrl || '';
    return `${base}${req.route.path}`;
  }
  const p = (req.originalUrl || req.url || '').split('?')[0];
  // collapse numeric ids
  return p.replace(/\/\d+/g, '/:id');
}

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordHttpRequest({
      method: req.method,
      route: normalizeRoute(req),
      status: res.statusCode,
      durationMs,
    });
  });
  next();
}

export default metricsMiddleware;
