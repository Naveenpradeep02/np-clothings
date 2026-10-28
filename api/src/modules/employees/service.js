/**
 * Employee provisioning and role management.
 */

import * as usersRepo from '../users/repository.js';
import * as rolesRepo from '../roles/repository.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../../lib/errors.js';
import db from '../../db/knex.js';
import logger from '../../lib/logger.js';

export async function listEmployees({ limit = 20, offset = 0, status } = {}) {
  let q = db('users as u')
    .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
    .where('u.user_type', 'employee')
    .whereNull('u.deleted_at')
    .select(
      'u.id',
      'u.email',
      'u.status',
      'u.last_login_at',
      'u.created_at',
      'ep.first_name',
      'ep.last_name',
      'ep.employee_code',
      'ep.department',
      'ep.job_title'
    );

  if (status) q = q.where('u.status', status);

  const rows = await q.orderBy('u.id', 'desc').limit(limit).offset(offset);
  const countQ = db('users').where({ user_type: 'employee' }).whereNull('deleted_at');
  if (status) countQ.where({ status });
  const [{ total }] = await countQ.count({ total: '*' });

  // Attach roles
  for (const row of rows) {
    row.roles = await usersRepo.getUserRoles(row.id);
  }

  return { rows, total: Number(total) };
}

export async function getEmployee(id) {
  const user = await db('users as u')
    .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
    .where('u.id', id)
    .where('u.user_type', 'employee')
    .whereNull('u.deleted_at')
    .select(
      'u.id',
      'u.email',
      'u.firebase_uid',
      'u.status',
      'u.last_login_at',
      'u.created_at',
      'ep.first_name',
      'ep.last_name',
      'ep.employee_code',
      'ep.department',
      'ep.job_title',
      'ep.avatar_url'
    )
    .first();

  if (!user) throw new NotFoundError('Employee not found');

  const roles = await usersRepo.getUserRoles(user.id);
  const permissions = await usersRepo.getUserPermissions(user.id);
  return { ...user, roles, permissions };
}

/**
 * Provision an employee. They must already exist in Firebase (or use known firebase_uid).
 * Creates/updates local user as employee + profile + roles.
 */
