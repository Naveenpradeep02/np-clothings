import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function average(ratings) {
  if (!ratings.length) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

function validRating(r) {
  return Number.isInteger(r) && r >= 1 && r <= 5;
}

describe('review helpers', () => {
  it('averages ratings', () => {
    assert.equal(average([5, 4, 5]), 4.7);
    assert.equal(average([]), 0);
  });

  it('validates rating range', () => {
    assert.equal(validRating(5), true);
    assert.equal(validRating(0), false);
    assert.equal(validRating(3.5), false);
  });
});
