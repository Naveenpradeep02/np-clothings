import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, nextStatuses } from '../../modules/orders/transitions.js';

describe('order transitions', () => {
  it('allows pending → confirmed', () => {
    assert.equal(canTransition('pending', 'confirmed'), true);
  });

  it('blocks pending → delivered', () => {
    assert.equal(canTransition('pending', 'delivered'), false);
  });

  it('allows shipped → delivered only', () => {
    assert.deepEqual(nextStatuses('shipped'), ['delivered']);
  });

  it('terminal cancelled', () => {
    assert.deepEqual(nextStatuses('cancelled'), []);
  });
});
