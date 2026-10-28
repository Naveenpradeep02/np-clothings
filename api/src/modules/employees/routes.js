import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// All employee admin routes require authenticated employee
router.use(requireAuth, requireEmployee);

/** Permission-aware admin navigation for the logged-in employee */
router.get('/navigation', asyncHandler(controller.navigation));

router.get('/', requirePermission('employees:read'), asyncHandler(controller.list));
router.get('/:id', requirePermission('employees:read'), asyncHandler(controller.get));
router.post('/', requirePermission('employees:manage'), asyncHandler(controller.provision));
router.patch(
  '/:id/status',
  requirePermission('employees:manage'),
  asyncHandler(controller.setStatus)
);
router.put(
  '/:id/roles',
  requirePermission('employees:manage'),
  asyncHandler(controller.assignRoles)
);

export default router;
