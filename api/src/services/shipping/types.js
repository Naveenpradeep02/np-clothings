/**
 * Normalized shipment statuses (internal).
 */
export const SHIPMENT_STATUS = {
  LABEL_CREATED: 'label_created',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception',
  RETURNED_TO_SENDER: 'returned_to_sender',
};

export const ALL_STATUSES = Object.values(SHIPMENT_STATUS);

/**
 * Map common carrier / aggregator status strings → internal.
 */
export function normalizeProviderStatus(raw) {
  const s = String(raw || '').toLowerCase().replace(/[\s-]+/g, '_');
  // Order matters: more specific patterns before generic "deliver"
  if (/out_for_delivery|ofd|outfordelivery/.test(s)) return SHIPMENT_STATUS.OUT_FOR_DELIVERY;
  if (/return|rts/.test(s)) return SHIPMENT_STATUS.RETURNED_TO_SENDER;
  if (/exception|fail|delay|hold|lost|damage|undeliver/.test(s)) return SHIPMENT_STATUS.EXCEPTION;
  if (/^delivered$|delivered|delivery_success/.test(s) && !/out_for/.test(s)) return SHIPMENT_STATUS.DELIVERED;
  if (/in_transit|transit|intransit|departed|arrived|hub/.test(s)) return SHIPMENT_STATUS.IN_TRANSIT;
  if (/pick|collected|picked/.test(s)) return SHIPMENT_STATUS.PICKED_UP;
  if (/label|info_received|pending|created|booked/.test(s)) return SHIPMENT_STATUS.LABEL_CREATED;
  return SHIPMENT_STATUS.IN_TRANSIT;
}

export default { SHIPMENT_STATUS, ALL_STATUSES, normalizeProviderStatus };
