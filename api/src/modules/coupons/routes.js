import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  optionalAuth,
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Storefront
router.get('/active', asyncHandler(controller.listPublic));
router.post('/validate', optionalAuth, asyncHandler(controller.validate));

// Admin
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('coupons:read'),
  asyncHandler(controller.listAdmin)
);
router.post(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('coupons:write'),
  asyncHandler(controller.create)
);
router.get(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('coupons:read'),
  asyncHandler(controller.get)
);
router.patch(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('coupons:write'),
  asyncHandler(controller.update)
);
router.get(
  '/:id/redemptions',
  requireAuth,
  requireEmployee,
  requirePermission('coupons:read'),
  asyncHandler(controller.redemptions)
);

export default router;
