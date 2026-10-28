/**
 * Unit tests for pagination helpers.
 * Run with: node --test src/tests/unit/pagination.test.js
 * (Node 18+ built-in test runner)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';
import { BadRequestError } from '../../lib/errors.js';

describe('parsePagination', () => {
  it('defaults page=1 limit=20', () => {
    const p = parsePagination({});
    assert.equal(p.page, 1);
    assert.equal(p.limit, 20);
    assert.equal(p.offset, 0);
  });

  it('computes offset', () => {
    const p = parsePagination({ page: 3, limit: 10 });
    assert.equal(p.offset, 20);
  });

  it('caps limit at 100', () => {
    const p = parsePagination({ limit: 500 });
    assert.equal(p.limit, 100);
  });

  it('rejects invalid page', () => {
    assert.throws(() => parsePagination({ page: 0 }), BadRequestError);
  });
});

describe('paginationMeta', () => {
  it('reports hasNext/hasPrev', () => {
    const m = paginationMeta({ page: 2, limit: 10, total: 25 });
    assert.equal(m.totalPages, 3);
    assert.equal(m.hasNext, true);
    assert.equal(m.hasPrev, true);
  });
});
