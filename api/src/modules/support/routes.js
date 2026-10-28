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
  requirePermission('support:read'),
  asyncHandler(controller.listAdmin)
);

router.get('/:id', requireAuth, asyncHandler(controller.get));
router.post('/:id/messages', requireAuth, asyncHandler(controller.reply));

router.patch(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('support:write'),
  asyncHandler(controller.update)
);

export default router;
