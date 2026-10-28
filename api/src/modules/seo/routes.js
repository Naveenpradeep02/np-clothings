import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { publicCache } from '../../middleware/cacheControl.js';
import * as controller from './controller.js';

const router = Router();

router.get('/robots.txt', publicCache(3600), asyncHandler(controller.robots));
router.get('/sitemap.xml', publicCache(600), asyncHandler(controller.sitemap));

export default router;
