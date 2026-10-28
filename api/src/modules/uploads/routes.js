import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { optionalAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Image upload endpoint
router.post('/', optionalAuth, asyncHandler(controller.uploadImage));

export default router;
