import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function checkout(req, res) {
  const order = await service.checkout({
    userId: req.user.id,
    cartId: req.body?.cart_id,
    shippingAddress: req.body?.shipping_address,
    billingAddress: req.body?.billing_address,
    couponCode: req.body?.coupon_code,
    customerNote: req.body?.customer_note,
  });
  return created(res, order);
}

export async function get(req, res) {
  const admin = req.user?.user_type === 'employee';
  const order = await service.getOrder(req.params.id, req.user.id, { admin });
  return success(res, order);
}

export async function listMine(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listMyOrders(req.user.id, pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function listAdmin(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listOrdersAdmin(pagination, {
    status: req.query.status,
    userId: req.query.user_id ? Number(req.query.user_id) : undefined,
    search: req.query.q || req.query.search,
    from: req.query.from,
    to: req.query.to,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function transition(req, res) {
  const order = await service.transitionStatus(req.user, req.params.id, {
    status: req.body?.status,
    note: req.body?.note,
  });
  return success(res, order);
}

export async function invoice(req, res) {
  const admin = req.user?.user_type === 'employee';
  const inv = await service.getInvoice(req.params.id, req.user.id, { admin });
  return success(res, inv);
}

export default { checkout, get, listMine, listAdmin, transition, invoice };