export async function provisionEmployee(actor, payload) {
  const {
    email,
    firebase_uid,
    first_name,
    last_name,
    employee_code,
    department,
    job_title,
    role_codes = [],
  } = payload;

  if (!email || !firebase_uid) {
    throw new BadRequestError('email and firebase_uid are required');
  }
  if (!first_name || !last_name) {
    throw new BadRequestError('first_name and last_name are required');
  }

  let user = await usersRepo.findByFirebaseUid(firebase_uid);
  const byEmail = await usersRepo.findByEmail(email);

  if (byEmail && (!user || byEmail.id !== user.id)) {
    throw new ConflictError('Email already registered to another account');
  }

  if (!user) {
    user = await usersRepo.createUser({
      firebase_uid,
      email,
      email_verified: true,
      user_type: 'employee',
      status: 'active',
    });
  } else {
    await db('users').where({ id: user.id }).update({
      user_type: 'employee',
      email,
      status: 'active',
      updated_at: db.fn.now(),
    });
    user = await usersRepo.findById(user.id);
  }

  const existingProfile = await db('employee_profiles').where({ user_id: user.id }).first();
  if (existingProfile) {
    await db('employee_profiles')
      .where({ user_id: user.id })
      .update({
        first_name,
        last_name,
        employee_code: employee_code || existingProfile.employee_code,
        department: department || existingProfile.department,
        job_title: job_title || existingProfile.job_title,
        updated_at: db.fn.now(),
      });
  } else {
    await db('employee_profiles').insert({
      user_id: user.id,
      first_name,
      last_name,
      employee_code: employee_code || null,
      department: department || null,
      job_title: job_title || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  }

  if (role_codes.length) {
    const roleIds = [];
    for (const code of role_codes) {
      const role = await rolesRepo.findRoleByCode(code);
      if (!role) throw new BadRequestError(`Unknown role: ${code}`);
      roleIds.push(role.id);
    }
    await rolesRepo.setUserRoles(user.id, roleIds, actor.id);
  }

  await writeAudit({
    actorId: actor.id,
    action: 'employee.provisioned',
    entityType: 'user',
    entityId: user.id,
    newValues: { email, role_codes, first_name, last_name },
  });

  logger.info('Employee provisioned', { employeeId: user.id, by: actor.id });
  return getEmployee(user.id);
}

export async function setEmployeeStatus(actor, employeeId, status) {
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new BadRequestError('status must be active, inactive, or suspended');
  }
  if (actor.id === Number(employeeId) && status !== 'active') {
    throw new ForbiddenError('Cannot deactivate your own account');
  }

  const employee = await getEmployee(employeeId);
  const oldStatus = employee.status;

  await db('users').where({ id: employeeId }).update({
    status,
    updated_at: db.fn.now(),
  });

  await writeAudit({
    actorId: actor.id,
    action: 'employee.status_changed',
    entityType: 'user',
    entityId: Number(employeeId),
    oldValues: { status: oldStatus },
    newValues: { status },
  });

  return getEmployee(employeeId);
}

export async function assignRoles(actor, employeeId, roleCodes) {
  if (!Array.isArray(roleCodes)) {
    throw new BadRequestError('role_codes must be an array');
  }

  await getEmployee(employeeId); // ensures exists

  const roleIds = [];
  for (const code of roleCodes) {
    const role = await rolesRepo.findRoleByCode(code);
    if (!role) throw new BadRequestError(`Unknown role: ${code}`);
    roleIds.push(role.id);
  }

  const previous = await usersRepo.getUserRoles(employeeId);
  await rolesRepo.setUserRoles(employeeId, roleIds, actor.id);

  await writeAudit({
    actorId: actor.id,
    action: 'employee.roles_assigned',
    entityType: 'user',
    entityId: Number(employeeId),
    oldValues: { roles: previous.map((r) => r.code) },
    newValues: { roles: roleCodes },
  });

  return getEmployee(employeeId);
}

/**
 * Navigation items filtered by permissions for admin UI.
 */
export function buildAdminNavigation(permissions = []) {
  const has = (code) => permissions.includes(code);
  const hasAny = (...codes) => codes.some((c) => permissions.includes(c));

  const items = [
    { key: 'dashboard', label: 'Dashboard', path: '/', permission: null },
    {
      key: 'products',
      label: 'Products',
      path: '/products',
      permission: 'products:read',
    },
    {
      key: 'categories',
      label: 'Categories',
      path: '/categories',
      permission: 'categories:read',
    },
    {
      key: 'inventory',
      label: 'Inventory',
      path: '/inventory',
      permission: 'inventory:read',
    },
    {
      key: 'orders',
      label: 'Orders',
      path: '/orders',
      permission: 'orders:read',
    },
    {
      key: 'customers',
      label: 'Customers',
      path: '/customers',
      permission: 'customers:read',
    },
    {
      key: 'returns',
      label: 'Returns',
      path: '/returns',
      permission: 'returns:read',
    },
    {
      key: 'support',
      label: 'Support',
      path: '/support',
      permission: 'support:read',
    },
    {
      key: 'cms',
      label: 'CMS',
      path: '/cms',
      permission: 'cms:read',
    },
    {
      key: 'coupons',
      label: 'Coupons',
      path: '/coupons',
      permission: 'coupons:read',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      permission: 'analytics:read',
    },
    {
      key: 'employees',
      label: 'Employees',
      path: '/employees',
      permission: 'employees:read',
    },
    {
      key: 'audit',
      label: 'Audit Logs',
      path: '/audit',
      permission: 'audit:read',
    },
    {
      key: 'settings',
      label: 'Settings',
      path: '/settings',
      permission: 'settings:read',
    },
  ];

  return items.filter((item) => !item.permission || has(item.permission));
}

export default {
  listEmployees,
  getEmployee,
  provisionEmployee,
  setEmployeeStatus,
  assignRoles,
  buildAdminNavigation,
};
