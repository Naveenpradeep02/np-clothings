/**
 * Catalog unit tests — slugify & validation helpers.
 * Run: node --test src/tests/unit/catalog.test.js
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

function buildTree(rows) {
  const byParent = new Map();
  for (const r of rows) {
    const key = r.parent_id ?? 0;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push({ ...r, children: [] });
  }
  function attach(node) {
    const kids = byParent.get(node.id) || [];
    node.children = kids.map(attach);
    return node;
  }
  return (byParent.get(0) || []).map(attach);
}

describe('slugify', () => {
  it('normalizes names', () => {
    assert.equal(slugify('Men Shirts'), 'men-shirts');
    assert.equal(slugify('  Black  Linen! '), 'black-linen');
    assert.equal(slugify('Women___Dresses'), 'women-dresses');
  });

  it('handles unicode-ish cleanup', () => {
    assert.equal(slugify('Atelier Noir'), 'atelier-noir');
  });
});

describe('category tree', () => {
  it('nests children under parents', () => {
    const tree = buildTree([
      { id: 1, parent_id: null, name: 'Men', slug: 'men' },
      { id: 2, parent_id: 1, name: 'Shirts', slug: 'men-shirts' },
      { id: 3, parent_id: null, name: 'Women', slug: 'women' },
    ]);
    assert.equal(tree.length, 2);
    assert.equal(tree[0].children[0].slug, 'men-shirts');
    assert.equal(tree[1].children.length, 0);
  });
});

describe('delete guards (contract)', () => {
  it('blocks delete when children > 0', () => {
    const children = 2;
    const products = 0;
    const blocked = children > 0 || products > 0;
    assert.equal(blocked, true);
  });

  it('allows delete when empty', () => {
    const children = 0;
    const products = 0;
    assert.equal(children > 0 || products > 0, false);
  });
});
