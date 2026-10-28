import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Public reads — storefront needs groups/options to render selectors
router.get('/groups', asyncHandler(controller.listGroups));
router.get('/groups/:id', asyncHandler(controller.getGroup));
router.get('/options', asyncHandler(controller.listOptions));

// Admin writes
router.post(
  '/groups',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.createGroup)
);
router.patch(
  '/groups/:id',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.updateGroup)
);
router.post(
  '/options',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.createOption)
);
router.patch(
  '/options/:id',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.updateOption)
);

// Category-Level Specification Templates / Variant Sets
router.get(
  '/categories/:categoryId',
  asyncHandler(controller.getCategorySpecifications)
);
router.post(
  '/categories/:categoryId',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.saveCategorySpecifications)
);
router.post(
  '/categories/:categoryId/preset',
  requireAuth,
  requireEmployee,
  requirePermission('specifications:write'),
  asyncHandler(controller.presetCategorySpecifications)
);

export default router;
