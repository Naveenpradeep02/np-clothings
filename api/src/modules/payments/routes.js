import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';
import { paymentRateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// Webhooks — no user auth; signature verified inside
router.post('/webhooks/:provider', paymentRateLimit, asyncHandler(controller.webhook));
router.post('/webhooks', paymentRateLimit, asyncHandler(controller.webhook));

router.post('/intents', paymentRateLimit, requireAuth, asyncHandler(controller.createIntent));
router.get('/:id', requireAuth, asyncHandler(controller.get));

// Dev only — confirm mock payment
router.post('/:id/mock-confirm', requireAuth, asyncHandler(controller.mockConfirm));

export default router;
