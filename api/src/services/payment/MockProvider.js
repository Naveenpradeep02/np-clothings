/**
 * Dev/test payment provider — no external calls.
 * Simulates order creation; webhooks can be posted manually.
 */

import crypto from 'crypto';
import { EVENT } from './types.js';

export class MockProvider {
  constructor() {
    this.name = 'mock';
  }

  async createPayment(input) {
    const providerPaymentId = `mock_pay_${crypto.randomBytes(8).toString('hex')}`;
    return {
      providerPaymentId,
      orderId: providerPaymentId,
      keyId: 'mock_key',
      clientSecret: `mock_secret_${providerPaymentId}`,
      raw: { mock: true, amount: input.amount, currency: input.currency },
    };
  }

  /**
   * Verify webhook signature (mock: accept X-Mock-Signature: valid).
   */
  verifyWebhookSignature(rawBody, signature, secret) {
    if (!secret) return true; // dev
    return signature === 'valid' || signature === secret;
  }

  /**
   * Normalize inbound webhook payload.
   */
  parseWebhook(payload) {
    const eventId =
      payload.id || payload.event_id || `mock_evt_${crypto.randomBytes(6).toString('hex')}`;
    const type = payload.event || payload.type || 'payment.paid';
    let eventType = EVENT.UNKNOWN;
    if (/paid|captured|success/i.test(type)) eventType = EVENT.PAID;
    else if (/fail/i.test(type)) eventType = EVENT.FAILED;
    else if (/authoriz/i.test(type)) eventType = EVENT.AUTHORIZED;
    else if (/refund/i.test(type)) eventType = EVENT.REFUNDED;
    else if (/cancel/i.test(type)) eventType = EVENT.CANCELLED;

    return {
      providerEventId: String(eventId),
      eventType,
      providerPaymentId:
        payload.provider_payment_id ||
        payload.payment_id ||
        payload.payload?.payment?.entity?.id ||
        null,
      amount: payload.amount != null ? Number(payload.amount) : undefined,
      currency: payload.currency || 'INR',
      raw: payload,
    };
  }
}

export default MockProvider;
