import * as service from './service.js';
import { success } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function get(req, res) {
  return success(res, await service.getInventory(req.params.variantId));
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listInventory(pagination, {
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function lowStock(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listLowStock(pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function ledger(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.getLedger(req.params.variantId, pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function adjust(req, res) {
  const row = await service.adjustStock(req.user, req.params.variantId, req.body || {});
  return success(res, row);
}

export async function reserve(req, res) {
  const result = await service.reserveStock({
    variantId: req.body?.variant_id || req.params.variantId,
    quantity: req.body?.quantity,
    cartId: req.body?.cart_id,
    orderId: req.body?.order_id,
    ttlMinutes: req.body?.ttl_minutes,
    actorId: req.user?.id,
  });
  return success(res, result);
}

export async function release(req, res) {
  const result = await service.releaseReservation(req.params.reservationId, {
    actorId: req.user?.id,
    reason: req.body?.reason,
  });
  return success(res, result);
}

export async function consume(req, res) {
  const result = await service.consumeReservation(req.params.reservationId, {
    actorId: req.user?.id,
    orderId: req.body?.order_id,
  });
  return success(res, result);
}

export async function expire(req, res) {
  const result = await service.expireReservations();
  return success(res, result);
}

export default {
  get,
  list,
  lowStock,
  ledger,
  adjust,
  reserve,
  release,
  consume,
  expire,
};
