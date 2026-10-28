import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function create(req, res) {
  return created(res, await service.createShipment(req.user, req.body || {}));
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listShipments(pagination, {
    status: req.query.status,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  return success(res, await service.getShipment(req.params.id));
}

export async function byOrder(req, res) {
  const admin = req.user?.user_type === 'employee';
  const rows = await service.getByOrder(req.params.orderId, {
    userId: req.user?.id,
    admin,
  });
  return success(res, rows);
}

export async function byTracking(req, res) {
  return success(res, await service.getByTracking(req.params.trackingNumber));
}

export async function addEvent(req, res) {
  return success(res, await service.addEvent(req.user, req.params.id, req.body || {}));
}

export async function sync(req, res) {
  return success(res, await service.syncFromProvider(req.params.id));
}

export async function webhook(req, res) {
  const signature =
    req.headers['x-shipping-signature'] ||
    req.headers['x-mock-signature'] ||
    '';
  const result = await service.processWebhook({
    rawBody: req.rawBody || JSON.stringify(req.body || {}),
    signature,
    payload: req.body || {},
  });
  return res.status(200).json({ success: true, data: result });
}

export default { create, list, get, byOrder, byTracking, addEvent, sync, webhook };
