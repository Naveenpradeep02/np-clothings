import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function allRequiredSelected(groups, selected) {
  return groups.every((g) => {
    if (g.is_required === false) return true;
    return selected[g.id] != null;
  });
}

function optionIdsFromSelection(selected) {
  return Object.values(selected).filter(Boolean);
}

describe('PDP selection', () => {
  const groups = [
    { id: 1, is_required: true },
    { id: 2, is_required: true },
    { id: 3, is_required: false },
  ];

  it('requires required groups', () => {
    assert.equal(allRequiredSelected(groups, { 1: 10 }), false);
    assert.equal(allRequiredSelected(groups, { 1: 10, 2: 20 }), true);
  });

  it('collects option ids', () => {
    assert.deepEqual(optionIdsFromSelection({ 1: 10, 2: 20 }).sort(), [10, 20]);
  });
});
