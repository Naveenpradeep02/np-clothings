import * as service from './service.js';
import { success, created } from '../../lib/response.js';

export async function createIntent(req, res) {
  const orderId = req.body?.order_id || req.params.orderId;
  const data = await service.createPaymentIntent(req.user.id, orderId);
  return created(res, data);
}

export async function get(req, res) {
  return success(res, await service.getPayment(req.user.id, req.params.id));
}

export async function webhook(req, res) {
  const providerName = req.params.provider || 'mock';
  const signature =
    req.headers['x-razorpay-signature'] ||
    req.headers['x-mock-signature'] ||
    req.headers['x-webhook-signature'] ||
    '';
  const rawBody = req.rawBody || JSON.stringify(req.body || {});

  const result = await service.processWebhook({
    providerName,
    rawBody,
    signature,
    payload: req.body || {},
  });

  // Always 200 after acceptance to avoid provider retries storms when duplicate
  return res.status(200).json({ success: true, data: result });
}

export async function mockConfirm(req, res) {
  const result = await service.mockConfirm(req.user.id, req.params.id);
  return success(res, result);
}

export default { createIntent, get, webhook, mockConfirm };
