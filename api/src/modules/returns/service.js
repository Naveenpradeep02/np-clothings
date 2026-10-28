/**
 * Returns & refunds — policy eligibility, controlled status machine, refund records.
 */

import * as repo from './repository.js';
import * as ordersRepo from '../orders/repository.js';
import * as inventoryService from '../inventory/service.js';
import {
  canTransition,
  nextStatuses,
  ELIGIBLE_REASONS,
  DEFAULT_RETURN_WINDOW_DAYS,
} from './transitions.js';
import { writeAudit } from '../audit/service.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`returns.${fn} failed`, err);
  throw new ServiceUnavailableError('Returns temporarily unavailable');
}

function parseJson(val) {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

async function hydrate(row) {
  if (!row) return null;
  const items = await repo.getItems(row.id);
  return {
    ...row,
    evidence_urls: parseJson(row.evidence_urls),
    items,
    allowed_next_statuses: nextStatuses(row.status),
  };
}

function withinReturnWindow(order, windowDays = DEFAULT_RETURN_WINDOW_DAYS) {
  const anchor = order.delivered_at || order.confirmed_at || order.created_at;
  if (!anchor) return false;
  const end = new Date(anchor).getTime() + windowDays * 24 * 60 * 60 * 1000;
  return Date.now() <= end;
}

/**
 * Customer creates a return request for delivered/eligible order items.
 */
export async function createReturnRequest(userId, body) {
  try {
    const orderId = Number(body.order_id);
    if (!orderId) throw new BadRequestError('order_id is required');
    if (!ELIGIBLE_REASONS.includes(body.reason_code)) {
      throw new BadRequestError(
        `reason_code must be one of: ${ELIGIBLE_REASONS.join(', ')}`
      );
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestError('items[] required');
    }

    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your order');
    }

    if (!['delivered', 'return_requested'].includes(order.status)) {
      throw new ConflictError(
        `Returns only allowed for delivered orders (current: ${order.status})`
      );
    }

    if (!withinReturnWindow(order)) {
      throw new ConflictError(
        `Return window of ${DEFAULT_RETURN_WINDOW_DAYS} days has expired`
      );
    }

    const orderItems = await ordersRepo.getItems(orderId);
    const byId = new Map(orderItems.map((i) => [Number(i.id), i]));

    const returnItems = [];
    for (const it of body.items) {
      const oi = byId.get(Number(it.order_item_id));
      if (!oi) throw new BadRequestError(`Invalid order_item_id ${it.order_item_id}`);
      const qty = Number(it.quantity) || 1;
      if (qty < 1 || qty > Number(oi.quantity)) {
        throw new BadRequestError(`Invalid quantity for item ${oi.sku}`);
      }
      returnItems.push({
        order_item_id: oi.id,
        quantity: qty,
        condition_notes: it.condition_notes || null,
      });
    }

    const created = await db.transaction(async (trx) => {
      const row = await repo.createReturn(
        {
          order_id: orderId,
          user_id: userId,
          reason_code: body.reason_code,
          reason_text: body.reason_text || null,
          evidence_urls: body.evidence_urls || null,
          status: 'requested',
        },
        trx
      );
      await repo.insertReturnItems(row.id, returnItems, trx);

      // Reflect on order if still delivered
      if (order.status === 'delivered' && canTransition('delivered', 'return_requested')) {
        // order transitions use different map — update directly for return_requested
        await trx('orders').where({ id: orderId }).update({
          status: 'return_requested',
          updated_at: trx.fn.now(),
        });
        await ordersRepo.insertStatusHistory(
          orderId,
          {
            from_status: 'delivered',
            to_status: 'return_requested',
            note: `Return request #${row.id}`,
            actor_id: userId,
          },
          trx
        );
      }

      return row;
    });

    await writeAudit({
      actorId: userId,
      action: 'return.requested',
      entityType: 'return_request',
      entityId: created.id,
      newValues: { order_id: orderId, reason_code: body.reason_code },
    });

    return hydrate(created);
  } catch (err) {
    wrap('createReturnRequest', err);
  }
}

