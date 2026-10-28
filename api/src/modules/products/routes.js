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

// Storefront
router.get('/', optionalAuth, asyncHandler(controller.list));
router.get('/:idOrSlug', optionalAuth, asyncHandler(controller.get));

// Admin CRUD
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
router.post(
  '/:id/publish',
  requireAuth,
  requireEmployee,
  requirePermission('products:publish'),
  asyncHandler(controller.publish)
);
router.delete(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('products:delete'),
  asyncHandler(controller.remove)
);

// Images
router.post(
  '/:id/images',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.addImage)
);
router.delete(
  '/:id/images/:imageId',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.removeImage)
);
router.patch(
  '/:id/images/:imageId',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.updateImage)
);


// Spec assignment
router.put(
  '/:id/specification-groups',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.assignGroups)
);
router.put(
  '/:id/specification-options',
  requireAuth,
  requireEmployee,
  requirePermission('products:write'),
  asyncHandler(controller.assignOptions)
);

export default router;
