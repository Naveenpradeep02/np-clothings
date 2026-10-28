import db from '../../db/knex.js';

export async function findCartById(id) {
  return db('carts').where({ id }).first();
}

export async function findCartByUser(userId) {
  return db('carts').where({ user_id: userId }).orderBy('id', 'desc').first();
}

export async function findCartBySession(sessionId) {
  return db('carts').where({ session_id: sessionId }).orderBy('id', 'desc').first();
}

export async function createCart({ userId = null, sessionId = null, currency = 'INR' }) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [id] = await db('carts').insert({
    user_id: userId,
    session_id: sessionId,
    currency,
    expires_at: expires,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findCartById(id);
}

export async function listItems(cartId) {
  return db('cart_items as ci')
    .join('product_variants as v', 'v.id', 'ci.variant_id')
    .join('products as p', 'p.id', 'v.product_id')
    .where('ci.cart_id', cartId)
    .whereNull('v.deleted_at')
    .select(
      'ci.id as cart_item_id',
      'ci.quantity',
      'ci.variant_id',
      'v.sku',
      'v.price',
      'v.compare_at_price',
      'v.status as variant_status',
      'v.product_id',
      'p.name as product_name',
      'p.slug as product_slug'
    );
}

export async function findItem(cartId, variantId) {
  return db('cart_items').where({ cart_id: cartId, variant_id: variantId }).first();
}

export async function upsertItem(cartId, variantId, quantity) {
  const existing = await findItem(cartId, variantId);
  if (existing) {
    await db('cart_items').where({ id: existing.id }).update({
      quantity,
      updated_at: db.fn.now(),
    });
    return findItem(cartId, variantId);
  }
  const [id] = await db('cart_items').insert({
    cart_id: cartId,
    variant_id: variantId,
    quantity,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return db('cart_items').where({ id }).first();
}

export async function updateItemQty(cartItemId, quantity) {
  await db('cart_items').where({ id: cartItemId }).update({
    quantity,
    updated_at: db.fn.now(),
  });
  return db('cart_items').where({ id: cartItemId }).first();
}

export async function removeItem(cartId, cartItemId) {
  return db('cart_items').where({ id: cartItemId, cart_id: cartId }).del();
}

export async function clearItems(cartId) {
  return db('cart_items').where({ cart_id: cartId }).del();
}

export async function touchCart(cartId) {
  await db('carts').where({ id: cartId }).update({ updated_at: db.fn.now() });
}

export default {
  findCartById,
  findCartByUser,
  findCartBySession,
  createCart,
  listItems,
  findItem,
  upsertItem,
  updateItemQty,
  removeItem,
  clearItems,
  touchCart,
};
