/**
 * Inventory service — authoritative stock operations.
 * Available = quantity - reserved_quantity
 * Never allow negative quantity or reserved_quantity.
 */

import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import db from '../../db/knex.js';
import logger from '../../lib/logger.js';

const DEFAULT_RESERVATION_MINUTES = 30;

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`inventory.${fn} failed`, err);
  throw new ServiceUnavailableError('Inventory temporarily unavailable');
}

function toView(row) {
  if (!row) return null;
  const available = row.quantity - row.reserved_quantity;
  return {
    variant_id: row.variant_id,
    quantity: row.quantity,
    reserved_quantity: row.reserved_quantity,
    available,
    low_stock_threshold: row.low_stock_threshold,
    is_low_stock: available <= row.low_stock_threshold,
    updated_at: row.updated_at,
    sku: row.sku,
    product_id: row.product_id,
    product_name: row.product_name,
    variant_status: row.variant_status,
  };
}

export async function getInventory(variantId) {
  try {
    const variant = await repo.variantExists(variantId);
    if (!variant) throw new NotFoundError('Variant not found');
    let row = await repo.getByVariantId(variantId);
    if (!row) {
      row = await repo.ensureInventoryRow(variantId);
    }
    return toView({ ...row, sku: variant.sku, product_id: variant.product_id });
  } catch (err) {
    wrap('getInventory', err);
  }
}

export async function listInventory(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.listInventory({
      limit: pagination.limit,
      offset: pagination.offset,
      search: filters.search,
    });
    return { rows: rows.map(toView), total };
  } catch (err) {
    wrap('listInventory', err);
  }
}

