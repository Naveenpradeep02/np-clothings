import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Storefront — resolve combination → variant (price/stock/SKU)
router.post('/resolve', asyncHandler(controller.resolve));
router.post('/preview-hash', asyncHandler(controller.previewHash));

router.get('/product/:productId', asyncHandler(controller.listByProduct));
router.get('/:id', asyncHandler(controller.get));

// Admin
router.post(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.create)
);
router.patch(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.update)
);
router.delete(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.remove)
);

export default router;
