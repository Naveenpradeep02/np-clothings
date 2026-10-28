import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
  optionalAuth,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Public tracking page
router.get('/track/:trackingNumber', asyncHandler(controller.byTracking));

// Provider webhook (no user auth)
router.post('/webhooks', asyncHandler(controller.webhook));
router.post('/webhooks/:provider', asyncHandler(controller.webhook));

// Customer / staff: shipments for an order
router.get('/order/:orderId', optionalAuth, asyncHandler(controller.byOrder));

// Admin
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('shipping:read'),
  asyncHandler(controller.list)
);
router.post(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('shipping:write'),
  asyncHandler(controller.create)
);
router.get(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('shipping:read'),
  asyncHandler(controller.get)
);
router.post(
  '/:id/events',
  requireAuth,
  requireEmployee,
  requirePermission('shipping:write'),
  asyncHandler(controller.addEvent)
);
router.post(
  '/:id/sync',
  requireAuth,
  requireEmployee,
  requirePermission('shipping:write'),
  asyncHandler(controller.sync)
);

export default router;
