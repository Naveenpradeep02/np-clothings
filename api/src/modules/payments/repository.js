import db from '../../db/knex.js';

export async function createPayment(data, trx = db) {
  const [id] = await trx('payments').insert({
    order_id: data.order_id,
    provider: data.provider,
    provider_payment_id: data.provider_payment_id ?? null,
    amount: data.amount,
    currency: data.currency || 'INR',
    status: data.status || 'pending',
    method: data.method ?? null,
    raw_response: data.raw_response ? JSON.stringify(data.raw_response) : null,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('payments').where({ id }).first();
}

export async function findById(id) {
  return db('payments').where({ id }).first();
}

export async function findByProviderPaymentId(provider, providerPaymentId) {
  return db('payments')
    .where({ provider, provider_payment_id: providerPaymentId })
    .orderBy('id', 'desc')
    .first();
}

export async function findByOrderId(orderId) {
  return db('payments').where({ order_id: orderId }).orderBy('id', 'desc');
}

export async function updatePayment(id, patch, trx = db) {
  const data = { updated_at: trx.fn.now() };
  for (const key of ['status', 'provider_payment_id', 'method', 'paid_at', 'failure_reason']) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  if (patch.raw_response !== undefined) {
    data.raw_response = JSON.stringify(patch.raw_response);
  }
  await trx('payments').where({ id }).update(data);
  return trx('payments').where({ id }).first();
}

export async function findEvent(provider, providerEventId) {
  return db('payment_events').where({ provider, provider_event_id: providerEventId }).first();
}

export async function insertEvent(data, trx = db) {
  const [id] = await trx('payment_events').insert({
    payment_id: data.payment_id ?? null,
    provider: data.provider,
    provider_event_id: data.provider_event_id,
    event_type: data.event_type,
    payload: JSON.stringify(data.payload || {}),
    processed: data.processed ?? false,
    processed_at: data.processed_at ?? null,
    created_at: trx.fn.now(),
  });
  return id;
}

export async function markEventProcessed(id, trx = db) {
  await trx('payment_events').where({ id }).update({
    processed: true,
    processed_at: trx.fn.now(),
  });
}

export default {
  createPayment,
  findById,
  findByProviderPaymentId,
  findByOrderId,
  updatePayment,
  findEvent,
  insertEvent,
  markEventProcessed,
};
