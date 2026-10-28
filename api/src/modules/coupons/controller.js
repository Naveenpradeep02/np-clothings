import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function validate(req, res) {
  const data = await service.validateCode(req.body?.code || req.query.code, {
    subtotal: req.body?.subtotal ?? req.query.subtotal,
    userId: req.user?.id,
  });
  return success(res, data);
}

export async function listPublic(req, res) {
  return success(res, await service.listPublic());
}

export async function listAdmin(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listAdmin(pagination, {
    status: req.query.status,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  return success(res, await service.getCoupon(req.params.id));
}

export async function create(req, res) {
  return created(res, await service.createCoupon(req.user, req.body || {}));
}

export async function update(req, res) {
  return success(res, await service.updateCoupon(req.user, req.params.id, req.body || {}));
}

export async function redemptions(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listRedemptions(req.params.id, pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export default { validate, listPublic, listAdmin, get, create, update, redemptions };
