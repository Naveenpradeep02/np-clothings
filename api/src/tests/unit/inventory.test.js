/**
 * Inventory availability & guard rules (pure).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function available(quantity, reserved) {
  return quantity - reserved;
}

function canReserve(quantity, reserved, requestQty) {
  return requestQty > 0 && requestQty <= available(quantity, reserved);
}

function canAdjustTo(newQty, reserved) {
  return newQty >= 0 && newQty >= reserved;
}

describe('availability', () => {
  it('computes available', () => {
    assert.equal(available(14, 3), 11);
  });

  it('blocks oversell', () => {
    assert.equal(canReserve(10, 8, 3), false);
    assert.equal(canReserve(10, 8, 2), true);
  });

  it('blocks absolute set below reserved', () => {
    assert.equal(canAdjustTo(5, 7), false);
    assert.equal(canAdjustTo(7, 7), true);
  });

  it('blocks negative quantity', () => {
    assert.equal(canAdjustTo(-1, 0), false);
  });
});