export async function listLowStock(pagination) {
  try {
    const { rows, total } = await repo.listLowStock({
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { rows: rows.map(toView), total };
  } catch (err) {
    wrap('listLowStock', err);
  }
}

export async function getLedger(variantId, pagination) {
  try {
    const variant = await repo.variantExists(variantId);
    if (!variant) throw new NotFoundError('Variant not found');
    return await repo.listLedger(variantId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (err) {
    wrap('getLedger', err);
  }
}

/**
 * Admin stock adjustment.
 * body: { delta: number } OR { quantity: number } absolute set
 * optional reason, low_stock_threshold
 */
export async function adjustStock(actor, variantId, body) {
  try {
    const variant = await repo.variantExists(variantId);
    if (!variant) throw new NotFoundError('Variant not found');

    if (body.delta === undefined && body.quantity === undefined) {
      throw new BadRequestError('Provide delta or quantity');
    }

    const result = await db.transaction(async (trx) => {
      await repo.ensureInventoryRow(variantId, trx);
      const row = await repo.getByVariantIdForUpdate(variantId, trx);

      let newQty;
      if (body.quantity !== undefined) {
        newQty = Number(body.quantity);
        if (!Number.isFinite(newQty) || newQty < 0) {
          throw new BadRequestError('quantity must be a non-negative integer');
        }
        if (newQty < row.reserved_quantity) {
          throw new ConflictError(
            `Cannot set quantity ${newQty} below reserved ${row.reserved_quantity}`
          );
        }
      } else {
        const delta = Number(body.delta);
        if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
          throw new BadRequestError('delta must be an integer');
        }
        newQty = row.quantity + delta;
        if (newQty < 0) {
          throw new ConflictError('Insufficient stock for this adjustment');
        }
        if (newQty < row.reserved_quantity) {
          throw new ConflictError(
            `Adjustment would leave quantity ${newQty} below reserved ${row.reserved_quantity}`
          );
        }
      }

      const deltaApplied = newQty - row.quantity;
      const updated = await repo.updateQuantities(
        variantId,
        { quantity: newQty },
        trx
      );

      if (body.low_stock_threshold !== undefined) {
        const t = Number(body.low_stock_threshold);
        if (!Number.isFinite(t) || t < 0) {
          throw new BadRequestError('low_stock_threshold must be non-negative');
        }
        await repo.setThreshold(variantId, t, trx);
      }

      await repo.insertLedger(
        {
          variant_id: variantId,
          change_type: 'adjustment',
          quantity_delta: deltaApplied,
          quantity_after: newQty,
          reference_type: 'manual',
          reason: body.reason || 'Manual adjustment',
          actor_id: actor?.id,
        },
        trx
      );

      return updated;
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'inventory.adjusted',
      entityType: 'inventory',
      entityId: Number(variantId),
      newValues: {
        quantity: result.quantity,
        delta: body.delta,
        absolute: body.quantity,
        reason: body.reason,
      },
    });

    return getInventory(variantId);
  } catch (err) {
    wrap('adjustStock', err);
  }
}

/**
 * Reserve stock for a cart (or order). Increases reserved_quantity.
 * Returns reservation record.
 */
export async function reserveStock({
  variantId,
  quantity,
  cartId = null,
  orderId = null,
  ttlMinutes = DEFAULT_RESERVATION_MINUTES,
  actorId = null,
}) {
  try {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestError('quantity must be a positive integer');
    }

    const variant = await repo.variantExists(variantId);
    if (!variant) throw new NotFoundError('Variant not found');

    return await db.transaction(async (trx) => {
      await repo.ensureInventoryRow(variantId, trx);
      const row = await repo.getByVariantIdForUpdate(variantId, trx);
      const available = row.quantity - row.reserved_quantity;

      if (qty > available) {
        throw new ConflictError(`Only ${available} units available`);
      }

      const newReserved = row.reserved_quantity + qty;
      await repo.updateQuantities(variantId, { reserved_quantity: newReserved }, trx);

      const expires_at = new Date(Date.now() + ttlMinutes * 60 * 1000);
      const reservation = await repo.createReservation(
        {
          variant_id: variantId,
          cart_id: cartId,
          order_id: orderId,
          quantity: qty,
          expires_at,
        },
        trx
      );

      await repo.insertLedger(
        {
          variant_id: variantId,
          change_type: 'reservation',
          quantity_delta: 0, // on-hand unchanged; reserved increased
          quantity_after: row.quantity,
          reference_type: cartId ? 'cart' : orderId ? 'order' : 'reservation',
          reference_id: cartId || orderId || reservation.id,
          reason: `Reserved ${qty}`,
          actor_id: actorId,
        },
        trx
      );

      return {
        reservation,
        inventory: toView({
          ...row,
          reserved_quantity: newReserved,
          sku: variant.sku,
          product_id: variant.product_id,
        }),
      };
    });
  } catch (err) {
    wrap('reserveStock', err);
  }
}

/**
 * Release a reservation (cart abandoned / expired / cancelled).
 */
export async function releaseReservation(reservationId, { actorId = null, reason } = {}) {
  try {
    return await db.transaction(async (trx) => {
      const reservation = await repo.findReservation(reservationId, trx);
      if (!reservation) throw new NotFoundError('Reservation not found');
      if (reservation.status !== 'active') {
        throw new ConflictError(`Reservation is already ${reservation.status}`);
      }

      const row = await repo.getByVariantIdForUpdate(reservation.variant_id, trx);
      if (!row) throw new NotFoundError('Inventory row missing');

      const newReserved = Math.max(0, row.reserved_quantity - reservation.quantity);
      await repo.updateQuantities(
        reservation.variant_id,
        { reserved_quantity: newReserved },
        trx
      );
      await repo.updateReservationStatus(reservationId, 'released', trx);

      await repo.insertLedger(
        {
          variant_id: reservation.variant_id,
          change_type: 'release',
          quantity_delta: 0,
          quantity_after: row.quantity,
          reference_type: 'reservation',
          reference_id: reservationId,
          reason: reason || 'Reservation released',
          actor_id: actorId,
        },
        trx
      );

      return { reservation_id: reservationId, status: 'released' };
    });
  } catch (err) {
    wrap('releaseReservation', err);
  }
}

/**
 * Consume reservation on successful sale: decrease quantity and reserved.
 */
export async function consumeReservation(reservationId, { actorId = null, orderId = null } = {}) {
  try {
    return await db.transaction(async (trx) => {
      const reservation = await repo.findReservation(reservationId, trx);
      if (!reservation) throw new NotFoundError('Reservation not found');
      if (reservation.status !== 'active') {
        throw new ConflictError(`Reservation is already ${reservation.status}`);
      }

      const row = await repo.getByVariantIdForUpdate(reservation.variant_id, trx);
      const qty = reservation.quantity;

      if (row.quantity < qty) {
        throw new ConflictError('On-hand stock lower than reservation');
      }

      const newQty = row.quantity - qty;
      const newReserved = Math.max(0, row.reserved_quantity - qty);

      await repo.updateQuantities(
        reservation.variant_id,
        { quantity: newQty, reserved_quantity: newReserved },
        trx
      );
      await repo.updateReservationStatus(reservationId, 'consumed', trx);

      await repo.insertLedger(
        {
          variant_id: reservation.variant_id,
          change_type: 'sale',
          quantity_delta: -qty,
          quantity_after: newQty,
          reference_type: 'order',
          reference_id: orderId || reservation.order_id,
          reason: 'Sale consumed reservation',
          actor_id: actorId,
        },
        trx
      );

      return {
        reservation_id: reservationId,
        status: 'consumed',
        quantity_after: newQty,
      };
    });
  } catch (err) {
    wrap('consumeReservation', err);
  }
}

/**
 * Direct sale without prior reservation (e.g. immediate checkout).
 */
export async function commitSale(variantId, quantity, { orderId, actorId } = {}) {
  try {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestError('quantity must be a positive integer');
    }

    return await db.transaction(async (trx) => {
      await repo.ensureInventoryRow(variantId, trx);
      const row = await repo.getByVariantIdForUpdate(variantId, trx);
      const available = row.quantity - row.reserved_quantity;
      if (qty > available) {
        throw new ConflictError(`Only ${available} units available`);
      }

      const newQty = row.quantity - qty;
      await repo.updateQuantities(variantId, { quantity: newQty }, trx);

      await repo.insertLedger(
        {
          variant_id: variantId,
          change_type: 'sale',
          quantity_delta: -qty,
          quantity_after: newQty,
          reference_type: 'order',
          reference_id: orderId,
          reason: 'Direct sale',
          actor_id: actorId,
        },
        trx
      );

      return { variant_id: variantId, quantity_after: newQty };
    });
  } catch (err) {
    wrap('commitSale', err);
  }
}

/**
 * Restock from return.
 */
export async function restockFromReturn(variantId, quantity, { returnId, actorId, reason } = {}) {
  try {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestError('quantity must be a positive integer');
    }

    return await db.transaction(async (trx) => {
      await repo.ensureInventoryRow(variantId, trx);
      const row = await repo.getByVariantIdForUpdate(variantId, trx);
      const newQty = row.quantity + qty;
      await repo.updateQuantities(variantId, { quantity: newQty }, trx);

      await repo.insertLedger(
        {
          variant_id: variantId,
          change_type: 'return',
          quantity_delta: qty,
          quantity_after: newQty,
          reference_type: 'return',
          reference_id: returnId,
          reason: reason || 'Return restock',
          actor_id: actorId,
        },
        trx
      );

      return { variant_id: variantId, quantity_after: newQty };
    });
  } catch (err) {
    wrap('restockFromReturn', err);
  }
}

/**
 * Expire stale active reservations (job / on-demand).
 */
export async function expireReservations() {
  try {
    const expired = await repo.listExpiredActiveReservations();
    const results = [];
    for (const r of expired) {
      try {
        const out = await releaseReservation(r.id, {
          reason: 'Reservation expired',
        });
        // mark as expired rather than released
        await db('inventory_reservations').where({ id: r.id }).update({ status: 'expired' });
        results.push({ id: r.id, status: 'expired' });
      } catch (err) {
        logger.warn('Failed to expire reservation', { id: r.id, error: err.message });
        results.push({ id: r.id, error: err.message });
      }
    }
    return { processed: results.length, results };
  } catch (err) {
    wrap('expireReservations', err);
  }
}

export default {
  getInventory,
  listInventory,
  listLowStock,
  getLedger,
  adjustStock,
  reserveStock,
  releaseReservation,
  consumeReservation,
  commitSale,
  restockFromReturn,
  expireReservations,
};
