/**
 * Authentication middleware — Firebase ID token verification + local user sync.
 * Authorization (RBAC) is enforced separately via requirePermission (Phase 3.2).
 */

import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import * as authService from '../modules/auth/service.js';
import logger from '../lib/logger.js';

function extractBearer(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Require valid Firebase ID token and attach req.user (local DB user).
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) {
      return next(new UnauthorizedError('Missing or invalid Authorization header'));
    }

    const { claims, user } = await authService.resolveAuthenticatedUser(token);
    req.authToken = token;
    req.firebaseClaims = claims;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — populate req.user when token is valid; never fail on missing token.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) {
      return next();
    }
    const { claims, user } = await authService.resolveAuthenticatedUser(token);
    req.authToken = token;
    req.firebaseClaims = claims;
    req.user = user;
    next();
  } catch (err) {
    logger.debug('optionalAuth ignored invalid token', { message: err.message });
    next();
  }
}

/**
 * Require one or more permission codes (backend RBAC — Phase 3.2 fills permissions).
 */
export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    const userPerms = req.user.permissions || [];
    const ok = permissions.every((p) => userPerms.includes(p));
    if (!ok) {
      return next(new ForbiddenError(`Missing permission: ${permissions.join(', ')}`));
    }
    next();
  };
}

/**
 * Require employee user_type for admin panel routes.
 */
export function requireEmployee(req, res, next) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  if (req.user.user_type !== 'employee') {
    return next(new ForbiddenError('Employee access required'));
  }
  next();
}

export default { requireAuth, optionalAuth, requirePermission, requireEmployee };

/**
 * Require at least one of the given permissions.
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    const userPerms = req.user.permissions || [];
    const ok = permissions.some((p) => userPerms.includes(p));
    if (!ok) {
      return next(new ForbiddenError(`Missing one of: ${permissions.join(', ')}`));
    }
    next();
  };
}
