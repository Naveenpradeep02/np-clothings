import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function create(req, res) {
  return created(res, await service.createReview(req.user.id, req.body || {}));
}

export async function listForProduct(req, res) {
  const pagination = parsePagination(req.query);
  const { summary, items, total } = await service.listProductReviews(
    req.params.productId,
    pagination,
    { status: 'approved' }
  );
  return success(res, { summary, items }, paginationMeta({ ...pagination, total }));
}

export async function listAdmin(req, res) {
  const pagination = parsePagination(req.query);
  const { items, total } = await service.listAdmin(pagination, {
    status: req.query.status,
  });
  return success(res, items, paginationMeta({ ...pagination, total }));
}

export async function moderate(req, res) {
  return success(
    res,
    await service.moderate(req.user, req.params.id, {
      action: req.body?.action,
      reason: req.body?.reason,
    })
  );
}

export async function recommendations(req, res) {
  return success(
    res,
    await service.recommendations(req.params.productId, {
      limit: req.query.limit,
    })
  );
}

export default { create, listForProduct, listAdmin, moderate, recommendations };
