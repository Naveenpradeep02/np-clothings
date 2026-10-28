import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function calcDiscount(coupon, subtotal) {
  const sub = Number(subtotal);
  if (coupon.min_order_value != null && sub < Number(coupon.min_order_value)) {
    throw new Error('min order');
  }
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (sub * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount != null) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    discount = Number(coupon.discount_value);
  }
  return Math.round(Math.min(discount, sub) * 100) / 100;
}

describe('coupon discount', () => {
  it('applies percentage with max cap', () => {
    const d = calcDiscount(
      { discount_type: 'percentage', discount_value: 20, max_discount: 500 },
      10000
    );
    assert.equal(d, 500);
  });

  it('applies fixed amount', () => {
    assert.equal(calcDiscount({ discount_type: 'fixed', discount_value: 200 }, 1000), 200);
  });

  it('enforces min order', () => {
    assert.throws(() =>
      calcDiscount({ discount_type: 'fixed', discount_value: 100, min_order_value: 500 }, 100)
    );
  });
});
