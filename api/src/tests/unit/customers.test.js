import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const CUSTOMER_STATUSES = ['active', 'inactive', 'suspended'];

describe('customer status', () => {
  it('allows valid statuses', () => {
    assert.ok(CUSTOMER_STATUSES.includes('active'));
    assert.ok(CUSTOMER_STATUSES.includes('suspended'));
  });

  it('rejects deleted as staff toggle', () => {
    assert.equal(CUSTOMER_STATUSES.includes('deleted'), false);
  });
});
