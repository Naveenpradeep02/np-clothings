/**
 * Domain module registry.
 */

import { createModuleScaffold } from './_scaffold.js';
import catalogRoutes from './catalog/routes.js';
import authRoutes from './auth/routes.js';
import usersRoutes from './users/routes.js';
import employeesRoutes from './employees/routes.js';
import rolesRoutes from './roles/routes.js';
import auditRoutes from './audit/routes.js';
import specificationsRoutes from './specifications/routes.js';
import variantsRoutes from './variants/routes.js';
import productsRoutes from './products/routes.js';
import inventoryRoutes from './inventory/routes.js';
import cmsRoutes from './cms/routes.js';
import storefrontRoutes from './storefront/routes.js';
import cartsRoutes from './carts/routes.js';
import couponsRoutes from './coupons/routes.js';
import ordersRoutes from './orders/routes.js';
import paymentsRoutes from './payments/routes.js';
import notificationsRoutes from './notifications/routes.js';
import shippingRoutes from './shipping/routes.js';
import returnsRoutes from './returns/routes.js';
import supportRoutes from './support/routes.js';
import analyticsRoutes from './analytics/routes.js';
import reviewsRoutes from './reviews/routes.js';
import seoRoutes from './seo/routes.js';
import wishlistRoutes from './wishlist/routes.js';
import uploadsRoutes from './uploads/routes.js';

const MODULES = [
  { path: 'auth', router: authRoutes, description: 'Firebase identity verification & sync' },
  { path: 'users', router: usersRoutes, description: 'Customer profiles & admin CRM' },
  { path: 'employees', router: employeesRoutes, description: 'Employee provisioning & RBAC' },
  { path: 'roles', router: rolesRoutes, description: 'Roles & permissions directory' },
  { path: 'audit', router: auditRoutes, description: 'Administrative audit logs' },
  { path: 'catalog', router: catalogRoutes, description: 'Categories & brands' },
  { path: 'specifications', router: specificationsRoutes, description: 'Spec groups & options' },
  { path: 'products', router: productsRoutes, description: 'Parent products, images, specs' },
  { path: 'variants', router: variantsRoutes, description: 'Sellable variants & option_hash' },
  { path: 'inventory', router: inventoryRoutes, description: 'Stock, ledger, reservations' },
  { path: 'carts', router: cartsRoutes, description: 'Variant-aware carts' },
  { path: 'coupons', router: couponsRoutes, description: 'Coupons & promotions' },
  { path: 'orders', router: ordersRoutes, description: 'Checkout & order history' },
  { path: 'payments', router: paymentsRoutes, description: 'Payments & webhooks' },
  { path: 'shipping', router: shippingRoutes, description: 'Shipments & tracking' },
  { path: 'returns', router: returnsRoutes, description: 'Returns & refunds' },
  { path: 'support', router: supportRoutes, description: 'Support tickets' },
  { path: 'reviews', router: reviewsRoutes, description: 'Ratings, moderation & recommendations' },
  { path: 'cms', router: cmsRoutes, description: 'Homepage CMS' },
  { path: 'storefront', router: storefrontRoutes, description: 'Shop listing, search, facets' },
  { path: 'notifications', router: notificationsRoutes, description: 'SMS & WhatsApp dispatch' },
  { path: 'analytics', router: analyticsRoutes, description: 'Events & product analytics' },
  { path: 'seo', router: seoRoutes, description: 'robots.txt & sitemap.xml' },
  { path: 'wishlist', router: wishlistRoutes, description: 'Customer wishlist' },
  { path: 'uploads', router: uploadsRoutes, description: 'File & image upload service' },
];

export function registerModules(parent) {
  for (const mod of MODULES) {
    parent.use(`/${mod.path}`, mod.router);
  }
}

export function listModules() {
  return MODULES.map(({ path, description }) => ({ path, description }));
}

export default { registerModules, listModules };
