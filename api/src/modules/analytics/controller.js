import * as service from './service.js';
import { success } from '../../lib/response.js';

export async function track(req, res) {
  const body = req.body || {};
  const events = body.events || body;
  const data = await service.track(events, {
    userId: req.user?.id,
    sessionId: req.headers['x-session-id'] || body.session_id,
    ip: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });
  return success(res, data);
}

export async function overview(req, res) {
  return success(res, await service.overview(req.query));
}

export async function products(req, res) {
  return success(res, await service.productPerformance(req.query));
}

export async function searches(req, res) {
  return success(res, await service.topSearches(req.query));
}

export async function trend(req, res) {
  return success(res, await service.trend(req.query));
}

export default { track, overview, products, searches, trend };
