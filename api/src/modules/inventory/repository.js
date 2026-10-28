/**
 * Inventory repository — stock rows, ledger, reservations.
 * All mutating paths should run inside a transaction with FOR UPDATE locks.
 */

import db from '../../db/knex.js';

export async function getByVariantId(variantId, trx = db) {
  return trx('inventory').where({ variant_id: variantId }).first();
}

export async function getByVariantIdForUpdate(variantId, trx) {
  return trx('inventory').where({ variant_id: variantId }).forUpdate().first();
}

export async function ensureInventoryRow(variantId, trx = db) {
  let row = await getByVariantId(variantId, trx);
  if (!row) {
    await trx('inventory').insert({
      variant_id: variantId,
      quantity: 0,
      reserved_quantity: 0,
      low_stock_threshold: 5,
      updated_at: trx.fn.now(),
    });
    row = await getByVariantId(variantId, trx);
  }
  return row;
}

export async function updateQuantities(variantId, { quantity, reserved_quantity }, trx = db) {
  const patch = { updated_at: trx.fn.now() };
  if (quantity !== undefined) patch.quantity = quantity;
  if (reserved_quantity !== undefined) patch.reserved_quantity = reserved_quantity;
  await trx('inventory').where({ variant_id: variantId }).update(patch);
  return getByVariantId(variantId, trx);
}

export async function setThreshold(variantId, low_stock_threshold, trx = db) {
  await trx('inventory').where({ variant_id: variantId }).update({
    low_stock_threshold,
    updated_at: trx.fn.now(),
  });
  return getByVariantId(variantId, trx);
}

export async function insertLedger(entry, trx = db) {
  const [id] = await trx('inventory_ledger').insert({
    variant_id: entry.variant_id,
    change_type: entry.change_type,
    quantity_delta: entry.quantity_delta,
    quantity_after: entry.quantity_after,
    reference_type: entry.reference_type ?? null,
    reference_id: entry.reference_id ?? null,
    reason: entry.reason ?? null,
    actor_id: entry.actor_id ?? null,
    created_at: trx.fn.now(),
  });
  return id;
}

export async function listLedger(variantId, { limit = 50, offset = 0 } = {}) {
  const rows = await db('inventory_ledger')
    .where({ variant_id: variantId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db('inventory_ledger')
    .where({ variant_id: variantId })
    .count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function listLowStock({ limit = 50, offset = 0 } = {}) {
  const rows = await db('inventory as i')
    .join('product_variants as v', 'v.id', 'i.variant_id')
    .join('products as p', 'p.id', 'v.product_id')
    .whereNull('v.deleted_at')
    .whereRaw('(i.quantity - i.reserved_quantity) <= i.low_stock_threshold')
    .select(
      'i.*',
      'v.sku',
      'v.product_id',
      'p.name as product_name',
      db.raw('(i.quantity - i.reserved_quantity) as available')
    )
    .orderBy('available', 'asc')
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db('inventory as i')
    .join('product_variants as v', 'v.id', 'i.variant_id')
    .whereNull('v.deleted_at')
    .whereRaw('(i.quantity - i.reserved_quantity) <= i.low_stock_threshold')
    .count({ total: '*' });

  return { rows, total: Number(total) };
}

export async function listInventory({ limit = 20, offset = 0, search } = {}) {
  let q = db('inventory as i')
    .join('product_variants as v', 'v.id', 'i.variant_id')
    .join('products as p', 'p.id', 'v.product_id')
    .whereNull('v.deleted_at')
    .select(
      'i.*',
      'v.sku',
      'v.product_id',
      'v.status as variant_status',
      'p.name as product_name',
      db.raw('(i.quantity - i.reserved_quantity) as available')
    );

  if (search) {
    q = q.where((b) => {
      b.whereILike('v.sku', `%${search}%`).orWhereILike('p.name', `%${search}%`);
    });
  }

  const rows = await q.clone().orderBy('i.updated_at', 'desc').limit(limit).offset(offset);

  let countQ = db('inventory as i')
    .join('product_variants as v', 'v.id', 'i.variant_id')
    .whereNull('v.deleted_at');
  if (search) {
    countQ = countQ.where((b) => {
      b.whereILike('v.sku', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function createReservation(data, trx = db) {
  const [id] = await trx('inventory_reservations').insert({
    variant_id: data.variant_id,
    cart_id: data.cart_id ?? null,
    order_id: data.order_id ?? null,
    quantity: data.quantity,
    status: 'active',
    expires_at: data.expires_at,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('inventory_reservations').where({ id }).first();
}

export async function findReservation(id, trx = db) {
  return trx('inventory_reservations').where({ id }).first();
}

export async function updateReservationStatus(id, status, trx = db) {
  await trx('inventory_reservations').where({ id }).update({
    status,
    updated_at: trx.fn.now(),
  });
  return findReservation(id, trx);
}

export async function listExpiredActiveReservations(now = new Date(), trx = db) {
  return trx('inventory_reservations')
    .where({ status: 'active' })
    .where('expires_at', '<', now)
    .select('*');
}

export async function variantExists(variantId) {
  return db('product_variants').where({ id: variantId }).whereNull('deleted_at').first();
}

export default {
  getByVariantId,
  getByVariantIdForUpdate,
  ensureInventoryRow,
  updateQuantities,
  setThreshold,
  insertLedger,
  listLedger,
  listLowStock,
  listInventory,
  createReservation,
  findReservation,
  updateReservationStatus,
  listExpiredActiveReservations,
  variantExists,
};
