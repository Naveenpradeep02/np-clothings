import * as rolesRepo from './repository.js';
import { success } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';

export async function listRoles(req, res) {
  const roles = await rolesRepo.listRoles();
  return success(res, roles);
}

export async function listPermissions(req, res) {
  const permissions = await rolesRepo.listPermissions();
  return success(res, permissions);
}

export async function getRolePermissions(req, res) {
  const role =
    (await rolesRepo.findRoleById(req.params.id)) ||
    (await rolesRepo.findRoleByCode(req.params.id));
  if (!role) throw new NotFoundError('Role not found');
  const permissions = await rolesRepo.getRolePermissionCodes(role.id);
  return success(res, { role, permissions });
}

export default { listRoles, listPermissions, getRolePermissions };
