/**
 * Factory for domain module placeholders.
 * Each module exposes list/get stubs until business logic is implemented.
 */

import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { success } from '../lib/response.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';

/**
 * @param {string} name - module name (e.g. "products")
 * @param {object} [opts]
 * @param {string[]} [opts.extraRoutes] - additional path labels for documentation
 */
export function createModuleScaffold(name, opts = {}) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { page, limit } = parsePagination(req.query);
      return success(
        res,
        [],
        {
          ...paginationMeta({ page, limit, total: 0 }),
          module: name,
          status: 'scaffold',
          message: `${name} list endpoint — implement in a later phase`,
        }
      );
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      return success(res, {
        id: req.params.id,
        module: name,
        status: 'scaffold',
        message: `${name} detail endpoint — implement in a later phase`,
      });
    })
  );

  return {
    name,
    router,
    extraRoutes: opts.extraRoutes || [],
  };
}
