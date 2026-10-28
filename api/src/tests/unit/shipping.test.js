import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProviderStatus, SHIPMENT_STATUS } from '../../services/shipping/types.js';
import { MockShippingProvider } from '../../services/shipping/MockShippingProvider.js';

describe('normalizeProviderStatus', () => {
  it('maps delivered', () => {
    assert.equal(normalizeProviderStatus('Delivered'), SHIPMENT_STATUS.DELIVERED);
  });
  it('maps out for delivery', () => {
    assert.equal(normalizeProviderStatus('out for delivery'), SHIPMENT_STATUS.OUT_FOR_DELIVERY);
  });
  it('maps in transit', () => {
    assert.equal(normalizeProviderStatus('InTransit'), SHIPMENT_STATUS.IN_TRANSIT);
  });
  it('maps exception', () => {
    assert.equal(normalizeProviderStatus('exception_delay'), SHIPMENT_STATUS.EXCEPTION);
  });
});

describe('MockShippingProvider', () => {
  const p = new MockShippingProvider();

  it('creates shipment', async () => {
    const r = await p.createShipment({ orderNumber: 'AU-1', courierCode: 'mock' });
    assert.ok(r.providerShipmentId.startsWith('mock_shp_'));
    assert.equal(r.status, SHIPMENT_STATUS.LABEL_CREATED);
  });

  it('returns tracking events', async () => {
    const t = await p.getTracking('TEST123');
    assert.ok(t.events.length >= 1);
    assert.ok(t.status);
  });
});
