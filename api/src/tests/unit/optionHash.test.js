/**
 * option_hash unit tests
 * Run: node --test src/tests/unit/optionHash.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOptionHash, sameOptionSet } from '../../lib/optionHash.js';

describe('computeOptionHash', () => {
  it('is order-independent', () => {
    const a = computeOptionHash([3, 1, 2]);
    const b = computeOptionHash([1, 2, 3]);
    const c = computeOptionHash([2, 3, 1]);
    assert.equal(a, b);
    assert.equal(b, c);
    assert.equal(a.length, 64);
  });

  it('deduplicates IDs', () => {
    const a = computeOptionHash([1, 2, 2, 3]);
    const b = computeOptionHash([1, 2, 3]);
    assert.equal(a, b);
  });

  it('differs for different sets', () => {
    const a = computeOptionHash([1, 2, 3]);
    const b = computeOptionHash([1, 2, 4]);
    assert.notEqual(a, b);
  });

  it('rejects empty', () => {
    assert.throws(() => computeOptionHash([]));
    assert.throws(() => computeOptionHash(null));
  });

  it('sameOptionSet helper', () => {
    assert.equal(sameOptionSet([5, 2], [2, 5]), true);
    assert.equal(sameOptionSet([5, 2], [2, 6]), false);
  });
});
