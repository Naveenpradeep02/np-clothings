/**
 * option_hash — canonical identity of a clothing option combination.
 *
 * Algorithm:
 * 1. Collect specification_option IDs for the variant
 * 2. Sort ascending numerically
 * 3. Join with "|"
 * 4. SHA-256 hex digest (64 chars)
 *
 * Uniqueness is enforced as UNIQUE(product_id, option_hash) in MySQL.
 */

import crypto from 'crypto';

/**
 * @param {number[]|string[]} optionIds
 * @returns {string} 64-char hex SHA-256
 */
export function computeOptionHash(optionIds) {
  if (!Array.isArray(optionIds) || optionIds.length === 0) {
    throw new Error('optionIds must be a non-empty array');
  }
  const sorted = optionIds
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (sorted.length === 0) {
    throw new Error('optionIds must contain valid positive integers');
  }
  // Deduplicate while preserving sorted order
  const unique = [...new Set(sorted)];
  if (unique.length !== sorted.length) {
    // still hash unique set — duplicates would be invalid combinations
  }
  const canonical = unique.join('|');
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Compare two option ID sets (order-independent).
 */
export function sameOptionSet(a, b) {
  return computeOptionHash(a) === computeOptionHash(b);
}

export default { computeOptionHash, sameOptionSet };
