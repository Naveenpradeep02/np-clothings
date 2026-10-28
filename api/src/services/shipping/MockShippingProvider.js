/**
 * Dev shipping provider — no external API.
 */
import crypto from 'crypto';
import { SHIPMENT_STATUS, normalizeProviderStatus } from './types.js';

export class MockShippingProvider {
  constructor() {
    this.name = 'mock';
  }

  async createShipment({ trackingNumber, courierCode, orderNumber }) {
    const id = `mock_shp_${crypto.randomBytes(6).toString('hex')}`;
    return {
      providerShipmentId: id,
      trackingNumber: trackingNumber || `MOCK${Date.now().toString(36).toUpperCase()}`,
      trackingUrl: `https://track.example.com/${trackingNumber || id}`,
      status: SHIPMENT_STATUS.LABEL_CREATED,
      raw: { mock: true, orderNumber, courierCode },
    };
  }

  async getTracking(trackingNumber) {
    // Simulate progressive status from hash of tracking number
    const n = [...String(trackingNumber)].reduce((a, c) => a + c.charCodeAt(0), 0);
    const statuses = [
      SHIPMENT_STATUS.LABEL_CREATED,
      SHIPMENT_STATUS.PICKED_UP,
      SHIPMENT_STATUS.IN_TRANSIT,
      SHIPMENT_STATUS.OUT_FOR_DELIVERY,
      SHIPMENT_STATUS.DELIVERED,
    ];
    const idx = Math.min(statuses.length - 1, n % statuses.length);
    const events = statuses.slice(0, idx + 1).map((status, i) => ({
      status,
      description: `Mock event: ${status}`,
      location: i === 0 ? 'Origin facility' : i === idx ? 'Local hub' : 'Transit hub',
      eventTime: new Date(Date.now() - (idx - i) * 3600_000).toISOString(),
      providerEventId: `mock_${trackingNumber}_${status}`,
    }));
    return {
      trackingNumber,
      status: statuses[idx],
      events,
      raw: { mock: true },
    };
  }

  verifyWebhookSignature(_rawBody, signature) {
    return signature === 'valid' || !signature;
  }

  parseWebhook(payload) {
    const trackingNumber = payload.tracking_number || payload.trackingNumber;
    const status = normalizeProviderStatus(payload.status || payload.event);
    return {
      providerEventId: String(payload.id || payload.event_id || `${trackingNumber}_${status}_${Date.now()}`),
      trackingNumber,
      status,
      description: payload.description || payload.message || status,
      location: payload.location || null,
      eventTime: payload.event_time || payload.timestamp || new Date().toISOString(),
      raw: payload,
    };
  }
}

export default MockShippingProvider;
