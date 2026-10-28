import db from '../../db/knex.js';

export async function createShipment(data, trx = db) {
  const [id] = await trx('shipments').insert({
    order_id: data.order_id,
    courier_name: data.courier_name,
    courier_code: data.courier_code ?? null,
    tracking_number: data.tracking_number ?? null,
    tracking_url: data.tracking_url ?? null,
    status: data.status || 'label_created',
    provider: data.provider ?? null,
    provider_shipment_id: data.provider_shipment_id ?? null,
    shipped_at: data.shipped_at ?? null,
    delivered_at: data.delivered_at ?? null,
    created_by: data.created_by ?? null,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('shipments').where({ id }).first();
}

export async function findById(id) {
  return db('shipments').where({ id }).first();
}

export async function findByTrackingNumber(trackingNumber) {
  return db('shipments').where({ tracking_number: trackingNumber }).first();
}

export async function listByOrder(orderId) {
  return db('shipments').where({ order_id: orderId }).orderBy('id', 'asc');
}

export async function listShipments({ limit = 20, offset = 0, status, search } = {}) {
  let q = db('shipments as s')
    .join('orders as o', 'o.id', 's.order_id')
    .select('s.*', 'o.order_number', 'o.user_id');

  if (status) q = q.where('s.status', status);
  if (search) {
    q = q.where((b) => {
      b.whereILike('s.tracking_number', `%${search}%`)
        .orWhereILike('o.order_number', `%${search}%`)
        .orWhereILike('s.courier_name', `%${search}%`);
    });
  }

  const rows = await q.clone().orderBy('s.created_at', 'desc').limit(limit).offset(offset);

  let countQ = db('shipments as s').join('orders as o', 'o.id', 's.order_id');
  if (status) countQ = countQ.where('s.status', status);
  if (search) {
    countQ = countQ.where((b) => {
      b.whereILike('s.tracking_number', `%${search}%`).orWhereILike('o.order_number', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function updateShipment(id, patch, trx = db) {
  const data = { updated_at: trx.fn.now() };
  for (const key of [
    'courier_name',
    'courier_code',
    'tracking_number',
    'tracking_url',
    'status',
    'provider',
    'provider_shipment_id',
    'shipped_at',
    'delivered_at',
  ]) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  await trx('shipments').where({ id }).update(data);
  return trx('shipments').where({ id }).first();
}

export async function insertEvent(data, trx = db) {
  // Dedup by provider_event_id when present
  if (data.provider_event_id) {
    const existing = await trx('tracking_events')
      .where({ shipment_id: data.shipment_id, provider_event_id: data.provider_event_id })
      .first();
    if (existing) return existing;
  }
  const [id] = await trx('tracking_events').insert({
    shipment_id: data.shipment_id,
    status: data.status,
    description: data.description ?? null,
    location: data.location ?? null,
    event_time: data.event_time || trx.fn.now(),
    provider_event_id: data.provider_event_id ?? null,
    raw_payload: data.raw_payload ? JSON.stringify(data.raw_payload) : null,
    created_at: trx.fn.now(),
  });
  return trx('tracking_events').where({ id }).first();
}

export async function listEvents(shipmentId) {
  return db('tracking_events')
    .where({ shipment_id: shipmentId })
    .orderBy('event_time', 'asc')
    .orderBy('id', 'asc');
}

export default {
  createShipment,
  findById,
  findByTrackingNumber,
  listByOrder,
  listShipments,
  updateShipment,
  insertEvent,
  listEvents,
};
