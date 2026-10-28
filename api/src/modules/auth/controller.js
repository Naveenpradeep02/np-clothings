import * as authService from './service.js';
import { success } from '../../lib/response.js';
import { BadRequestError } from '../../lib/errors.js';

/**
 * POST /auth/sync
 * Client sends Firebase ID token after login; server upserts local user.
 * Body optional: { first_name, last_name, display_name }
 * Auth: Bearer required (token verified inside).
 */
export async function sync(req, res) {
  const token = req.authToken || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    throw new BadRequestError('Authorization Bearer token required');
  }

  const claims = await authService.verifyBearerToken(token);
  const user = await authService.syncUserFromClaims(claims, {
    first_name: req.body?.first_name,
    last_name: req.body?.last_name,
    display_name: req.body?.display_name,
  });

  return success(res, { user });
}

/**
 * GET /auth/me
 * Requires requireAuth middleware.
 */
export async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  return success(res, { user });
}

/**
 * POST /auth/logout
 * Server-side logout is a no-op for Firebase client tokens.
 * Client must discard the ID token. Optional audit hook later.
 */
export async function logout(req, res) {
  return success(res, {
    message: 'Logged out. Discard the Firebase ID token on the client.',
  });
}

/**
 * POST /auth/session
 * Alias for sync
 */
export async function session(req, res) {
  return sync(req, res);
}

/**
 * POST /auth/login
 * Body: { email, password, role }
 */
export async function login(req, res) {
  const { email, password, role } = req.body || {};
  const result = await authService.loginUser({ email, password, role });
  return success(res, result);
}

/**
 * POST /auth/register
 * Body: { email, password, first_name, last_name, phone }
 */
export async function register(req, res) {
  const { email, password, first_name, last_name, phone } = req.body || {};
  const result = await authService.registerCustomer({
    email,
    password,
    first_name,
    last_name,
    phone,
  });
  return success(res, result, 201);
}

export default { sync, me, logout, session, login, register };
