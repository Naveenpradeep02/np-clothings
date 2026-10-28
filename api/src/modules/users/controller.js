import * as service from './service.js';
import { success } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function me(req, res) {
  return success(res, await service.getMe(req.user.id));
}

export async function updateMe(req, res) {
  return success(res, await service.updateMe(req.user.id, req.body || {}));
}

export async function listCustomers(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listCustomers(pagination, {
    status: req.query.status,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function getCustomer(req, res) {
  return success(res, await service.getCustomer(req.params.id));
}

export async function updateStatus(req, res) {
  return success(
    res,
    await service.updateCustomerStatus(req.user, req.params.id, {
      status: req.body?.status,
      reason: req.body?.reason,
    })
  );
}

export async function customerOrders(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listCustomerOrders(req.params.id, pagination);
  return success(
    res,
    rows.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      grand_total: Number(o.grand_total),
      currency: o.currency,
      created_at: o.created_at,
    })),
    paginationMeta({ ...pagination, total })
  );
}


export async function listAddresses(req, res) {
  return success(res, await service.listAddresses(req.user.id));
}

export async function createAddress(req, res) {
  return success(res, await service.createAddress(req.user.id, req.body || {}), undefined, 201);
}

export async function updateAddress(req, res) {
  return success(res, await service.updateAddress(req.user.id, req.params.addressId, req.body || {}));
}

export async function deleteAddress(req, res) {
  return success(res, await service.deleteAddress(req.user.id, req.params.addressId));
}

export default {
  me,
  updateMe,
  listCustomers,
  getCustomer,
  updateStatus,
  customerOrders,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};

