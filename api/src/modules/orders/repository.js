import db from '../../db/knex.js';

export async function createOrder(data, trx = db) {
  const [id] = await trx('orders').insert({
    order_number: data.order_number,
    user_id: data.user_id,
    status: data.status || 'pending',
    currency: data.currency || 'INR',
    subtotal: data.subtotal,
    discount_amount: data.discount_amount || 0,
    tax_amount: data.tax_amount || 0,
    shipping_amount: data.shipping_amount || 0,
    grand_total: data.grand_total,
    coupon_id: data.coupon_id ?? null,
    coupon_code: data.coupon_code ?? null,
    shipping_address: JSON.stringify(data.shipping_address),
    billing_address: data.billing_address ? JSON.stringify(data.billing_address) : null,
    customer_note: data.customer_note ?? null,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('orders').where({ id }).first();
}

export async function insertOrderItems(orderId, items, trx = db) {
  if (!items.length) return;
  await trx('order_items').insert(
    items.map((it) => ({
      order_id: orderId,
      variant_id: it.variant_id,
      product_id: it.product_id,
      product_name: it.product_name,
      sku: it.sku,
      selected_options: JSON.stringify(it.selected_options || []),
      unit_price: it.unit_price,
      quantity: it.quantity,
      line_subtotal: it.line_subtotal,
      line_discount: it.line_discount || 0,
      line_tax: it.line_tax || 0,
      line_total: it.line_total,
      created_at: trx.fn.now(),
    }))
  );
}

export async function insertStatusHistory(
  orderId,
  { from_status, to_status, note, actor_id },
  trx = db
) {
  await trx('order_status_history').insert({
    order_id: orderId,
    from_status: from_status ?? null,
    to_status,
    note: note ?? null,
    actor_id: actor_id ?? null,
    created_at: trx.fn.now(),
  });
}

export async function findById(id) {
  return db('orders').where({ id }).first();
}

export async function findByNumber(orderNumber) {
  return db('orders').where({ order_number: orderNumber }).first();
}

export async function listByUser(userId, { limit = 20, offset = 0 } = {}) {
  const rows = await db('orders')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db('orders').where({ user_id: userId }).count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function getItems(orderId) {
  return db('order_items').where({ order_id: orderId }).orderBy('id', 'asc');
}

export async function listOrders({
  limit = 20,
  offset = 0,
  status,
  userId,
  search,
  from,
  to,
} = {}) {
  let q = db('orders as o').select('o.*');

  if (status) q = q.where('o.status', status);
  if (userId) q = q.where('o.user_id', userId);
  if (search) {
    q = q.where((b) => {
      b.whereILike('o.order_number', `%${search}%`);
    });
  }
  if (from) q = q.where('o.created_at', '>=', from);
  if (to) q = q.where('o.created_at', '<=', to);

  const rows = await q.clone().orderBy('o.created_at', 'desc').limit(limit).offset(offset);

  let countQ = db('orders as o');
  if (status) countQ = countQ.where('o.status', status);
  if (userId) countQ = countQ.where('o.user_id', userId);
  if (search) countQ = countQ.whereILike('o.order_number', `%${search}%`);
  if (from) countQ = countQ.where('o.created_at', '>=', from);
  if (to) countQ = countQ.where('o.created_at', '<=', to);
  const [{ total }] = await countQ.count({ total: '*' });

  return { rows, total: Number(total) };
}

export async function updateOrderStatus(id, status, extra = {}, trx = db) {
  const patch = {
    status,
    updated_at: trx.fn.now(),
    ...extra,
  };
  await trx('orders').where({ id }).update(patch);
  return trx('orders').where({ id }).first();
}

export async function getStatusHistory(orderId) {
  return db('order_status_history')
    .where({ order_id: orderId })
    .orderBy('created_at', 'asc');
}

export async function getPaymentsForOrder(orderId) {
  return db('payments').where({ order_id: orderId }).orderBy('id', 'asc');
}

export default {
  createOrder,
  insertOrderItems,
  insertStatusHistory,
  findById,
  findByNumber,
  listByUser,
  getItems,
  listOrders,
  updateOrderStatus,
  getStatusHistory,
  getPaymentsForOrder,
};
