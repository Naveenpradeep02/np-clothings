import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  requireAuth,
  requireEmployee,
  requirePermission,
} from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

// Customer self-service
router.get('/me', requireAuth, asyncHandler(controller.me));
router.patch('/me', requireAuth, asyncHandler(controller.updateMe));
router.get('/me/addresses', requireAuth, asyncHandler(controller.listAddresses));
router.post('/me/addresses', requireAuth, asyncHandler(controller.createAddress));
router.patch('/me/addresses/:addressId', requireAuth, asyncHandler(controller.updateAddress));
router.delete('/me/addresses/:addressId', requireAuth, asyncHandler(controller.deleteAddress));

// Admin customer management
router.get(
  '/',
  requireAuth,
  requireEmployee,
  requirePermission('customers:read'),
  asyncHandler(controller.listCustomers)
);
router.get(
  '/:id',
  requireAuth,
  requireEmployee,
  requirePermission('customers:read'),
  asyncHandler(controller.getCustomer)
);
router.get(
  '/:id/orders',
  requireAuth,
  requireEmployee,
  requirePermission('customers:read'),
  asyncHandler(controller.customerOrders)
);
router.patch(
  '/:id/status',
  requireAuth,
  requireEmployee,
  requirePermission('customers:read'), // tight: often only super_admin has write; use read+policy
  asyncHandler(controller.updateStatus)
);

export default router;
