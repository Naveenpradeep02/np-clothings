import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockProvider } from '../../services/payment/MockProvider.js';
import { EVENT } from '../../services/payment/types.js';

describe('MockProvider', () => {
  const p = new MockProvider();

  it('creates payment ids', async () => {
    const r = await p.createPayment({
      orderId: 1,
      orderNumber: 'AU-1',
      amount: 100,
      currency: 'INR',
    });
    assert.ok(r.providerPaymentId.startsWith('mock_pay_'));
    assert.equal(r.keyId, 'mock_key');
  });

  it('parses paid webhook', () => {
    const e = p.parseWebhook({
      id: 'evt_1',
      event: 'payment.paid',
      provider_payment_id: 'mock_pay_abc',
      amount: 100,
    });
    assert.equal(e.eventType, EVENT.PAID);
    assert.equal(e.providerEventId, 'evt_1');
  });

  it('verifies mock signature', () => {
    assert.equal(p.verifyWebhookSignature('{}', 'valid', 'secret'), true);
  });
});
