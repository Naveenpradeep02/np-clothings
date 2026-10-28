/**
 * Orders — checkout, admin lifecycle, invoices.
 */

import * as ordersRepo from './repository.js';
import * as cartsRepo from '../carts/repository.js';
import * as cartService from '../carts/service.js';
import * as inventoryService from '../inventory/service.js';
import * as couponService from '../coupons/service.js';
import { canTransition, nextStatuses } from './transitions.js';
import { writeAudit } from '../audit/service.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';
import { recordBusinessEvent } from '../../lib/metrics.js';
import * as notifications from '../notifications/service.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`orders.${fn} failed`, err);
  throw new ServiceUnavailableError('Orders temporarily unavailable');
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AU-${ts}-${rand}`;
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

function formatOrder(order, items = [], extras = {}) {
  return {
    ...order,
    shipping_address: parseJson(order.shipping_address),
    billing_address: parseJson(order.billing_address),
    subtotal: Number(order.subtotal),
    discount_amount: Number(order.discount_amount),
    tax_amount: Number(order.tax_amount),
    shipping_amount: Number(order.shipping_amount),
    grand_total: Number(order.grand_total),
    items: items.map((it) => ({
      ...it,
      selected_options: parseJson(it.selected_options),
      unit_price: Number(it.unit_price),
      line_subtotal: Number(it.line_subtotal),
      line_discount: Number(it.line_discount),
      line_tax: Number(it.line_tax),
      line_total: Number(it.line_total),
    })),
    allowed_next_statuses: nextStatuses(order.status),
    ...extras,
  };
}

// ---------- Checkout (7.1) ----------

export async function checkout({
  userId,
  cartId,
  shippingAddress,
  billingAddress,
  couponCode,
  customerNote,
}) {
  try {
    if (!userId) throw new BadRequestError('Authentication required for checkout');
    if (!cartId) throw new BadRequestError('cart_id is required');
    if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.full_name) {
      throw new BadRequestError('Complete shipping_address is required');
    }

    const cart = await cartsRepo.findCartById(cartId);
    if (!cart) throw new NotFoundError('Cart not found');
    if (cart.user_id && Number(cart.user_id) !== Number(userId)) {
      throw new ForbiddenError('Cart does not belong to this user');
    }

    const view = await cartService.getCartView(cartId, { couponCode, userId });
    if (!view.items.length) throw new BadRequestError('Cart is empty');

    const unavailable = view.items.filter((i) => !i.in_stock);
    if (unavailable.length) {
      throw new ConflictError(
        `Insufficient stock for: ${unavailable.map((i) => i.sku).join(', ')}`
      );
    }

    let couponId = null;
    let couponCodeSaved = null;
    if (couponCode && view.coupon && !view.coupon.error) {
      couponId = view.coupon.id;
      couponCodeSaved = view.coupon.code;
    } else if (couponCode && view.coupon?.error) {
      throw new BadRequestError(view.coupon.error);
    }

    for (const item of view.items) {
      await inventoryService.commitSale(item.variant_id, item.quantity, {
        actorId: userId,
      });
    }

    let order;
    try {
      order = await db.transaction(async (trx) => {
        const orderNumber = generateOrderNumber();
        const created = await ordersRepo.createOrder(
          {
            order_number: orderNumber,
            user_id: userId,
            status: 'pending',
            currency: view.currency || 'INR',
            subtotal: view.totals.subtotal,
            discount_amount: view.totals.discount_amount,
            tax_amount: view.totals.tax_amount,
            shipping_amount: view.totals.shipping_amount,
            grand_total: view.totals.grand_total,
            coupon_id: couponId,
            coupon_code: couponCodeSaved,
            shipping_address: shippingAddress,
            billing_address: billingAddress || shippingAddress,
            customer_note: customerNote || null,
          },
          trx
        );

        const lineItems = view.items.map((it) => ({
          variant_id: it.variant_id,
          product_id: it.product_id,
          product_name: it.product_name,
          sku: it.sku,
          selected_options: it.options || [],
          unit_price: it.unit_price,
          quantity: it.quantity,
          line_subtotal: it.line_total,
          line_discount: 0,
          line_tax: 0,
          line_total: it.line_total,
        }));

        await ordersRepo.insertOrderItems(created.id, lineItems, trx);
        await ordersRepo.insertStatusHistory(
          created.id,
          { from_status: null, to_status: 'pending', note: 'Order placed', actor_id: userId },
          trx
        );

        if (couponId) {
          await trx('coupon_redemptions').insert({
            coupon_id: couponId,
            user_id: userId,
            order_id: created.id,
            discount_amount: view.totals.discount_amount,
            created_at: trx.fn.now(),
          });
        }

        await cartsRepo.clearItems(cartId);
        return created;
      });
    } catch (err) {
      for (const item of view.items) {
        try {
          await inventoryService.restockFromReturn(item.variant_id, item.quantity, {
            actorId: userId,
            reason: 'Checkout rollback',
          });
        } catch (re) {
          logger.error('Checkout restock failed', re);
        }
      }
      throw err;
    }

    recordBusinessEvent('checkout', { currency: view.currency || 'INR' });
    return getOrder(order.id, userId);
  } catch (err) {
    wrap('checkout', err);
  }
}

export async function getOrder(orderId, userId, { admin = false } = {}) {
  try {
    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (!admin && userId && Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your order');
    }
    const items = await ordersRepo.getItems(orderId);
    const extras = {};
    if (admin) {
      extras.history = await ordersRepo.getStatusHistory(orderId);
      extras.payments = await ordersRepo.getPaymentsForOrder(orderId);
    }
    return formatOrder(order, items, extras);
  } catch (err) {
    wrap('getOrder', err);
  }
}

export async function listMyOrders(userId, pagination) {
  try {
    const { rows, total } = await ordersRepo.listByUser(userId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return {
      rows: rows.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        grand_total: Number(o.grand_total),
        currency: o.currency,
        created_at: o.created_at,
        confirmed_at: o.confirmed_at,
        delivered_at: o.delivered_at,
      })),
      total,
    };
  } catch (err) {
    wrap('listMyOrders', err);
  }
}

// ---------- Admin (8.1) ----------

export async function listOrdersAdmin(pagination, filters = {}) {
  try {
    const { rows, total } = await ordersRepo.listOrders({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      userId: filters.userId,
      search: filters.search,
      from: filters.from,
      to: filters.to,
    });
    return {
      rows: rows.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        user_id: o.user_id,
        status: o.status,
        grand_total: Number(o.grand_total),
        currency: o.currency,
        coupon_code: o.coupon_code,
        created_at: o.created_at,
        confirmed_at: o.confirmed_at,
        delivered_at: o.delivered_at,
        allowed_next_statuses: nextStatuses(o.status),
      })),
      total,
    };
  } catch (err) {
    wrap('listOrdersAdmin', err);
  }
}

/**
 * Controlled status transition with history + audit.
 */
export async function transitionStatus(actor, orderId, { status, note }) {
  try {
    if (!status) throw new BadRequestError('status is required');

    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (!canTransition(order.status, status)) {
      throw new ConflictError(
        `Cannot transition from ${order.status} to ${status}. Allowed: ${nextStatuses(order.status).join(', ') || 'none'}`
      );
    }

    const extra = {};
    if (status === 'confirmed' && !order.confirmed_at) extra.confirmed_at = new Date();
    if (status === 'delivered') extra.delivered_at = new Date();
    if (status === 'cancelled') extra.cancelled_at = new Date();

    const updated = await db.transaction(async (trx) => {
      const row = await ordersRepo.updateOrderStatus(orderId, status, extra, trx);
      await ordersRepo.insertStatusHistory(
        orderId,
        {
          from_status: order.status,
          to_status: status,
          note: note || null,
          actor_id: actor?.id,
        },
        trx
      );
      return row;
    });

    // Restock on cancel if still early
    if (status === 'cancelled' && ['pending', 'confirmed', 'processing'].includes(order.status)) {
      const items = await ordersRepo.getItems(orderId);
      for (const it of items) {
        try {
          await inventoryService.restockFromReturn(it.variant_id, it.quantity, {
            actorId: actor?.id,
            reason: `Order ${order.order_number} cancelled`,
          });
        } catch (err) {
          logger.error('Cancel restock failed', { orderId, variant: it.variant_id, err });
        }
      }
    }

    await writeAudit({
      actorId: actor?.id,
      action: 'order.status_changed',
      entityType: 'order',
      entityId: Number(orderId),
      oldValues: { status: order.status },
      newValues: { status, note },
    });

    // Non-blocking notifications
    const eventMap = {
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    if (eventMap[status]) {
      const full = await getOrder(orderId, null, { admin: true });
      notifications
        .notifyOrderEvent(eventMap[status], full, full.shipping_address || {})
        .catch((err) => logger.error('notifyOrderEvent failed', err));
    }

    return getOrder(orderId, null, { admin: true });
  } catch (err) {
    wrap('transitionStatus', err);
  }
}

/**
 * Structured invoice payload (PDF generation can wrap this later).
 */
export async function getInvoice(orderId, userId, { admin = false } = {}) {
  try {
    const order = await getOrder(orderId, userId, { admin });
    const brand = {
      name: 'AUREA',
      legal_name: 'AUREA Apparel Pvt Ltd',
      address: 'Mumbai, India',
      gstin: '27AAAAA0000A1Z5',
      support_email: 'support@aurea.example',
    };

    return {
      invoice_number: `INV-${order.order_number}`,
      invoice_date: order.confirmed_at || order.created_at,
      order_number: order.order_number,
      order_status: order.status,
      currency: order.currency,
      brand,
      bill_to: order.billing_address || order.shipping_address,
      ship_to: order.shipping_address,
      line_items: order.items.map((it) => ({
        description: it.product_name,
        sku: it.sku,
        options: it.selected_options,
        quantity: it.quantity,
        unit_price: it.unit_price,
        line_total: it.line_total,
      })),
      totals: {
        subtotal: order.subtotal,
        discount: order.discount_amount,
        tax: order.tax_amount,
        shipping: order.shipping_amount,
        grand_total: order.grand_total,
      },
      coupon_code: order.coupon_code,
      notes: order.customer_note,
    };
  } catch (err) {
    wrap('getInvoice', err);
  }
}

export default {
  checkout,
  getOrder,
  listMyOrders,
  listOrdersAdmin,
  transitionStatus,
  getInvoice,
};
