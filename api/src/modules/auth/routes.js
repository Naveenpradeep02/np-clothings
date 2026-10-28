import { Router } from 'express';
import { noStore } from '../../middleware/cacheControl.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import * as controller from './controller.js';

const router = Router();
router.use(noStore);

// Stricter rate limit on auth endpoints
/**
 * After Firebase client sign-in, exchange ID token for local user record.
 * Authorization: Bearer <Firebase ID token>
 */
router.post('/sync', authRateLimit, asyncHandler(controller.sync));
router.post('/session', authRateLimit, asyncHandler(controller.session));
router.post('/login', authRateLimit, asyncHandler(controller.login));
router.post('/register', authRateLimit, asyncHandler(controller.register));

/**
 * Current authenticated user (requires valid token + active account).
 */
router.get('/me', authRateLimit, requireAuth, asyncHandler(controller.me));

/**
 * Logout — client must discard token; server acknowledges.
 */
router.post('/logout', optionalAuth, asyncHandler(controller.logout));

export default router;
