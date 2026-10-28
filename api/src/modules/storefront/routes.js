import { Router } from 'express';
import { publicCache } from '../../middleware/cacheControl.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { optionalAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.get('/products', publicCache(30), optionalAuth, asyncHandler(controller.listProducts));
router.get('/facets', publicCache(60), asyncHandler(controller.facets));

export default router;
