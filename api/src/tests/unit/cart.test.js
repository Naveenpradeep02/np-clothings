import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function totals(subtotal, discount, taxRate = 0.18, freeAbove = 3000, shipFee = 99) {
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const shipping = taxable >= freeAbove || taxable === 0 ? 0 : shipFee;
  const grand = Math.round((subtotal - discount + tax + shipping) * 100) / 100;
  return { tax, shipping, grand };
}

describe('cart totals', () => {
  it('applies free shipping above threshold', () => {
    const t = totals(5000, 0);
    assert.equal(t.shipping, 0);
  });

  it('charges shipping below threshold', () => {
    const t = totals(1000, 0);
    assert.equal(t.shipping, 99);
  });

  it('taxes after discount', () => {
    const t = totals(2000, 200);
    assert.equal(t.tax, 324);
  });
});
