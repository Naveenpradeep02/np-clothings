import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth, requireEmployee);

router.get('/', requirePermission('roles:manage'), asyncHandler(controller.listRoles));
router.get(
  '/permissions',
  requirePermission('roles:manage'),
  asyncHandler(controller.listPermissions)
);
router.get(
  '/:id/permissions',
  requirePermission('roles:manage'),
  asyncHandler(controller.getRolePermissions)
);

// Allow employees:read to see role list for assignment UI (read-only)
router.get(
  '/directory',
  requirePermission('employees:manage'),
  asyncHandler(controller.listRoles)
);

export default router;
