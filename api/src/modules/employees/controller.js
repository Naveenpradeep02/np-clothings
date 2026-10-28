import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listEmployees({
    ...pagination,
    status: req.query.status,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  const row = await service.getEmployee(req.params.id);
  return success(res, row);
}

export async function provision(req, res) {
  const employee = await service.provisionEmployee(req.user, req.body || {});
  return created(res, employee);
}

export async function setStatus(req, res) {
  const employee = await service.setEmployeeStatus(req.user, req.params.id, req.body?.status);
  return success(res, employee);
}

export async function assignRoles(req, res) {
  const employee = await service.assignRoles(req.user, req.params.id, req.body?.role_codes || []);
  return success(res, employee);
}

export async function navigation(req, res) {
  const items = service.buildAdminNavigation(req.user.permissions || []);
  return success(res, {
    items,
    permissions: req.user.permissions || [],
    roles: req.user.roles || [],
  });
}

export default { list, get, provision, setStatus, assignRoles, navigation };
