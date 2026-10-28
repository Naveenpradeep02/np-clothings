import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Public product reviews + recommendations
router.get('/product/:productId', asyncHandler(controller.listForProduct));
router.get('/product/:productId/recommendations', asyncHandler(controller.recommendations));

// Customer submit
router.post('/', requireAuth, asyncHandler(controller.create));

// Admin moderation
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('reviews:read'),
  asyncHandler(controller.listAdmin)
);
router.post(
  '/:id/moderate',
  requireAuth,
  requireEmployee,
  requirePermission('reviews:moderate'),
  asyncHandler(controller.moderate)
);

export default router;
