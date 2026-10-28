/**
 * Allowed order status transitions.
 * Arbitrary jumps are rejected unless listed here.
 */

export const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['return_approved', 'cancelled'], // cancelled = return rejected path simplified
  return_approved: ['return_received'],
  return_received: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function canTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function nextStatuses(from) {
  return ALLOWED_TRANSITIONS[from] || [];
}

export default { ALLOWED_TRANSITIONS, canTransition, nextStatuses };
