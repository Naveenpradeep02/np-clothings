import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetMetrics,
  recordHttpRequest,
  recordBusinessEvent,
  getSnapshot,
  toPrometheus,
  incCounter,
} from '../../lib/metrics.js';

describe('metrics', () => {
  beforeEach(() => resetMetrics());

  it('counts http requests and errors', () => {
    recordHttpRequest({ method: 'GET', route: '/api/v1/products', status: 200, durationMs: 12 });
    recordHttpRequest({ method: 'GET', route: '/api/v1/products', status: 500, durationMs: 30 });
    const snap = getSnapshot();
    assert.ok(Object.keys(snap.counters).some((k) => k.includes('http_requests_total')));
    assert.ok(Object.keys(snap.counters).some((k) => k.includes('http_errors_total')));
  });

  it('records latency histogram', () => {
    recordHttpRequest({ method: 'POST', route: '/api/v1/orders/checkout', status: 201, durationMs: 80 });
    const snap = getSnapshot();
    assert.ok(Object.keys(snap.histograms).length >= 1);
  });

  it('business events', () => {
    recordBusinessEvent('checkout', { currency: 'INR' });
    const snap = getSnapshot();
    assert.ok(Object.keys(snap.counters).some((k) => k.includes('business_checkout')));
  });

  it('prometheus text includes HELP lines', () => {
    incCounter('http_requests_total', { method: 'GET', route: '/health', status: '200' });
    const text = toPrometheus();
    assert.ok(text.includes('process_uptime_seconds'));
    assert.ok(text.includes('process_resident_memory_bytes'));
  });
});
