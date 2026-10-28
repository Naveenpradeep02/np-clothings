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

// ----- Public / storefront reads -----
router.get('/categories/tree', asyncHandler(controller.getCategoryTree));
router.get('/categories', optionalAuth, asyncHandler(controller.listCategories));
router.get('/categories/:id', asyncHandler(controller.getCategory));
router.get('/brands', optionalAuth, asyncHandler(controller.listBrands));
router.get('/brands/:id', asyncHandler(controller.getBrand));

// ----- Admin writes (employee + permission) -----
router.post(
  '/categories',
  requireAuth,
  requireEmployee,
  requirePermission('categories:write'),
  asyncHandler(controller.createCategory)
);
router.patch(
  '/categories/:id',
  requireAuth,
  requireEmployee,
  requirePermission('categories:write'),
  asyncHandler(controller.updateCategory)
);
router.delete(
  '/categories/:id',
  requireAuth,
  requireEmployee,
  requirePermission('categories:write'),
  asyncHandler(controller.deleteCategory)
);

router.post(
  '/brands',
  requireAuth,
  requireEmployee,
  requirePermission('brands:write'),
  asyncHandler(controller.createBrand)
);
router.patch(
  '/brands/:id',
  requireAuth,
  requireEmployee,
  requirePermission('brands:write'),
  asyncHandler(controller.updateBrand)
);
router.delete(
  '/brands/:id',
  requireAuth,
  requireEmployee,
  requirePermission('brands:write'),
  asyncHandler(controller.deleteBrand)
);

export default router;
