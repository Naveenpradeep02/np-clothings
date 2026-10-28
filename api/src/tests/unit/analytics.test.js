import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 64);
}

function conversionRate(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

describe('analytics helpers', () => {
  it('hashes IP consistently', () => {
    const a = hashIp('1.2.3.4');
    const b = hashIp('1.2.3.4');
    assert.equal(a, b);
    assert.equal(a.length, 64);
    assert.notEqual(a, '1.2.3.4');
  });

  it('computes conversion rates', () => {
    assert.equal(conversionRate(15, 100), 15);
    assert.equal(conversionRate(0, 100), 0);
    assert.equal(conversionRate(5, 0), 0);
  });
});
