import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(controller.list));
router.post('/', requireAuth, asyncHandler(controller.add));
router.delete('/:id', requireAuth, asyncHandler(controller.remove));

export default router;
