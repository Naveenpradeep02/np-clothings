import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  optionalAuth,
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';
import { analyticsRateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// Storefront ingestion (optional auth for user linkage)
router.post('/events', analyticsRateLimit, optionalAuth, asyncHandler(controller.track));

// Admin reports
router.get(
  '/overview',
  requireAuth,
  requireEmployee,
  requirePermission('analytics:read'),
  asyncHandler(controller.overview)
);
router.get(
  '/products',
  requireAuth,
  requireEmployee,
  requirePermission('analytics:read'),
  asyncHandler(controller.products)
);
router.get(
  '/searches',
  requireAuth,
  requireEmployee,
  requirePermission('analytics:read'),
  asyncHandler(controller.searches)
);
router.get(
  '/trend',
  requireAuth,
  requireEmployee,
  requirePermission('analytics:read'),
  asyncHandler(controller.trend)
);

export default router;
