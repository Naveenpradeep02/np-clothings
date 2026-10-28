/**
 * Analytics — event ingestion + product performance reports.
 * Minimal PII: IP hashed, UA truncated; no excessive behavioural profiles.
 */

import * as repo from './repository.js';
import {
  BadRequestError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

const ALLOWED_EVENTS = new Set([
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
  'page_view',
  'search',
  'wishlist_add',
  'share',
]);

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`analytics.${fn} failed`, err);
  throw new ServiceUnavailableError('Analytics temporarily unavailable');
}

function parseRange(query = {}) {
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestError('Invalid from/to date');
  }
  if (from > to) throw new BadRequestError('from must be before to');
  return { from, to };
}

/**
 * Ingest one or more events from storefront.
 */
export async function track(events, { userId, sessionId, ip, userAgent } = {}) {
  try {
    const list = Array.isArray(events) ? events : [events];
    if (!list.length) throw new BadRequestError('events required');
    if (list.length > 50) throw new BadRequestError('Max 50 events per request');

    const rows = [];
    for (const e of list) {
      if (!e?.event_type || !ALLOWED_EVENTS.has(e.event_type)) {
        throw new BadRequestError(
          `event_type must be one of: ${[...ALLOWED_EVENTS].join(', ')}`
        );
      }
      rows.push({
        event_type: e.event_type,
        user_id: userId || e.user_id || null,
        session_id: sessionId || e.session_id || null,
        product_id: e.product_id ? Number(e.product_id) : null,
        variant_id: e.variant_id ? Number(e.variant_id) : null,
        category_id: e.category_id ? Number(e.category_id) : null,
        order_id: e.order_id ? Number(e.order_id) : null,
        metadata: e.metadata && typeof e.metadata === 'object' ? e.metadata : null,
        ip_hash: repo.hashIp(ip),
        user_agent: userAgent,
      });
    }

    const count = await repo.insertEventsBatch(rows);
    return { accepted: count };
  } catch (err) {
    wrap('track', err);
  }
}

export async function productPerformance(query) {
  try {
    const { from, to } = parseRange(query);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const products = await repo.productPerformance({ from, to, limit });
    return { from, to, products };
  } catch (err) {
    wrap('productPerformance', err);
  }
}

export async function overview(query) {
  try {
    const { from, to } = parseRange(query);
    const counts = await repo.overviewCounts({ from, to });
    const funnel = await repo.funnel({ from, to });
    return {
      from,
      to,
      ...counts,
      funnel,
    };
  } catch (err) {
    wrap('overview', err);
  }
}

export async function topSearches(query) {
  try {
    const { from, to } = parseRange(query);
    const limit = Math.min(Number(query.limit) || 20, 50);
    const rows = await repo.topSearches({ from, to, limit });
    return {
      from,
      to,
      searches: rows.map((r) => ({
        query: r.query,
        count: Number(r.count),
        avg_results: Math.round(Number(r.avg_results) || 0),
      })),
    };
  } catch (err) {
    wrap('topSearches', err);
  }
}

export async function trend(query) {
  try {
    const { from, to } = parseRange(query);
    const eventType = query.event_type || 'product_view';
    if (!ALLOWED_EVENTS.has(eventType)) {
      throw new BadRequestError('Invalid event_type');
    }
    const rows = await repo.dailyTrend({ from, to, eventType });
    return {
      from,
      to,
      event_type: eventType,
      series: rows.map((r) => ({
        day: r.day,
        total: Number(r.total),
      })),
    };
  } catch (err) {
    wrap('trend', err);
  }
}

export default {
  track,
  productPerformance,
  overview,
  topSearches,
  trend,
  ALLOWED_EVENTS,
};
