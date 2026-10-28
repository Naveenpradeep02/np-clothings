import db from '../../db/knex.js';

export async function createReview(data, trx = db) {
  const [id] = await trx('reviews').insert({
    product_id: data.product_id,
    variant_id: data.variant_id ?? null,
    user_id: data.user_id,
    order_id: data.order_id ?? null,
    rating: data.rating,
    title: data.title ?? null,
    body: data.body ?? null,
    status: data.status || 'pending',
    is_verified_purchase: Boolean(data.is_verified_purchase),
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('reviews').where({ id }).first();
}

export async function addMedia(reviewId, urls, trx = db) {
  if (!urls?.length) return;
  await trx('review_media').insert(
    urls.map((url, i) => ({
      review_id: reviewId,
      url,
      sort_order: i,
      created_at: trx.fn.now(),
    }))
  );
}

export async function findById(id) {
  return db('reviews').where({ id }).first();
}

export async function findByUserProduct(userId, productId) {
  return db('reviews').where({ user_id: userId, product_id: productId }).first();
}

export async function getMedia(reviewId) {
  return db('review_media').where({ review_id: reviewId }).orderBy('sort_order', 'asc');
}

export async function listByProduct(
  productId,
  { status = 'approved', limit = 20, offset = 0 } = {}
) {
  let q = db('reviews as r')
    .join('users as u', 'u.id', 'r.user_id')
    .where('r.product_id', productId)
    .select(
      'r.*',
      'u.display_name as user_display_name',
      'u.email as user_email'
    );

  if (status && status !== 'all') q = q.where('r.status', status);

  const rows = await q
    .clone()
    .orderBy('r.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQ = db('reviews').where({ product_id: productId });
  if (status && status !== 'all') countQ = countQ.where({ status });
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function listAdmin({ status, limit = 20, offset = 0 } = {}) {
  let q = db('reviews as r')
    .join('products as p', 'p.id', 'r.product_id')
    .join('users as u', 'u.id', 'r.user_id')
    .select(
      'r.*',
      'p.name as product_name',
      'p.slug as product_slug',
      'u.display_name as user_display_name'
    );

  if (status) q = q.where('r.status', status);

  const rows = await q.clone().orderBy('r.created_at', 'desc').limit(limit).offset(offset);
  let countQ = db('reviews');
  if (status) countQ = countQ.where({ status });
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function updateStatus(id, status, trx = db) {
  await trx('reviews').where({ id }).update({ status, updated_at: trx.fn.now() });
  return trx('reviews').where({ id }).first();
}

export async function insertModeration(data, trx = db) {
  const [id] = await trx('review_moderation').insert({
    review_id: data.review_id,
    action: data.action,
    reason: data.reason ?? null,
    actor_id: data.actor_id,
    created_at: trx.fn.now(),
  });
  return id;
}

export async function ratingSummary(productId) {
  const rows = await db('reviews')
    .where({ product_id: productId, status: 'approved' })
    .select('rating')
    .count({ total: '*' })
    .groupBy('rating');

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;
  for (const r of rows) {
    const rating = Number(r.rating);
    const total = Number(r.total);
    distribution[rating] = total;
    sum += rating * total;
    count += total;
  }
  return {
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    count,
    distribution,
  };
}

/** User purchased this product (delivered/confirmed order with item) */
export async function findVerifiedOrder(userId, productId) {
  return db('order_items as oi')
    .join('orders as o', 'o.id', 'oi.order_id')
    .where('o.user_id', userId)
    .where('oi.product_id', productId)
    .whereIn('o.status', [
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
    ])
    .select('o.id as order_id')
    .first();
}

export default {
  createReview,
  addMedia,
  findById,
  findByUserProduct,
  getMedia,
  listByProduct,
  listAdmin,
  updateStatus,
  insertModeration,
  ratingSummary,
  findVerifiedOrder,
};
