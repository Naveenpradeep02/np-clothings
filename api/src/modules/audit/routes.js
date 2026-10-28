import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import { listAuditLogs } from './service.js';
import { success } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

const router = Router();

router.use(requireAuth, requireEmployee, requirePermission('audit:read'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { rows, total } = await listAuditLogs({
      ...pagination,
      actorId: req.query.actor_id ? Number(req.query.actor_id) : undefined,
      entityType: req.query.entity_type,
      action: req.query.action,
    });
    return success(res, rows, paginationMeta({ ...pagination, total }));
  })
);

export default router;
