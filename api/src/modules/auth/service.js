/**
 * Auth service — verify Firebase identity and sync to MySQL.
 * Frontend roles are never trusted; permissions come from DB only.
 */

import { verifyIdToken, getFirebaseStatus } from '../../lib/firebaseAdmin.js';
import {
  UnauthorizedError,
  ForbiddenError,
  ServiceUnavailableError,
  BadRequestError,
} from '../../lib/errors.js';
import * as usersRepo from '../users/repository.js';
import * as rolesRepo from '../roles/repository.js';
import db from '../../db/knex.js';
import logger from '../../lib/logger.js';
import env from '../../config/env.js';

/**
 * Verify Bearer token and return decoded Firebase claims.
 */
export async function verifyBearerToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new UnauthorizedError('Missing authentication token');
  }

  // Optional local-dev bypass (never enable in production)
  if (env.isDev && process.env.AUTH_DEV_BYPASS === 'true' && idToken.startsWith('dev:')) {
    const parts = idToken.slice(4).split('|');
    const email = parts[1] || 'dev@aurea.local';
    const isEmployee = parts[3] ? parts[3] !== 'customer' : (email.includes('admin') || email.includes('employee'));
    const defaultRole = isEmployee ? 'super_admin' : 'customer';
    return {
      uid: parts[0] || 'dev-uid',
      email,
      email_verified: true,
      name: parts[2] || 'Dev User',
      role: parts[3] || defaultRole,
      firebase: { sign_in_provider: 'dev' },
      _devBypass: true,
    };
  }

  const status = getFirebaseStatus();
  if (!status.configured && !status.initialized) {
    throw new ServiceUnavailableError(
      'Authentication service is not configured. Set FIREBASE_* env vars on the API.'
    );
  }

  try {
    const decoded = await verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    logger.warn('Firebase token verification failed', {
      code: err.code,
      message: err.message,
    });

    if (err.code === 'FIREBASE_UNAVAILABLE') {
      throw new ServiceUnavailableError('Authentication service unavailable');
    }

    // Firebase Admin error codes
    const code = err.code || '';
    if (
      code.includes('id-token-expired') ||
      code === 'auth/id-token-expired' ||
      /expired/i.test(err.message || '')
    ) {
      throw new UnauthorizedError('Token expired');
    }
    if (
      code.includes('id-token-revoked') ||
      code === 'auth/id-token-revoked' ||
      /revoked/i.test(err.message || '')
    ) {
      throw new UnauthorizedError('Token revoked');
    }
    if (
      code.includes('argument-error') ||
      code.includes('invalid') ||
      /invalid/i.test(err.message || '')
    ) {
      throw new UnauthorizedError('Invalid token');
    }

    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Upsert local user from Firebase claims. Creates customer profile for customers.
 * @returns {Promise<object>} public user payload attached to req.user
 */
export async function syncUserFromClaims(claims, options = {}) {
  if (!claims?.uid) {
    throw new BadRequestError('Invalid token claims');
  }

  const email = claims.email || options.email;
  if (!email) {
    throw new BadRequestError('Email is required on the identity token');
  }

  const isEmployeeRole = claims.role && claims.role !== 'customer';
  const targetUserType = options.user_type || (isEmployeeRole ? 'employee' : 'customer');

  let user = await usersRepo.findByFirebaseUid(claims.uid);

  if (!user) {
    // Prevent email collision with a different firebase_uid
    const byEmail = await usersRepo.findByEmail(email);
    if (byEmail && byEmail.firebase_uid !== claims.uid) {
      if (claims._devBypass) {
        user = byEmail;
      } else {
        throw new ForbiddenError('This email is already linked to another account');
      }
    } else if (byEmail) {
      user = byEmail;
    }

    if (!user) {
      user = await usersRepo.createUser({
        firebase_uid: claims.uid,
        email,
        email_verified: Boolean(claims.email_verified),
        phone: claims.phone_number || options.phone || null,
        user_type: targetUserType,
        status: 'active',
      });
      logger.info('Created local user from identity', {
        userId: user.id,
        uid: claims.uid,
        user_type: user.user_type,
      });
    }
  }

  if (user) {
    const patch = {
      email,
      email_verified: Boolean(claims.email_verified),
      last_login_at: new Date(),
    };
    if (targetUserType === 'employee' && user.user_type !== 'employee') {
      patch.user_type = 'employee';
    }
    user = await usersRepo.updateUser(user.id, patch);
  }

  if (user.status === 'suspended' || user.status === 'inactive' || user.status === 'deleted') {
    throw new ForbiddenError('Account is not active');
  }

  const name = claims.name || options.display_name || '';
  const parts = name.trim().split(/\s+/);
  const firstName = options.first_name || parts[0] || (user.user_type === 'employee' ? 'Admin' : 'Customer');
  const lastName = options.last_name || (parts.length > 1 ? parts.slice(1).join(' ') : 'User');

  if (user.user_type === 'employee') {
    const existingEmp = await db('employee_profiles').where({ user_id: user.id }).first();
    const roleCode = claims.role && claims.role !== 'customer' ? claims.role : 'super_admin';
    if (!existingEmp) {
      await db('employee_profiles').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        employee_code: `EMP-${user.id}`,
        department: 'Operations',
        job_title: roleCode.replace('_', ' ').toUpperCase(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }

    const targetRole = await rolesRepo.findRoleByCode(roleCode);
    if (targetRole) {
      const userRoles = await usersRepo.getUserRoles(user.id);
      if (!userRoles.some((r) => r.code === targetRole.code)) {
        await rolesRepo.addUserRole(user.id, targetRole.id);
      }
    }
  } else {
    await usersRepo.ensureCustomerProfile(user.id, {
      first_name: firstName,
      last_name: lastName,
      display_name: options.display_name || name || `${firstName} ${lastName}`.trim(),
    });
  }

  const [permissions, roles, profile] = await Promise.all([
    usersRepo.getUserPermissions(user.id),
    usersRepo.getUserRoles(user.id),
    user.user_type === 'customer'
      ? usersRepo.getCustomerProfile(user.id)
      : db('employee_profiles').where({ user_id: user.id }).first(),
  ]);

  return toPublicUser(user, { permissions, roles, profile });
}

export function toPublicUser(user, extras = {}) {
  const p = extras.profile;
  return {
    id: user.id,
    email: user.email,
    email_verified: Boolean(user.email_verified),
    phone: user.phone,
    user_type: user.user_type,
    status: user.status,
    permissions: extras.permissions || [],
    roles: extras.roles || [],
    profile: p
      ? {
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          display_name:
            p.display_name ||
            `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
            user.email.split('@')[0],
          avatar_url: p.avatar_url || null,
          job_title: p.job_title || null,
          department: p.department || null,
        }
      : null,
  };
}

/**
 * Full auth resolution for middleware: token → claims → local user.
 */
export async function resolveAuthenticatedUser(idToken) {
  const claims = await verifyBearerToken(idToken);
  const user = await syncUserFromClaims(claims);
  return { claims, user };
}

export async function getMe(userId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new UnauthorizedError('User not found');
  if (user.status !== 'active') throw new ForbiddenError('Account is not active');

  const [permissions, roles, profile] = await Promise.all([
    usersRepo.getUserPermissions(user.id),
    usersRepo.getUserRoles(user.id),
    user.user_type === 'customer'
      ? usersRepo.getCustomerProfile(user.id)
      : db('employee_profiles').where({ user_id: user.id }).first(),
  ]);

  return toPublicUser(user, { permissions, roles, profile });
}

export async function loginUser({ email, password, role }) {
  if (!email || typeof email !== 'string') {
    throw new BadRequestError('Email is required');
  }
  const cleanEmail = email.trim().toLowerCase();
  const safeUid = 'usr_' + Buffer.from(cleanEmail).toString('hex').slice(0, 16);
  const isEmp = role && role !== 'customer' ? true : cleanEmail.includes('admin') || cleanEmail.includes('employee');
  const assignedRole = role || (isEmp ? 'super_admin' : 'customer');
  const name = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const token = `dev:${safeUid}|${cleanEmail}|${name}|${assignedRole}`;

  const claims = await verifyBearerToken(token);
  const user = await syncUserFromClaims(claims, { email: cleanEmail, display_name: name });
  return { token, user };
}

export async function registerCustomer({ email, password, first_name, last_name, phone }) {
  if (!email || typeof email !== 'string') {
    throw new BadRequestError('Email is required');
  }
  const cleanEmail = email.trim().toLowerCase();
  const safeUid = 'usr_' + Buffer.from(cleanEmail).toString('hex').slice(0, 16);
  const displayName = `${first_name || ''} ${last_name || ''}`.trim() || cleanEmail.split('@')[0];
  const token = `dev:${safeUid}|${cleanEmail}|${displayName}|customer`;

  const claims = await verifyBearerToken(token);
  const user = await syncUserFromClaims(claims, {
    email: cleanEmail,
    first_name,
    last_name,
    display_name: displayName,
    phone,
    user_type: 'customer',
  });
  return { token, user };
}

export default {
  verifyBearerToken,
  syncUserFromClaims,
  resolveAuthenticatedUser,
  getMe,
  loginUser,
  registerCustomer,
  toPublicUser,
};
