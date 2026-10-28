import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function create(req, res) {
  return created(res, await service.createReturnRequest(req.user.id, req.body || {}));
}

export async function listMine(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listMyReturns(req.user.id, pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function listAdmin(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listReturnsAdmin(pagination, {
    status: req.query.status,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  const admin = req.user?.user_type === 'employee';
  return success(res, await service.getReturn(req.params.id, req.user.id, { admin }));
}

export async function transition(req, res) {
  return success(
    res,
    await service.transitionReturn(req.user, req.params.id, {
      status: req.body?.status,
      admin_note: req.body?.admin_note,
    })
  );
}

export async function refund(req, res) {
  return success(res, await service.processRefund(req.user, req.params.id, req.body || {}));
}

export default { create, listMine, listAdmin, get, transition, refund };
