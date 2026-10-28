/**
 * @typedef {object} CreatePaymentInput
 * @property {string} orderNumber
 * @property {number} orderId
 * @property {number} amount - major currency units (e.g. INR rupees)
 * @property {string} currency
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {object} [metadata]
 *
 * @typedef {object} CreatePaymentResult
 * @property {string} providerPaymentId
 * @property {string} [clientSecret] - Stripe-style
 * @property {string} [orderId] - Razorpay order id
 * @property {string} [keyId] - public key for client
 * @property {object} [raw]
 *
 * @typedef {object} NormalizedWebhookEvent
 * @property {string} providerEventId
 * @property {string} eventType - payment.paid | payment.failed | payment.refunded | …
 * @property {string} [providerPaymentId]
 * @property {number} [amount]
 * @property {string} [currency]
 * @property {object} raw
 */

export const EVENT = {
  PAID: 'payment.paid',
  FAILED: 'payment.failed',
  AUTHORIZED: 'payment.authorized',
  REFUNDED: 'payment.refunded',
  CANCELLED: 'payment.cancelled',
  UNKNOWN: 'payment.unknown',
};
