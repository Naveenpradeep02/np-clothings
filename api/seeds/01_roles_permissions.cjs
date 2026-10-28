/**
 * Roles + permissions seed (idempotent via upsert patterns)
 */

const ROLES = [
  { code: 'super_admin', name: 'Super Admin', description: 'Full system access', is_system: true },
  { code: 'catalog_manager', name: 'Catalog Manager', description: 'Products, categories, brands, specs' },
  { code: 'order_manager', name: 'Order Manager', description: 'Orders, fulfillment, shipping' },
  { code: 'inventory_manager', name: 'Inventory Manager', description: 'Stock and adjustments' },
  { code: 'support_team', name: 'Support Team', description: 'Tickets and returns' },
  { code: 'marketing_manager', name: 'Marketing Manager', description: 'CMS, coupons, analytics' },
  { code: 'finance_accounts', name: 'Finance / Accounts', description: 'Payments, refunds, reports' },
];

const PERMISSIONS = [
  ['products:read', 'products'],
  ['products:write', 'products'],
  ['products:publish', 'products'],
  ['products:delete', 'products'],
  ['categories:read', 'categories'],
  ['categories:write', 'categories'],
  ['brands:read', 'brands'],
  ['brands:write', 'brands'],
  ['specifications:read', 'specifications'],
  ['specifications:write', 'specifications'],
  ['inventory:read', 'inventory'],
  ['inventory:adjust', 'inventory'],
  ['orders:read', 'orders'],
  ['orders:update_status', 'orders'],
  ['orders:cancel', 'orders'],
  ['payments:read', 'payments'],
  ['payments:refund', 'payments'],
  ['shipping:read', 'shipping'],
  ['shipping:write', 'shipping'],
  ['returns:read', 'returns'],
  ['returns:approve', 'returns'],
  ['returns:reject', 'returns'],
  ['reviews:read', 'reviews'],
  ['reviews:moderate', 'reviews'],
  ['customers:read', 'customers'],
  ['coupons:read', 'coupons'],
  ['coupons:write', 'coupons'],
  ['cms:read', 'cms'],
  ['cms:write', 'cms'],
  ['cms:publish', 'cms'],
  ['analytics:read', 'analytics'],
  ['reports:read', 'reports'],
  ['employees:read', 'employees'],
  ['employees:manage', 'employees'],
  ['roles:manage', 'roles'],
  ['audit:read', 'audit'],
  ['settings:read', 'settings'],
  ['settings:write', 'settings'],
  ['support:read', 'support'],
  ['support:write', 'support'],
  ['support:assign', 'support'],
].map(([code, module]) => ({
  code,
  name: code,
  module,
  description: null,
}));

/** Role → permission codes (super_admin gets all) */
const ROLE_PERMS = {
  catalog_manager: [
    'products:read',
    'products:write',
    'products:publish',
    'products:delete',
    'categories:read',
    'categories:write',
    'brands:read',
    'brands:write',
    'specifications:read',
    'specifications:write',
  ],
  order_manager: ['orders:read', 'orders:update_status', 'orders:cancel', 'shipping:read', 'shipping:write'],
  inventory_manager: ['inventory:read', 'inventory:adjust', 'products:read'],
  support_team: [
    'support:read',
    'support:write',
    'support:assign',
    'returns:read',
    'returns:approve',
    'returns:reject',
    'customers:read',
    'orders:read',
  ],
  marketing_manager: [
    'cms:read',
    'cms:write',
    'cms:publish',
    'coupons:read',
    'coupons:write',
    'analytics:read',
  ],
  finance_accounts: ['payments:read', 'payments:refund', 'reports:read', 'orders:read'],
};

/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  for (const role of ROLES) {
    const existing = await knex('roles').where({ code: role.code }).first();
    if (!existing) {
      await knex('roles').insert({
        ...role,
        is_system: role.is_system || false,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  for (const perm of PERMISSIONS) {
    const existing = await knex('permissions').where({ code: perm.code }).first();
    if (!existing) {
      await knex('permissions').insert({ ...perm, created_at: knex.fn.now() });
    }
  }

  const roles = await knex('roles').select('id', 'code');
  const perms = await knex('permissions').select('id', 'code');
  const roleByCode = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  const permByCode = Object.fromEntries(perms.map((p) => [p.code, p.id]));

  // Super admin: all permissions
  const superId = roleByCode.super_admin;
  if (superId) {
    for (const p of perms) {
      const exists = await knex('role_permissions')
        .where({ role_id: superId, permission_id: p.id })
        .first();
      if (!exists) {
        await knex('role_permissions').insert({
          role_id: superId,
          permission_id: p.id,
          created_at: knex.fn.now(),
        });
      }
    }
  }

  for (const [roleCode, codes] of Object.entries(ROLE_PERMS)) {
    const rid = roleByCode[roleCode];
    if (!rid) continue;
    for (const code of codes) {
      const pid = permByCode[code];
      if (!pid) continue;
      const exists = await knex('role_permissions')
        .where({ role_id: rid, permission_id: pid })
        .first();
      if (!exists) {
        await knex('role_permissions').insert({
          role_id: rid,
          permission_id: pid,
          created_at: knex.fn.now(),
        });
      }
    }
  }
};
