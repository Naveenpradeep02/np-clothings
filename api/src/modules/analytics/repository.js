import db from '../../db/knex.js';
import crypto from 'crypto';

export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 64);
}

export async function insertEvent(data) {
  const [id] = await db('analytics_events').insert({
    event_type: data.event_type,
    user_id: data.user_id ?? null,
    session_id: data.session_id ?? null,
    product_id: data.product_id ?? null,
    variant_id: data.variant_id ?? null,
    category_id: data.category_id ?? null,
    order_id: data.order_id ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    ip_hash: data.ip_hash ?? null,
    user_agent: data.user_agent ? String(data.user_agent).slice(0, 512) : null,
    created_at: db.fn.now(),
  });
  return id;
}

export async function insertEventsBatch(rows) {
  if (!rows.length) return 0;
  await db('analytics_events').insert(
    rows.map((data) => ({
      event_type: data.event_type,
      user_id: data.user_id ?? null,
      session_id: data.session_id ?? null,
      product_id: data.product_id ?? null,
      variant_id: data.variant_id ?? null,
      category_id: data.category_id ?? null,
      order_id: data.order_id ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ip_hash: data.ip_hash ?? null,
      user_agent: data.user_agent ? String(data.user_agent).slice(0, 512) : null,
      created_at: db.fn.now(),
    }))
  );
  return rows.length;
}

export async function productPerformance({ from, to, limit = 20 } = {}) {
  let q = db('analytics_events as e')
    .leftJoin('products as p', 'p.id', 'e.product_id')
    .whereNotNull('e.product_id')
    .whereIn('e.event_type', [
      'product_view',
      'add_to_cart',
      'remove_from_cart',
      'begin_checkout',
      'purchase',
    ]);

  if (from) q = q.where('e.created_at', '>=', from);
  if (to) q = q.where('e.created_at', '<=', to);

  const rows = await q
    .select(
      'e.product_id',
      'p.name as product_name',
      'p.slug as product_slug',
      db.raw(`SUM(CASE WHEN e.event_type = 'product_view' THEN 1 ELSE 0 END) as views`),
      db.raw(`SUM(CASE WHEN e.event_type = 'add_to_cart' THEN 1 ELSE 0 END) as add_to_cart`),
      db.raw(`SUM(CASE WHEN e.event_type = 'purchase' THEN 1 ELSE 0 END) as purchases`)
    )
    .groupBy('e.product_id', 'p.name', 'p.slug')
    .orderBy('views', 'desc')
    .limit(limit);

  return rows.map((r) => {
    const views = Number(r.views) || 0;
    const atc = Number(r.add_to_cart) || 0;
    const purchases = Number(r.purchases) || 0;
    return {
      product_id: r.product_id,
      product_name: r.product_name,
      product_slug: r.product_slug,
      views,
      add_to_cart: atc,
      purchases,
      view_to_cart_rate: views ? Math.round((atc / views) * 10000) / 100 : 0,
      cart_to_purchase_rate: atc ? Math.round((purchases / atc) * 10000) / 100 : 0,
      view_to_purchase_rate: views ? Math.round((purchases / views) * 10000) / 100 : 0,
    };
  });
}

export async function overviewCounts({ from, to } = {}) {
  let eventQ = db('analytics_events');
  if (from) eventQ = eventQ.where('created_at', '>=', from);
  if (to) eventQ = eventQ.where('created_at', '<=', to);

  const byType = await eventQ
    .clone()
    .select('event_type')
    .count({ total: '*' })
    .groupBy('event_type');

  let orderQ = db('orders').whereNotIn('status', ['cancelled']);
  if (from) orderQ = orderQ.where('created_at', '>=', from);
  if (to) orderQ = orderQ.where('created_at', '<=', to);

  const [{ order_count }] = await orderQ.clone().count({ order_count: '*' });
  const [{ revenue }] = await orderQ
    .clone()
    .whereIn('status', [
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'return_requested',
      'return_approved',
      'return_received',
      'refunded',
    ])
    .sum({ revenue: 'grand_total' });

  let searchQ = db('search_events');
  if (from) searchQ = searchQ.where('created_at', '>=', from);
  if (to) searchQ = searchQ.where('created_at', '<=', to);
  const [{ searches }] = await searchQ.count({ searches: '*' });

  const events = {};
  for (const row of byType) {
    events[row.event_type] = Number(row.total);
  }

  return {
    events,
    orders: Number(order_count) || 0,
    revenue: Number(revenue) || 0,
    searches: Number(searches) || 0,
  };
}

export async function topSearches({ from, to, limit = 20 } = {}) {
  let q = db('search_events');
  if (from) q = q.where('created_at', '>=', from);
  if (to) q = q.where('created_at', '<=', to);

  return q
    .select('query')
    .count({ count: '*' })
    .avg({ avg_results: 'results_count' })
    .groupBy('query')
    .orderBy('count', 'desc')
    .limit(limit);
}

export async function funnel({ from, to } = {}) {
  const types = ['product_view', 'add_to_cart', 'begin_checkout', 'purchase'];
  const result = {};
  for (const type of types) {
    let q = db('analytics_events').where({ event_type: type });
    if (from) q = q.where('created_at', '>=', from);
    if (to) q = q.where('created_at', '<=', to);
    const [{ total }] = await q.count({ total: '*' });
    result[type] = Number(total) || 0;
  }
  return result;
}

export async function dailyTrend({ from, to, eventType = 'product_view' } = {}) {
  let q = db('analytics_events').where({ event_type: eventType });
  if (from) q = q.where('created_at', '>=', from);
  if (to) q = q.where('created_at', '<=', to);

  return q
    .select(db.raw('DATE(created_at) as day'))
    .count({ total: '*' })
    .groupByRaw('DATE(created_at)')
    .orderBy('day', 'asc');
}

export default {
  hashIp,
  insertEvent,
  insertEventsBatch,
  productPerformance,
  overviewCounts,
  topSearches,
  funnel,
  dailyTrend,
};
