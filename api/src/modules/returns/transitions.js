/** Allowed return_request status transitions */
export const RETURN_TRANSITIONS = {
  requested: ['under_review', 'rejected', 'closed'],
  under_review: ['approved', 'rejected'],
  approved: ['pickup_scheduled', 'received', 'closed'],
  rejected: ['closed'],
  pickup_scheduled: ['received', 'closed'],
  received: ['inspected', 'closed'],
  inspected: ['refund_pending', 'closed'],
  refund_pending: ['refunded', 'closed'],
  refunded: ['closed'],
  closed: [],
};

export const ELIGIBLE_REASONS = ['size_issue', 'open_box_damage', 'other'];

/** Default return window in days (override via settings later) */
export const DEFAULT_RETURN_WINDOW_DAYS = 14;

export function canTransition(from, to) {
  return (RETURN_TRANSITIONS[from] || []).includes(to);
}

export function nextStatuses(from) {
  return RETURN_TRANSITIONS[from] || [];
}

export default {
  RETURN_TRANSITIONS,
  ELIGIBLE_REASONS,
  DEFAULT_RETURN_WINDOW_DAYS,
  canTransition,
  nextStatuses,
};
