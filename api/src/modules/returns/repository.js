import db from '../../db/knex.js';

export async function createReturn(data, trx = db) {
  const [id] = await trx('return_requests').insert({
    order_id: data.order_id,
    user_id: data.user_id,
    status: data.status || 'requested',
    reason_code: data.reason_code,
    reason_text: data.reason_text ?? null,
    evidence_urls: data.evidence_urls ? JSON.stringify(data.evidence_urls) : null,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('return_requests').where({ id }).first();
}

export async function insertReturnItems(returnId, items, trx = db) {
  if (!items.length) return;
  await trx('return_items').insert(
    items.map((it) => ({
      return_request_id: returnId,
      order_item_id: it.order_item_id,
      quantity: it.quantity,
      condition_notes: it.condition_notes ?? null,
      created_at: trx.fn.now(),
    }))
  );
}

export async function findById(id) {
  return db('return_requests').where({ id }).first();
}

export async function getItems(returnId) {
  return db('return_items as ri')
    .join('order_items as oi', 'oi.id', 'ri.order_item_id')
    .where('ri.return_request_id', returnId)
    .select(
      'ri.*',
      'oi.product_name',
      'oi.sku',
      'oi.unit_price',
      'oi.quantity as ordered_quantity',
      'oi.variant_id',
      'oi.product_id'
    );
}

export async function listByUser(userId, { limit = 20, offset = 0 } = {}) {
  const rows = await db('return_requests')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db('return_requests').where({ user_id: userId }).count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function listAll({ limit = 20, offset = 0, status, search } = {}) {
  let q = db('return_requests as rr')
    .join('orders as o', 'o.id', 'rr.order_id')
    .select('rr.*', 'o.order_number');

  if (status) q = q.where('rr.status', status);
  if (search) {
    q = q.where((b) => {
      b.whereILike('o.order_number', `%${search}%`);
    });
  }

  const rows = await q.clone().orderBy('rr.created_at', 'desc').limit(limit).offset(offset);
  let countQ = db('return_requests as rr').join('orders as o', 'o.id', 'rr.order_id');
  if (status) countQ = countQ.where('rr.status', status);
  if (search) countQ = countQ.whereILike('o.order_number', `%${search}%`);
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function updateReturn(id, patch, trx = db) {
  const data = { updated_at: trx.fn.now() };
  for (const key of [
    'status',
    'admin_note',
    'reviewed_by',
    'reviewed_at',
    'reason_text',
  ]) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  await trx('return_requests').where({ id }).update(data);
  return trx('return_requests').where({ id }).first();
}

export async function createRefund(data, trx = db) {
  const [id] = await trx('refunds').insert({
    payment_id: data.payment_id,
    order_id: data.order_id,
    amount: data.amount,
    reason: data.reason ?? null,
    status: data.status || 'pending',
    provider_refund_id: data.provider_refund_id ?? null,
    processed_by: data.processed_by ?? null,
    processed_at: data.processed_at ?? null,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('refunds').where({ id }).first();
}

export async function linkRefundRecord(returnRequestId, refundId, trx = db) {
  await trx('refund_records').insert({
    return_request_id: returnRequestId,
    refund_id: refundId,
    created_at: trx.fn.now(),
  });
}

export async function listRefundsForOrder(orderId) {
  return db('refunds').where({ order_id: orderId }).orderBy('id', 'asc');
}

export async function getPaidPayment(orderId) {
  return db('payments')
    .where({ order_id: orderId, status: 'paid' })
    .orderBy('id', 'desc')
    .first();
}

export default {
  createReturn,
  insertReturnItems,
  findById,
  getItems,
  listByUser,
  listAll,
  updateReturn,
  createRefund,
  linkRefundRecord,
  listRefundsForOrder,
  getPaidPayment,
};
