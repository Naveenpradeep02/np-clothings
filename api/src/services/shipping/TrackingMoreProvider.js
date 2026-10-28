/**
 * TrackingMore-style adapter skeleton.
 * Requires SHIPPING_API_KEY. Falls back behaviour documented in service.
 */

import { normalizeProviderStatus, SHIPMENT_STATUS } from './types.js';

export class TrackingMoreProvider {
  constructor() {
    this.name = 'trackingmore';
    this.apiKey = process.env.SHIPPING_API_KEY || '';
    this.baseUrl = process.env.SHIPPING_API_BASE || 'https://api.trackingmore.com/v4';
  }

  async createShipment({ trackingNumber, courierCode }) {
    if (!this.apiKey) {
      const err = new Error('TrackingMore not configured (SHIPPING_API_KEY)');
      err.code = 'SHIPPING_PROVIDER_UNCONFIGURED';
      err.status = 503;
      throw err;
    }
    const res = await fetch(`${this.baseUrl}/trackings/create`, {
      method: 'POST',
      headers: {
        'Tracking-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        carrier_code: courierCode,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.meta?.message || 'TrackingMore create failed');
      err.status = 502;
      err.code = 'SHIPPING_PROVIDER_ERROR';
      throw err;
    }
    return {
      providerShipmentId: data?.data?.id || trackingNumber,
      trackingNumber,
      trackingUrl: data?.data?.tracking_url || null,
      status: SHIPMENT_STATUS.LABEL_CREATED,
      raw: data,
    };
  }

  async getTracking(trackingNumber) {
    if (!this.apiKey) {
      const err = new Error('TrackingMore not configured');
      err.code = 'SHIPPING_PROVIDER_UNCONFIGURED';
      err.status = 503;
      throw err;
    }
    const res = await fetch(
      `${this.baseUrl}/trackings/get?tracking_numbers=${encodeURIComponent(trackingNumber)}`,
      { headers: { 'Tracking-Api-Key': this.apiKey } }
    );
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.meta?.message || 'TrackingMore get failed');
      err.status = 502;
      throw err;
    }
    const item = data?.data?.[0] || data?.data || {};
    const originEvents = item.origin_info?.trackinfo || item.trackinfo || [];
    const events = originEvents.map((e, i) => ({
      status: normalizeProviderStatus(e.checkpoint_status || e.Status || e.status),
      description: e.tracking_detail || e.StatusDescription || e.details || '',
      location: e.location || e.Location || null,
      eventTime: e.checkpoint_date || e.Date || e.datetime || new Date().toISOString(),
      providerEventId: e.checkpoint_id || `${trackingNumber}_${i}_${e.checkpoint_date || i}`,
    }));
    return {
      trackingNumber,
      status: normalizeProviderStatus(item.delivery_status || item.status || events.at(-1)?.status),
      events,
      raw: data,
    };
  }

  verifyWebhookSignature(_rawBody, signature, secret) {
    if (!secret) return true;
    return signature === secret;
  }

  parseWebhook(payload) {
    const data = payload.data || payload;
    const trackingNumber = data.tracking_number || data.trackingNumber;
    const status = normalizeProviderStatus(data.delivery_status || data.status);
    return {
      providerEventId: String(payload.id || data.id || `${trackingNumber}_${status}_${Date.now()}`),
      trackingNumber,
      status,
      description: data.lastEvent || data.description || status,
      location: data.location || null,
      eventTime: data.checkpoint_date || data.updated_at || new Date().toISOString(),
      raw: payload,
    };
  }
}

export default TrackingMoreProvider;
