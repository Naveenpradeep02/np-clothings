import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(controller.create));
router.get('/mine', requireAuth, asyncHandler(controller.listMine));

router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('returns:read'),
  asyncHandler(controller.listAdmin)
);

router.get('/:id', requireAuth, asyncHandler(controller.get));

router.post(
  '/:id/status',
  requireAuth,
  requireEmployee,
  requirePermission('returns:approve'),
  asyncHandler(controller.transition)
);

router.post(
  '/:id/refund',
  requireAuth,
  requireEmployee,
  requirePermission('payments:refund'),
  asyncHandler(controller.refund)
);

export default router;
