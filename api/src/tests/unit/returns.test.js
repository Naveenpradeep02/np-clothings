import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransition,
  nextStatuses,
  ELIGIBLE_REASONS,
} from '../../modules/returns/transitions.js';

describe('return transitions', () => {
  it('allows requested → under_review', () => {
    assert.equal(canTransition('requested', 'under_review'), true);
  });
  it('blocks requested → refunded', () => {
    assert.equal(canTransition('requested', 'refunded'), false);
  });
  it('has eligible reasons', () => {
    assert.ok(ELIGIBLE_REASONS.includes('size_issue'));
  });
  it('closed is terminal', () => {
    assert.deepEqual(nextStatuses('closed'), []);
  });
});
