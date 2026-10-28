import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function applyPriceFilter(items, minPrice, maxPrice) {
  let out = items;
  if (minPrice != null) out = out.filter((i) => i.min_price != null && i.min_price >= minPrice);
  if (maxPrice != null) out = out.filter((i) => i.min_price != null && i.min_price <= maxPrice);
  return out;
}

function sortItems(items, sort) {
  const copy = [...items];
  if (sort === 'price_asc') copy.sort((a, b) => (a.min_price || 0) - (b.min_price || 0));
  if (sort === 'price_desc') copy.sort((a, b) => (b.min_price || 0) - (a.min_price || 0));
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

describe('storefront filters', () => {
  const sample = [
    { name: 'B Shirt', min_price: 3000 },
    { name: 'A Coat', min_price: 8000 },
    { name: 'C Tee', min_price: 1500 },
  ];

  it('filters by price range', () => {
    assert.equal(applyPriceFilter(sample, 2000, 5000).length, 1);
  });

  it('sorts by price ascending', () => {
    assert.equal(sortItems(sample, 'price_asc')[0].name, 'C Tee');
  });

  it('sorts by name', () => {
    assert.equal(sortItems(sample, 'name')[0].name, 'A Coat');
  });
});
