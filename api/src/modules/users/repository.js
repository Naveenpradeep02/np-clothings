/**
 * User identity repository — Firebase UID ↔ MySQL users.
 */

import db from '../../db/knex.js';

export async function findByFirebaseUid(firebaseUid) {
  return db('users').where({ firebase_uid: firebaseUid }).whereNull('deleted_at').first();
}

export async function findById(id) {
  return db('users').where({ id }).whereNull('deleted_at').first();
}

export async function findByEmail(email) {
  return db('users').where({ email }).whereNull('deleted_at').first();
}

export async function createUser({
  firebase_uid,
  email,
  email_verified = false,
  phone = null,
  user_type = 'customer',
  status = 'active',
}) {
  const [id] = await db('users').insert({
    firebase_uid,
    email,
    email_verified: Boolean(email_verified),
    phone,
    user_type,
    status,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findById(id);
}

export async function updateUser(id, patch) {
  const allowed = {};
  if (patch.email !== undefined) allowed.email = patch.email;
  if (patch.email_verified !== undefined) allowed.email_verified = Boolean(patch.email_verified);
  if (patch.phone !== undefined) allowed.phone = patch.phone;
  if (patch.status !== undefined) allowed.status = patch.status;
  if (patch.last_login_at !== undefined) allowed.last_login_at = patch.last_login_at;
  allowed.updated_at = db.fn.now();

  await db('users').where({ id }).update(allowed);
  return findById(id);
}

export async function ensureCustomerProfile(userId, profile = {}) {
  const existing = await db('customer_profiles').where({ user_id: userId }).first();
  if (existing) {
    if (profile.first_name || profile.last_name || profile.display_name) {
      await db('customer_profiles')
        .where({ user_id: userId })
        .update({
          ...(profile.first_name !== undefined ? { first_name: profile.first_name } : {}),
          ...(profile.last_name !== undefined ? { last_name: profile.last_name } : {}),
          ...(profile.display_name !== undefined ? { display_name: profile.display_name } : {}),
          updated_at: db.fn.now(),
        });
    }
    return db('customer_profiles').where({ user_id: userId }).first();
  }

  const [id] = await db('customer_profiles').insert({
    user_id: userId,
    first_name: profile.first_name || null,
    last_name: profile.last_name || null,
    display_name: profile.display_name || null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return db('customer_profiles').where({ id }).first();
}

export async function getCustomerProfile(userId) {
  return db('customer_profiles').where({ user_id: userId }).first();
}

/**
 * Load roles + permission codes for a user (used by Phase 3.2 RBAC; safe no-op if empty).
 */
export async function getUserPermissions(userId) {
  const rows = await db('user_roles as ur')
    .join('role_permissions as rp', 'rp.role_id', 'ur.role_id')
    .join('permissions as p', 'p.id', 'rp.permission_id')
    .where('ur.user_id', userId)
    .select('p.code');
  return [...new Set(rows.map((r) => r.code))];
}

export async function getUserRoles(userId) {
  const rows = await db('user_roles as ur')
    .join('roles as r', 'r.id', 'ur.role_id')
    .where('ur.user_id', userId)
    .select('r.code', 'r.name');
  return rows;
}

export async function getAddresses(userId) {
  return db('addresses').where({ user_id: userId }).whereNull('deleted_at').orderBy('is_default', 'desc');
}

export async function listCustomers({ limit = 20, offset = 0, status, search } = {}) {
  let query = db('users as u')
    .leftJoin('customer_profiles as cp', 'cp.user_id', 'u.id')
    .where('u.user_type', 'customer')
    .whereNull('u.deleted_at');

  if (status) {
    query = query.where('u.status', status);
  }
  if (search) {
    query = query.where((q) => {
      q.where('u.email', 'like', `%${search}%`)
        .orWhere('u.phone', 'like', `%${search}%`)
        .orWhere('cp.display_name', 'like', `%${search}%`)
        .orWhere('cp.first_name', 'like', `%${search}%`)
        .orWhere('cp.last_name', 'like', `%${search}%`);
    });
  }

  const countRow = await query.clone().count({ total: 'u.id' }).first();
  const total = Number(countRow?.total || 0);

  const rows = await query
    .select(
      'u.id',
      'u.email',
      'u.email_verified',
      'u.phone',
      'u.status',
      'u.last_login_at',
      'u.created_at',
      'cp.first_name',
      'cp.last_name',
      'cp.display_name',
      'cp.avatar_url',
      'cp.date_of_birth',
      'cp.gender'
    )
    .orderBy('u.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { rows, total };
}

export async function customerOrderStats(userId) {
  const row = await db('orders')
    .where({ user_id: userId })
    .select(
      db.raw('count(id) as total_orders'),
      db.raw('coalesce(sum(grand_total), 0) as total_spent')
    )
    .first();
  return {
    total_orders: Number(row?.total_orders || 0),
    total_spent: Number(row?.total_spent || 0),
  };
}

export async function softDeleteUser(id) {
  return db('users').where({ id }).update({ deleted_at: db.fn.now() });
}

export default {
  findByFirebaseUid,
  findById,
  findByEmail,
  createUser,
  updateUser,
  ensureCustomerProfile,
  getCustomerProfile,
  getUserPermissions,
  getUserRoles,
  listCustomers,
  getAddresses,
  customerOrderStats,
  softDeleteUser,
};


export async function createAddress(userId, data) {
  const [id] = await db('addresses').insert({
    user_id: userId,
    label: data.label || null,
    full_name: data.full_name,
    phone: data.phone,
    line1: data.line1,
    line2: data.line2 || null,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    country_code: data.country_code || data.country || 'IN',
    is_default: data.is_default ? 1 : 0,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  if (data.is_default) {
    await db('addresses').where({ user_id: userId }).whereNot('id', id).update({ is_default: 0 });
  }
  return db('addresses').where({ id }).whereNull('deleted_at').first();
}

export async function updateAddress(userId, id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const k of ['label', 'full_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code']) {
    if (data[k] !== undefined) patch[k] = data[k];
  }
  if (data.country_code !== undefined || data.country !== undefined) {
    patch.country_code = data.country_code || data.country;
  }
  if (data.is_default !== undefined) patch.is_default = data.is_default ? 1 : 0;
  await db('addresses').where({ id, user_id: userId }).whereNull('deleted_at').update(patch);
  if (data.is_default) {
    await db('addresses').where({ user_id: userId }).whereNot('id', id).update({ is_default: 0 });
  }
  return db('addresses').where({ id, user_id: userId }).whereNull('deleted_at').first();
}

export async function deleteAddress(userId, id) {
  return db('addresses')
    .where({ id, user_id: userId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });
}

export async function findAddress(userId, id) {
  return db('addresses').where({ id, user_id: userId }).whereNull('deleted_at').first();
}