export async function getReturn(id, userId, { admin = false } = {}) {
  try {
    const row = await repo.findById(id);
    if (!row) throw new NotFoundError('Return request not found');
    if (!admin && Number(row.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your return request');
    }
    return hydrate(row);
  } catch (err) {
    wrap('getReturn', err);
  }
}

export async function listMyReturns(userId, pagination) {
  try {
    const { rows, total } = await repo.listByUser(userId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return {
      rows: rows.map((r) => ({
        id: r.id,
        order_id: r.order_id,
        status: r.status,
        reason_code: r.reason_code,
        created_at: r.created_at,
        allowed_next_statuses: nextStatuses(r.status),
      })),
      total,
    };
  } catch (err) {
    wrap('listMyReturns', err);
  }
}

export async function listReturnsAdmin(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.listAll({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      search: filters.search,
    });
    return {
      rows: rows.map((r) => ({
        ...r,
        evidence_urls: parseJson(r.evidence_urls),
        allowed_next_statuses: nextStatuses(r.status),
      })),
      total,
    };
  } catch (err) {
    wrap('listReturnsAdmin', err);
  }
}

/**
 * Staff transitions return status (approve/reject/receive/inspect…).
 */
export async function transitionReturn(actor, id, { status, admin_note }) {
  try {
    if (!status) throw new BadRequestError('status is required');
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Return request not found');

    if (!canTransition(current.status, status)) {
      throw new ConflictError(
        `Cannot transition from ${current.status} to ${status}. Allowed: ${nextStatuses(current.status).join(', ') || 'none'}`
      );
    }

    const patch = { status, admin_note: admin_note ?? current.admin_note };
    if (['approved', 'rejected'].includes(status)) {
      patch.reviewed_by = actor?.id;
      patch.reviewed_at = new Date();
    }

    const updated = await repo.updateReturn(id, patch);

    // Restock when received/inspected confirms physical return
    if (status === 'received' || status === 'inspected') {
      const items = await repo.getItems(id);
      for (const it of items) {
        if (it.variant_id) {
          try {
            await inventoryService.restockFromReturn(it.variant_id, it.quantity, {
              actorId: actor?.id,
              reason: `Return #${id} ${status}`,
            });
          } catch (err) {
            logger.error('Return restock failed', { variant: it.variant_id, err });
          }
        }
      }
    }

    // Sync order status lightly
    if (status === 'approved') {
      await db('orders').where({ id: current.order_id }).update({
        status: 'return_approved',
        updated_at: db.fn.now(),
      });
    }
    if (status === 'rejected') {
      await db('orders').where({ id: current.order_id }).update({
        status: 'delivered',
        updated_at: db.fn.now(),
      });
    }

    await writeAudit({
      actorId: actor?.id,
      action: 'return.status_changed',
      entityType: 'return_request',
      entityId: Number(id),
      oldValues: { status: current.status },
      newValues: { status, admin_note },
    });

    return hydrate(updated);
  } catch (err) {
    wrap('transitionReturn', err);
  }
}

/**
 * Process refund after return is inspected / refund_pending.
 * Requires payments:refund permission at route level.
 */
export async function processRefund(actor, returnId, body = {}) {
  try {
    const ret = await repo.findById(returnId);
    if (!ret) throw new NotFoundError('Return request not found');

    if (!['inspected', 'refund_pending', 'approved', 'received'].includes(ret.status)) {
      throw new ConflictError(
        `Cannot refund from status ${ret.status}. Inspect/approve first.`
      );
    }

    const payment = await repo.getPaidPayment(ret.order_id);
    if (!payment) throw new ConflictError('No paid payment found for this order');

    const items = await repo.getItems(returnId);
    let amount =
      body.amount != null
        ? Number(body.amount)
        : items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);
    amount = Math.round(amount * 100) / 100;

    if (amount <= 0 || amount > Number(payment.amount)) {
      throw new BadRequestError('Invalid refund amount');
    }

    const refund = await db.transaction(async (trx) => {
      // Move to refund_pending if needed
      if (ret.status !== 'refund_pending' && ret.status !== 'refunded') {
        if (canTransition(ret.status, 'refund_pending')) {
          await repo.updateReturn(returnId, { status: 'refund_pending' }, trx);
        }
      }

      const rec = await repo.createRefund(
        {
          payment_id: payment.id,
          order_id: ret.order_id,
          amount,
          reason: body.reason || `Return #${returnId}`,
          status: 'completed', // mock provider completion; real gateway later
          provider_refund_id: `mock_rfnd_${returnId}_${Date.now()}`,
          processed_by: actor?.id,
          processed_at: new Date(),
        },
        trx
      );

      await repo.linkRefundRecord(returnId, rec.id, trx);
      await repo.updateReturn(returnId, { status: 'refunded' }, trx);

      await trx('orders').where({ id: ret.order_id }).update({
        status: 'refunded',
        updated_at: trx.fn.now(),
      });
      await ordersRepo.insertStatusHistory(
        ret.order_id,
        {
          from_status: ret.status,
          to_status: 'refunded',
          note: `Refund ₹${amount} for return #${returnId}`,
          actor_id: actor?.id,
        },
        trx
      );

      // Mark payment partially/fully refunded
      const newPayStatus =
        amount >= Number(payment.amount) ? 'refunded' : 'partially_refunded';
      await trx('payments').where({ id: payment.id }).update({
        status: newPayStatus,
        updated_at: trx.fn.now(),
      });

      return rec;
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'return.refunded',
      entityType: 'return_request',
      entityId: Number(returnId),
      newValues: { refund_id: refund.id, amount },
    });

    return {
      return: await hydrate(await repo.findById(returnId)),
      refund: {
        ...refund,
        amount: Number(refund.amount),
      },
    };
  } catch (err) {
    wrap('processRefund', err);
  }
}

export default {
  createReturnRequest,
  getReturn,
  listMyReturns,
  listReturnsAdmin,
  transitionReturn,
  processRefund,
};
