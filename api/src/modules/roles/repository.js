import db from '../../db/knex.js';

export async function listRoles() {
  return db('roles').select('id', 'code', 'name', 'description', 'is_system').orderBy('id');
}

export async function findRoleByCode(code) {
  return db('roles').where({ code }).first();
}

export async function findRoleById(id) {
  return db('roles').where({ id }).first();
}

export async function listPermissions() {
  return db('permissions').select('id', 'code', 'name', 'module', 'description').orderBy(['module', 'code']);
}

export async function getRolePermissionCodes(roleId) {
  const rows = await db('role_permissions as rp')
    .join('permissions as p', 'p.id', 'rp.permission_id')
    .where('rp.role_id', roleId)
    .select('p.code', 'p.module', 'p.name');
  return rows;
}

export async function setUserRoles(userId, roleIds, assignedBy = null) {
  await db.transaction(async (trx) => {
    await trx('user_roles').where({ user_id: userId }).del();
    if (roleIds.length) {
      await trx('user_roles').insert(
        roleIds.map((role_id) => ({
          user_id: userId,
          role_id,
          assigned_by: assignedBy,
          created_at: trx.fn.now(),
        }))
      );
    }
  });
}

export async function addUserRole(userId, roleId, assignedBy = null) {
  const exists = await db('user_roles').where({ user_id: userId, role_id: roleId }).first();
  if (!exists) {
    await db('user_roles').insert({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      created_at: db.fn.now(),
    });
  }
}

export async function removeUserRole(userId, roleId) {
  await db('user_roles').where({ user_id: userId, role_id: roleId }).del();
}

export default {
  listRoles,
  findRoleByCode,
  findRoleById,
  listPermissions,
  getRolePermissionCodes,
  setUserRoles,
  addUserRole,
  removeUserRole,
};
