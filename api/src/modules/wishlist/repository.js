import db from '../../db/knex.js';

export async function listByUser(userId) {
  return db('wishlist_items as w')
    .leftJoin('products as p', 'p.id', 'w.product_id')
    .leftJoin('product_variants as v', 'v.id', 'w.variant_id')
    .where('w.user_id', userId)
    .select(
      'w.id',
      'w.product_id',
      'w.variant_id',
      'w.created_at',
      'p.name as product_name',
      'p.slug as product_slug',
      'p.status as product_status',
      'v.sku',
      'v.price as variant_price'
    )
    .orderBy('w.created_at', 'desc');
}

export async function findOne(userId, productId, variantId) {
  let q = db('wishlist_items').where({ user_id: userId, product_id: productId });
  if (variantId == null) q = q.whereNull('variant_id');
  else q = q.where({ variant_id: variantId });
  return q.first();
}

export async function add({ userId, productId, variantId }) {
  const existing = await findOne(userId, productId, variantId ?? null);
  if (existing) return existing;
  const [id] = await db('wishlist_items').insert({
    user_id: userId,
    product_id: productId,
    variant_id: variantId ?? null,
    created_at: db.fn.now(),
  });
  return db('wishlist_items').where({ id }).first();
}

export async function remove(userId, id) {
  return db('wishlist_items').where({ id, user_id: userId }).del();
}

export async function removeByProduct(userId, productId, variantId) {
  let q = db('wishlist_items').where({ user_id: userId, product_id: productId });
  if (variantId == null) q = q.whereNull('variant_id');
  else q = q.where({ variant_id: variantId });
  return q.del();
}

export default { listByUser, findOne, add, remove, removeByProduct };
