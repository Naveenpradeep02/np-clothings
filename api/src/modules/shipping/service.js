/**
 * Shipping — manual + automatic tracking.
 * Provider credentials stay server-side.
 */

import * as repo from './repository.js';
import * as ordersRepo from '../orders/repository.js';
import { getShippingProvider } from '../../services/shipping/index.js';
import { ALL_STATUSES, SHIPMENT_STATUS } from '../../services/shipping/types.js';
import { writeAudit } from '../audit/service.js';
import * as notifications from '../notifications/service.js';
import { canTransition } from '../orders/transitions.js';
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
  if (err.status && err.code) {
    throw new AppError(err.message, { status: err.status, code: err.code });
  }
  logger.error(`shipping.${fn} failed`, err);
  throw new ServiceUnavailableError('Shipping temporarily unavailable');
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

async function hydrate(shipment) {
  if (!shipment) return null;
  const events = await repo.listEvents(shipment.id);
  return {
    ...shipment,
    events: events.map((e) => ({
      ...e,
      raw_payload: parseJson(e.raw_payload),
    })),
  };
}

/**
 * Create shipment for an order (manual or provider-assisted).
 * Optionally advances order status to shipped when appropriate.
 */
export async function createShipment(actor, body) {
  try {
    const orderId = Number(body.order_id);
    if (!orderId) throw new BadRequestError('order_id is required');
    if (!body.courier_name?.trim()) throw new BadRequestError('courier_name is required');

    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (!['confirmed', 'processing', 'packed', 'shipped'].includes(order.status)) {
      throw new ConflictError(
        `Cannot ship order in status ${order.status}. Confirm/pack first.`
      );
    }

    let tracking_number = body.tracking_number?.trim() || null;
    let tracking_url = body.tracking_url?.trim() || null;
    let provider = body.provider || null;
    let provider_shipment_id = null;
    let status = body.status || SHIPMENT_STATUS.LABEL_CREATED;
    if (!ALL_STATUSES.includes(status)) {
      throw new BadRequestError(`Invalid status. Allowed: ${ALL_STATUSES.join(', ')}`);
    }

    // Optional provider registration
    if (body.register_with_provider) {
      const shippingProvider = getShippingProvider();
      const result = await shippingProvider.createShipment({
        trackingNumber: tracking_number,
        courierCode: body.courier_code,
        orderNumber: order.order_number,
      });
      provider = shippingProvider.name;
      provider_shipment_id = result.providerShipmentId;
      tracking_number = tracking_number || result.trackingNumber;
      tracking_url = tracking_url || result.trackingUrl;
      status = result.status || status;
    }

    const shipment = await db.transaction(async (trx) => {
      const row = await repo.createShipment(
        {
          order_id: orderId,
          courier_name: body.courier_name.trim(),
          courier_code: body.courier_code || null,
          tracking_number,
          tracking_url,
          status,
          provider,
          provider_shipment_id,
          shipped_at:
            status !== SHIPMENT_STATUS.LABEL_CREATED ? new Date() : body.shipped_at || null,
          created_by: actor?.id,
        },
        trx
      );

      await repo.insertEvent(
        {
          shipment_id: row.id,
          status,
          description: body.note || `Shipment created via ${provider || 'manual'}`,
          location: body.location || null,
          event_time: new Date(),
          provider_event_id: provider_shipment_id
            ? `create_${provider_shipment_id}`
            : `manual_create_${row.id}`,
        },
        trx
      );

      // Advance order toward shipped if still early
      if (canTransition(order.status, 'shipped') || order.status === 'packed') {
        if (order.status === 'packed' || order.status === 'processing') {
          const from = order.status;
          if (canTransition(from, 'shipped')) {
            await ordersRepo.updateOrderStatus(orderId, 'shipped', {}, trx);
            await ordersRepo.insertStatusHistory(
              orderId,
              {
                from_status: from,
                to_status: 'shipped',
                note: `Shipment ${tracking_number || row.id} created`,
                actor_id: actor?.id,
              },
              trx
            );
          }
        }
      }

      return row;
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'shipment.created',
      entityType: 'shipment',
      entityId: shipment.id,
      newValues: {
        order_id: orderId,
        tracking_number,
        courier_name: body.courier_name,
      },
    });

    // Notify (non-blocking)
    try {
      const fullOrder = await ordersRepo.findById(orderId);
      const addr = parseJson(fullOrder.shipping_address) || {};
      if (addr.phone) {
        notifications
          .notifyOrderEvent('order_shipped', {
            ...fullOrder,
            tracking_number,
            shipping_address: addr,
          }, addr)
          .catch((err) => logger.error('ship notify failed', err));
      }
    } catch (err) {
      logger.warn('ship notify skipped', { error: err.message });
    }

    return hydrate(shipment);
  } catch (err) {
    wrap('createShipment', err);
  }
}

export async function getShipment(id) {
  try {
    const row = await repo.findById(id);
    if (!row) throw new NotFoundError('Shipment not found');
    return hydrate(row);
  } catch (err) {
    wrap('getShipment', err);
  }
}

export async function getByOrder(orderId, { userId, admin = false } = {}) {
  try {
    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (!admin && userId && Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your order');
    }
    const rows = await repo.listByOrder(orderId);
    return Promise.all(rows.map(hydrate));
  } catch (err) {
    wrap('getByOrder', err);
  }
}

