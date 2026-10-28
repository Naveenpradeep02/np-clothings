/**
 * Razorpay adapter (structure + signature verify).
 * Live API calls require PAYMENT_SECRET_KEY; otherwise createPayment throws.
 */

import crypto from 'crypto';
import { EVENT } from './types.js';
import env from '../../config/env.js';

export class RazorpayProvider {
  constructor() {
    this.name = 'razorpay';
    this.keyId = env.payment.publicKey || process.env.PAYMENT_PUBLIC_KEY || '';
    this.keySecret = env.payment.secretKey || process.env.PAYMENT_SECRET_KEY || '';
    this.webhookSecret = env.payment.webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET || '';
  }

  async createPayment(input) {
    if (!this.keySecret || !this.keyId) {
      const err = new Error('Razorpay is not configured (PAYMENT_PUBLIC_KEY / PAYMENT_SECRET_KEY)');
      err.code = 'PAYMENT_PROVIDER_UNCONFIGURED';
      err.status = 503;
      throw err;
    }

    // Amount in paise
    const amountPaise = Math.round(Number(input.amount) * 100);
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: input.currency || 'INR',
        receipt: input.orderNumber,
        notes: {
          order_id: String(input.orderId),
          ...(input.metadata || {}),
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.error?.description || 'Razorpay order create failed');
      err.status = 502;
      err.code = 'PAYMENT_PROVIDER_ERROR';
      err.details = data;
      throw err;
    }

    return {
      providerPaymentId: data.id,
      orderId: data.id,
      keyId: this.keyId,
      raw: data,
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
    } catch {
      return false;
    }
  }

  parseWebhook(payload) {
    const event = payload.event || '';
    const paymentEntity = payload.payload?.payment?.entity || {};
    const orderEntity = payload.payload?.order?.entity || {};

    let eventType = EVENT.UNKNOWN;
    if (event === 'payment.captured' || event === 'order.paid') eventType = EVENT.PAID;
    else if (event === 'payment.failed') eventType = EVENT.FAILED;
    else if (event === 'payment.authorized') eventType = EVENT.AUTHORIZED;
    else if (event?.includes('refund')) eventType = EVENT.REFUNDED;

    return {
      providerEventId: String(payload.event_id || `${event}_${paymentEntity.id || Date.now()}`),
      eventType,
      providerPaymentId: paymentEntity.id || orderEntity.id || null,
      amount: paymentEntity.amount != null ? paymentEntity.amount / 100 : undefined,
      currency: paymentEntity.currency || 'INR',
      raw: payload,
    };
  }
}

export default RazorpayProvider;
