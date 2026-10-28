import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(controller.getOrCreate));
router.get('/:id', optionalAuth, asyncHandler(controller.get));
router.post('/items', optionalAuth, asyncHandler(controller.addItem));
router.patch('/items/:itemId', optionalAuth, asyncHandler(controller.updateItem));
router.delete('/items/:itemId', optionalAuth, asyncHandler(controller.removeItem));

export default router;
