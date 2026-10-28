/**
 * Payments — create intent, process webhooks (idempotent), confirm order.
 * Frontend success is NEVER trusted alone.
 */

import * as repo from './repository.js';
import * as ordersRepo from '../orders/repository.js';
import { getPaymentProvider } from '../../services/payment/index.js';
import { EVENT } from '../../services/payment/types.js';
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
    const e = new AppError(err.message, { status: err.status, code: err.code, details: err.details });
    throw e;
  }
  logger.error(`payments.${fn} failed`, err);
  throw new ServiceUnavailableError('Payments temporarily unavailable');
}

/**
 * Create a payment record + provider order/intent for a pending order.
 */
export async function createPaymentIntent(userId, orderId) {
  try {
    const order = await ordersRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your order');
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestError(`Cannot pay for order in status ${order.status}`);
    }

    // Existing paid payment?
    const existing = await repo.findByOrderId(orderId);
    const alreadyPaid = existing.find((p) => p.status === 'paid');
    if (alreadyPaid) {
      throw new ConflictError('Order is already paid');
    }

    const provider = getPaymentProvider();
    const amount = Number(order.grand_total);

    const providerResult = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount,
      currency: order.currency || 'INR',
      metadata: { order_number: order.order_number },
    });

    const payment = await repo.createPayment({
      order_id: order.id,
      provider: provider.name,
      provider_payment_id: providerResult.providerPaymentId,
      amount,
      currency: order.currency || 'INR',
      status: 'pending',
      raw_response: providerResult.raw,
    });

    return {
      payment_id: payment.id,
      provider: provider.name,
      amount,
      currency: payment.currency,
      status: payment.status,
      // Client needs these to open checkout widget
      client: {
        key_id: providerResult.keyId || null,
        order_id: providerResult.orderId || providerResult.providerPaymentId,
        client_secret: providerResult.clientSecret || null,
        provider_payment_id: providerResult.providerPaymentId,
      },
    };
  } catch (err) {
    wrap('createPaymentIntent', err);
  }
}

/**
 * Process normalized webhook — idempotent on provider_event_id.
 */
export async function processWebhook({ providerName, rawBody, signature, payload }) {
  try {
    const provider = getPaymentProvider();
    // If configured provider name mismatches, still try parse with current
    if (provider.name !== providerName && providerName !== 'mock') {
      logger.warn('Webhook provider mismatch', { expected: provider.name, got: providerName });
    }

    const ok = provider.verifyWebhookSignature(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(payload),
      signature
    );
    if (!ok && provider.name !== 'mock') {
      throw new ForbiddenError('Invalid webhook signature');
    }

    const event = provider.parseWebhook(payload || {});
    if (!event.providerEventId) {
      throw new BadRequestError('Webhook missing event id');
    }

    // Idempotency
    const existingEvent = await repo.findEvent(provider.name, event.providerEventId);
    if (existingEvent?.processed) {
      return { duplicate: true, event_id: existingEvent.id };
    }

    const result = await db.transaction(async (trx) => {
      let eventRowId = existingEvent?.id;
      if (!eventRowId) {
        eventRowId = await repo.insertEvent(
          {
            provider: provider.name,
            provider_event_id: event.providerEventId,
            event_type: event.eventType,
            payload: event.raw,
            processed: false,
          },
          trx
        );
      }

      let payment = null;
      if (event.providerPaymentId) {
        payment = await repo.findByProviderPaymentId(provider.name, event.providerPaymentId);
      }

      if (!payment && event.raw?.notes?.order_id) {
        const list = await repo.findByOrderId(Number(event.raw.notes.order_id));
        payment = list[0];
      }

      if (payment) {
        await trx('payment_events').where({ id: eventRowId }).update({ payment_id: payment.id });
      }

      if (event.eventType === EVENT.PAID && payment) {
        if (payment.status !== 'paid') {
          await repo.updatePayment(
            payment.id,
            {
              status: 'paid',
              paid_at: new Date(),
              raw_response: event.raw,
            },
            trx
          );

          const order = await trx('orders').where({ id: payment.order_id }).first();
          if (order && order.status === 'pending') {
            await trx('orders').where({ id: order.id }).update({
              status: 'confirmed',
              confirmed_at: trx.fn.now(),
              updated_at: trx.fn.now(),
            });
            await ordersRepo.insertStatusHistory(
              order.id,
              {
                from_status: 'pending',
                to_status: 'confirmed',
                note: 'Payment confirmed via webhook',
              },
              trx
            );
          }
        }
      } else if (event.eventType === EVENT.FAILED && payment && payment.status === 'pending') {
        await repo.updatePayment(
          payment.id,
          {
            status: 'failed',
            failure_reason: event.raw?.error_description || 'Payment failed',
            raw_response: event.raw,
          },
          trx
        );
      }

      await repo.markEventProcessed(eventRowId, trx);

      return {
        duplicate: false,
        event_id: eventRowId,
        event_type: event.eventType,
        payment_id: payment?.id || null,
        order_id: payment?.order_id || null,
      };
    });

    logger.info('Webhook processed', result);
    return result;
  } catch (err) {
    wrap('processWebhook', err);
  }
}

/**
 * Dev helper: simulate successful payment for mock provider.
 */
export async function mockConfirm(userId, paymentId) {
  try {
    const payment = await repo.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    const order = await ordersRepo.findById(payment.order_id);
    if (!order || Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your payment');
    }
    if (payment.provider !== 'mock') {
      throw new BadRequestError('mockConfirm only works with mock provider');
    }

    return processWebhook({
      providerName: 'mock',
      rawBody: '{}',
      signature: 'valid',
      payload: {
        id: `mock_confirm_${paymentId}_${Date.now()}`,
        event: 'payment.paid',
        provider_payment_id: payment.provider_payment_id,
        amount: Number(payment.amount),
      },
    });
  } catch (err) {
    wrap('mockConfirm', err);
  }
}

export async function getPayment(userId, paymentId) {
  try {
    const payment = await repo.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    const order = await ordersRepo.findById(payment.order_id);
    if (!order || Number(order.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your payment');
    }
    return {
      id: payment.id,
      order_id: payment.order_id,
      provider: payment.provider,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paid_at: payment.paid_at,
    };
  } catch (err) {
    wrap('getPayment', err);
  }
}

export default {
  createPaymentIntent,
  processWebhook,
  mockConfirm,
  getPayment,
};
