import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.get(
  '/templates',
  requireAuth,
  requireEmployee,
  requirePermission('settings:read'),
  asyncHandler(controller.listTemplates)
);
router.put(
  '/templates',
  requireAuth,
  requireEmployee,
  requirePermission('settings:write'),
  asyncHandler(controller.upsertTemplate)
);
router.post(
  '/templates/seed',
  requireAuth,
  requireEmployee,
  requirePermission('settings:write'),
  asyncHandler(controller.seedTemplates)
);

router.post(
  '/send',
  requireAuth,
  requireEmployee,
  requirePermission('settings:write'),
  asyncHandler(controller.send)
);

router.get(
  '/logs',
  requireAuth,
  requireEmployee,
  requirePermission('settings:read'),
  asyncHandler(controller.listLogs)
);

export default router;
