import { Router } from 'express';
import { checkoutRateLimit } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Customer
router.post('/checkout', requireAuth, checkoutRateLimit, asyncHandler(controller.checkout));
router.get('/mine', requireAuth, asyncHandler(controller.listMine));

// Admin list (before /:id)
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('orders:read'),
  asyncHandler(controller.listAdmin)
);

router.get('/:id', requireAuth, asyncHandler(controller.get));
router.get('/:id/invoice', requireAuth, asyncHandler(controller.invoice));

router.post(
  '/:id/status',
  requireAuth,
  requireEmployee,
  requirePermission('orders:update_status'),
  asyncHandler(controller.transition)
);

export default router;
