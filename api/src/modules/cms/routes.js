import { Router } from 'express';
import { publicCache } from '../../middleware/cacheControl.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Public
router.get('/pages/home', publicCache(60), asyncHandler(controller.getHome));
router.get('/pages/:page', publicCache(60), asyncHandler(controller.getHome));

// Admin
router.get(
  '/admin/sections',
  requireAuth,
  requireEmployee,
  requirePermission('cms:read'),
  asyncHandler(controller.listAdmin)
);
router.get(
  '/admin/sections/:id',
  requireAuth,
  requireEmployee,
  requirePermission('cms:read'),
  asyncHandler(controller.getSection)
);
router.post(
  '/admin/sections',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.createSection)
);
router.patch(
  '/admin/sections/:id',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.updateSection)
);
router.delete(
  '/admin/sections/:id',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.deleteSection)
);
router.post(
  '/admin/reorder',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.reorder)
);
router.post(
  '/admin/sections/:id/banners',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.addBanner)
);
router.patch(
  '/admin/sections/:id/banners/:bannerId',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.updateBanner)
);
router.delete(
  '/admin/sections/:id/banners/:bannerId',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.deleteBanner)
);
router.put(
  '/admin/sections/:id/products',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.setProducts)
);
router.post(
  '/admin/seed-home',
  requireAuth,
  requireEmployee,
  requirePermission('cms:write'),
  asyncHandler(controller.seedHome)
);

export default router;
