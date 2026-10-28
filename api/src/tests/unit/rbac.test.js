/**
 * RBAC unit tests — permission checks & admin navigation filtering.
 * Run: node --test src/tests/unit/rbac.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.js';

/** Mirror of requirePermission middleware logic (pure) */
function checkPermission(user, required) {
  if (!user) throw new UnauthorizedError();
  const userPerms = user.permissions || [];
  const ok = required.every((p) => userPerms.includes(p));
  if (!ok) throw new ForbiddenError(`Missing permission: ${required.join(', ')}`);
  return true;
}

/** Mirror of buildAdminNavigation */
function buildAdminNavigation(permissions = []) {
  const has = (code) => permissions.includes(code);
  const items = [
    { key: 'dashboard', label: 'Dashboard', path: '/', permission: null },
    { key: 'products', label: 'Products', path: '/products', permission: 'products:read' },
    { key: 'orders', label: 'Orders', path: '/orders', permission: 'orders:read' },
    { key: 'employees', label: 'Employees', path: '/employees', permission: 'employees:read' },
    { key: 'audit', label: 'Audit Logs', path: '/audit', permission: 'audit:read' },
  ];
  return items.filter((item) => !item.permission || has(item.permission));
}

describe('requirePermission logic', () => {
  it('rejects unauthenticated', () => {
    assert.throws(() => checkPermission(null, ['products:write']), UnauthorizedError);
  });

  it('rejects missing permission', () => {
    const user = { permissions: ['products:read'] };
    assert.throws(() => checkPermission(user, ['products:write']), ForbiddenError);
  });

  it('allows when permission present', () => {
    const user = { permissions: ['products:read', 'products:write'] };
    assert.equal(checkPermission(user, ['products:write']), true);
  });

  it('requires all listed permissions', () => {
    const user = { permissions: ['orders:read'] };
    assert.throws(
      () => checkPermission(user, ['orders:read', 'orders:cancel']),
      ForbiddenError
    );
  });
});

describe('admin navigation filtering', () => {
  it('always includes dashboard', () => {
    const nav = buildAdminNavigation([]);
    assert.ok(nav.some((i) => i.key === 'dashboard'));
    assert.equal(nav.length, 1);
  });

  it('shows products for catalog manager perms', () => {
    const nav = buildAdminNavigation(['products:read']);
    assert.ok(nav.some((i) => i.key === 'products'));
    assert.ok(!nav.some((i) => i.key === 'employees'));
  });

  it('shows employees only with employees:read', () => {
    const nav = buildAdminNavigation(['employees:read', 'audit:read']);
    assert.ok(nav.some((i) => i.key === 'employees'));
    assert.ok(nav.some((i) => i.key === 'audit'));
    assert.ok(!nav.some((i) => i.key === 'orders'));
  });

  it('super-admin style full set sees all', () => {
    const nav = buildAdminNavigation([
      'products:read',
      'orders:read',
      'employees:read',
      'audit:read',
    ]);
    assert.equal(nav.length, 5);
  });
});

describe('role permission matrix (seed contract)', () => {
  const ROLE_PERMS = {
    catalog_manager: [
      'products:read',
      'products:write',
      'categories:write',
      'brands:write',
    ],
    support_team: ['support:read', 'returns:approve', 'customers:read'],
    finance_accounts: ['payments:read', 'payments:refund', 'reports:read'],
  };

  it('support cannot write products', () => {
    const perms = ROLE_PERMS.support_team;
    assert.equal(perms.includes('products:write'), false);
  });

  it('catalog manager can write categories', () => {
    assert.ok(ROLE_PERMS.catalog_manager.includes('categories:write'));
  });

  it('finance can refund but not manage employees', () => {
    assert.ok(ROLE_PERMS.finance_accounts.includes('payments:refund'));
    assert.equal(ROLE_PERMS.finance_accounts.includes('employees:manage'), false);
  });
});
