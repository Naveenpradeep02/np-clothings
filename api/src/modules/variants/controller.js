import * as service from './service.js';
import { success, created } from '../../lib/response.js';

export async function get(req, res) {
  return success(res, await service.getVariant(req.params.id));
}

export async function listByProduct(req, res) {
  const status = req.query.status;
  return success(
    res,
    await service.listProductVariants(req.params.productId, { status })
  );
}

/** POST body: { product_id, option_ids: number[] } */
export async function resolve(req, res) {
  const productId = req.body?.product_id ?? req.query.product_id;
  const optionIds = req.body?.option_ids ?? req.body?.optionIds;
  return success(res, await service.resolveVariant(productId, optionIds));
}

/** POST body: { option_ids: number[] } — no DB write */
export async function previewHash(req, res) {
  return success(res, service.previewHash(req.body?.option_ids || []));
}

export async function create(req, res) {
  return created(res, await service.createVariant(req.user, req.body || {}));
}

export async function update(req, res) {
  return success(res, await service.updateVariant(req.user, req.params.id, req.body || {}));
}

export async function remove(req, res) {
  return success(res, await service.deleteVariant(req.user, req.params.id));
}

export default { get, listByProduct, resolve, previewHash, create, update, remove };
