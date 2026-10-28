import env from '../../config/env.js';
import { MockProvider } from './MockProvider.js';
import { RazorpayProvider } from './RazorpayProvider.js';

let instance = null;

export function getPaymentProvider() {
  if (instance) return instance;
  const name = (env.payment.provider || process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  if (name === 'razorpay') {
    instance = new RazorpayProvider();
  } else {
    instance = new MockProvider();
  }
  return instance;
}

export function resetPaymentProvider() {
  instance = null;
}

export default { getPaymentProvider, resetPaymentProvider };
