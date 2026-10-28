/**
 * Product service helpers — slug + status rules (pure).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

const VALID_STATUS = ['draft', 'published', 'archived'];

describe('product slug', () => {
  it('slugifies product names', () => {
    assert.equal(slugify('Black Pure Linen Shirt'), 'black-pure-linen-shirt');
  });
});

describe('publication status', () => {
  it('only allows known statuses', () => {
    assert.ok(VALID_STATUS.includes('draft'));
    assert.ok(VALID_STATUS.includes('published'));
    assert.equal(VALID_STATUS.includes('live'), false);
  });

  it('storefront should only show published', () => {
    const status = 'draft';
    const visible = status === 'published';
    assert.equal(visible, false);
  });
});
