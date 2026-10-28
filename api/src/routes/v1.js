/**
 * API v1 router — versioned entrypoint.
 */

import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { success } from '../lib/response.js';
import { registerModules, listModules } from '../modules/index.js';
import { rateLimit } from '../middleware/rateLimit.js';
import config from '../config/index.js';

const router = Router();

// Baseline rate limit for all v1 routes
router.use(rateLimit());

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    return success(res, {
      name: 'AUREA Commerce API',
      version: 'v1',
      status: 'foundation',
      modules: listModules(),
      message: 'Modular foundation ready. Business logic added in later phases.',
    });
  })
);

router.get(
  '/config/public',
  asyncHandler(async (_req, res) => {
    return success(res, {
      appName: 'AUREA',
      currency: 'INR',
      customerWebUrl: config.customerWebUrl,
      adminWebUrl: config.adminWebUrl,
      paymentPublicKey: config.payment.publicKey || null,
      firebaseConfigured: config.firebase.configured,
    });
  })
);

registerModules(router);

export default router;