export async function getByTracking(trackingNumber) {
  try {
    const row = await repo.findByTrackingNumber(trackingNumber);
    if (!row) throw new NotFoundError('Shipment not found');
    // Public tracking — limited fields
    const full = await hydrate(row);
    return {
      tracking_number: full.tracking_number,
      courier_name: full.courier_name,
      status: full.status,
      tracking_url: full.tracking_url,
      shipped_at: full.shipped_at,
      delivered_at: full.delivered_at,
      events: full.events.map((e) => ({
        status: e.status,
        description: e.description,
        location: e.location,
        event_time: e.event_time,
      })),
    };
  } catch (err) {
    wrap('getByTracking', err);
  }
}

export async function listShipments(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.listShipments({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      search: filters.search,
    });
    return { rows, total };
  } catch (err) {
    wrap('listShipments', err);
  }
}

/**
 * Manual tracking event / status update.
 */
export async function addEvent(actor, shipmentId, body) {
  try {
    const shipment = await repo.findById(shipmentId);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const status = body.status || shipment.status;
    if (!ALL_STATUSES.includes(status)) {
      throw new BadRequestError(`Invalid status. Allowed: ${ALL_STATUSES.join(', ')}`);
    }

    const event = await db.transaction(async (trx) => {
      const ev = await repo.insertEvent(
        {
          shipment_id: shipmentId,
          status,
          description: body.description || body.note || status,
          location: body.location || null,
          event_time: body.event_time ? new Date(body.event_time) : new Date(),
          provider_event_id: body.provider_event_id || `manual_${shipmentId}_${Date.now()}`,
          raw_payload: body.raw || null,
        },
        trx
      );

      const patch = { status };
      if (
        status === SHIPMENT_STATUS.PICKED_UP ||
        status === SHIPMENT_STATUS.IN_TRANSIT ||
        status === SHIPMENT_STATUS.OUT_FOR_DELIVERY
      ) {
        if (!shipment.shipped_at) patch.shipped_at = new Date();
      }
      if (status === SHIPMENT_STATUS.DELIVERED) {
        patch.delivered_at = new Date();
      }
      await repo.updateShipment(shipmentId, patch, trx);

      // Sync order delivered
      if (status === SHIPMENT_STATUS.DELIVERED) {
        const order = await trx('orders').where({ id: shipment.order_id }).first();
        if (order && canTransition(order.status, 'delivered')) {
          await ordersRepo.updateOrderStatus(
            order.id,
            'delivered',
            { delivered_at: new Date() },
            trx
          );
          await ordersRepo.insertStatusHistory(
            order.id,
            {
              from_status: order.status,
              to_status: 'delivered',
              note: `Tracking delivered (${shipment.tracking_number || shipmentId})`,
              actor_id: actor?.id,
            },
            trx
          );
        }
      }

      return ev;
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'shipment.event_added',
      entityType: 'shipment',
      entityId: Number(shipmentId),
      newValues: { status, description: body.description },
    });

    return hydrate(await repo.findById(shipmentId));
  } catch (err) {
    wrap('addEvent', err);
  }
}

/**
 * Pull latest tracking from provider and merge events.
 */
export async function syncFromProvider(shipmentId) {
  try {
    const shipment = await repo.findById(shipmentId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    if (!shipment.tracking_number) {
      throw new BadRequestError('Shipment has no tracking number');
    }

    const provider = getShippingProvider();
    const tracking = await provider.getTracking(shipment.tracking_number);

    await db.transaction(async (trx) => {
      for (const ev of tracking.events || []) {
        await repo.insertEvent(
          {
            shipment_id: shipmentId,
            status: ev.status,
            description: ev.description,
            location: ev.location,
            event_time: new Date(ev.eventTime),
            provider_event_id: ev.providerEventId,
            raw_payload: tracking.raw,
          },
          trx
        );
      }
      const patch = { status: tracking.status };
      if (tracking.status === SHIPMENT_STATUS.DELIVERED) {
        patch.delivered_at = new Date();
      }
      if (
        tracking.status !== SHIPMENT_STATUS.LABEL_CREATED &&
        !shipment.shipped_at
      ) {
        patch.shipped_at = new Date();
      }
      await repo.updateShipment(shipmentId, patch, trx);
    });

    return hydrate(await repo.findById(shipmentId));
  } catch (err) {
    wrap('syncFromProvider', err);
  }
}

/**
 * Provider webhook — idempotent on provider_event_id.
 */
export async function processWebhook({ rawBody, signature, payload }) {
  try {
    const provider = getShippingProvider();
    const ok = provider.verifyWebhookSignature(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(payload),
      signature,
      process.env.SHIPPING_WEBHOOK_SECRET
    );
    if (!ok && provider.name !== 'mock') {
      throw new ForbiddenError('Invalid shipping webhook signature');
    }

    const event = provider.parseWebhook(payload || {});
    if (!event.trackingNumber) {
      throw new BadRequestError('Webhook missing tracking number');
    }

    const shipment = await repo.findByTrackingNumber(event.trackingNumber);
    if (!shipment) {
      logger.warn('Webhook for unknown tracking', { tracking: event.trackingNumber });
      return { matched: false };
    }

    await addEvent(
      null,
      shipment.id,
      {
        status: event.status,
        description: event.description,
        location: event.location,
        event_time: event.eventTime,
        provider_event_id: event.providerEventId,
        raw: event.raw,
      }
    );

    return { matched: true, shipment_id: shipment.id, status: event.status };
  } catch (err) {
    wrap('processWebhook', err);
  }
}

export default {
  createShipment,
  getShipment,
  getByOrder,
  getByTracking,
  listShipments,
  addEvent,
  syncFromProvider,
  processWebhook,
};
