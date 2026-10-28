import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Public-ish stock check for a variant (storefront PDP)
router.get('/variants/:variantId', asyncHandler(controller.get));

// Admin
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('inventory:read'),
  asyncHandler(controller.list)
);
router.get(
  '/low-stock',
  requireAuth,
  requireEmployee,
  requirePermission('inventory:read'),
  asyncHandler(controller.lowStock)
);
router.get(
  '/variants/:variantId/ledger',
  requireAuth,
  requireEmployee,
  requirePermission('inventory:read'),
  asyncHandler(controller.ledger)
);
router.post(
  '/variants/:variantId/adjust',
  requireAuth,
  requireEmployee,
  requirePermission('inventory:adjust'),
  asyncHandler(controller.adjust)
);

// Reservation lifecycle (used by cart/order services; also callable by staff)
router.post(
  '/reserve',
  requireAuth,
  asyncHandler(controller.reserve)
);
router.post(
  '/reservations/:reservationId/release',
  requireAuth,
  asyncHandler(controller.release)
);
router.post(
  '/reservations/:reservationId/consume',
  requireAuth,
  requireEmployee,
  requirePermission('orders:update_status'),
  asyncHandler(controller.consume)
);
router.post(
  '/reservations/expire',
  requireAuth,
  requireEmployee,
  requirePermission('inventory:adjust'),
  asyncHandler(controller.expire)
);

export default router;
