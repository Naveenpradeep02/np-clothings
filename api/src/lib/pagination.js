/**
 * Pagination helpers for list endpoints.
 */

import { BadRequestError } from './errors.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse page/limit from query string.
 * @param {Record<string, unknown>} query
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query = {}) {
  let page = Number(query.page ?? DEFAULT_PAGE);
  let limit = Number(query.limit ?? DEFAULT_LIMIT);

  if (!Number.isFinite(page) || page < 1) {
    throw new BadRequestError('page must be a positive integer');
  }
  if (!Number.isFinite(limit) || limit < 1) {
    throw new BadRequestError('limit must be a positive integer');
  }
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build meta object for list responses.
 */
export function paginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
