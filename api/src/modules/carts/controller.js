import * as service from './service.js';
import { success } from '../../lib/response.js';
import { BadRequestError } from '../../lib/errors.js';

function sessionId(req) {
  return req.headers['x-session-id'] || req.body?.session_id || null;
}

export async function getOrCreate(req, res) {
  const cart = await service.getOrCreateCart({
    userId: req.user?.id,
    sessionId: sessionId(req),
  });
  const view = await service.getCartView(cart.id, {
    couponCode: req.query.coupon,
    userId: req.user?.id,
  });
  return success(res, view);
}

export async function get(req, res) {
  const cart = await service.getOrCreateCart({
    userId: req.user?.id,
    sessionId: sessionId(req),
  });
  // if id param, ensure access
  if (req.params.id && Number(req.params.id) !== Number(cart.id)) {
    const other = await service.getOrCreateCart({ userId: req.user?.id, sessionId: sessionId(req) });
    void other;
  }
  const id = req.params.id || cart.id;
  const existing = await import('./repository.js').then((r) => r.findCartById(id));
  if (!existing) {
    throw new BadRequestError('Cart not found');
  }
  service.assertCartAccess(existing, { userId: req.user?.id, sessionId: sessionId(req) });
  const view = await service.getCartView(id, {
    couponCode: req.query.coupon,
    userId: req.user?.id,
  });
  return success(res, view);
}

export async function addItem(req, res) {
  const cart = await service.getOrCreateCart({
    userId: req.user?.id,
    sessionId: sessionId(req),
  });
  const view = await service.addItem({
    cartId: cart.id,
    variantId: req.body?.variant_id,
    quantity: req.body?.quantity ?? 1,
  });
  return success(res, view);
}

export async function updateItem(req, res) {
  const cart = await service.getOrCreateCart({
    userId: req.user?.id,
    sessionId: sessionId(req),
  });
  const view = await service.updateItem({
    cartId: cart.id,
    cartItemId: req.params.itemId,
    quantity: req.body?.quantity,
  });
  return success(res, view);
}

export async function removeItem(req, res) {
  const cart = await service.getOrCreateCart({
    userId: req.user?.id,
    sessionId: sessionId(req),
  });
  const view = await service.removeItem({
    cartId: cart.id,
    cartItemId: req.params.itemId,
  });
  return success(res, view);
}

export default { getOrCreate, get, addItem, updateItem, removeItem };
