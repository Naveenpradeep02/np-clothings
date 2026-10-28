import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  const isAdmin = req.user?.user_type === 'employee';
  const { rows, total } = await service.listProducts(pagination, {
    status: isAdmin && req.query.status ? req.query.status : 'published',
    categoryId: req.query.category_id ? Number(req.query.category_id) : undefined,
    brandId: req.query.brand_id ? Number(req.query.brand_id) : undefined,
    featured: req.query.featured,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  const forAdmin = req.user?.user_type === 'employee';
  const row = await service.getProduct(req.params.idOrSlug, { forAdmin });
  return success(res, row);
}

export async function create(req, res) {
  const row = await service.createProduct(req.user, req.body || {});
  return created(res, row);
}

export async function update(req, res) {
  const row = await service.updateProduct(req.user, req.params.id, req.body || {});
  return success(res, row);
}

export async function publish(req, res) {
  const row = await service.publishProduct(req.user, req.params.id);
  return success(res, row);
}

export async function remove(req, res) {
  const result = await service.deleteProduct(req.user, req.params.id);
  return success(res, result);
}

export async function addImage(req, res) {
  const image = await service.addImage(req.user, req.params.id, req.body || {});
  return created(res, image);
}

export async function removeImage(req, res) {
  const result = await service.removeImage(req.user, req.params.id, req.params.imageId);
  return success(res, result);
}

export async function updateImage(req, res) {
  const image = await service.updateImage(req.user, req.params.id, req.params.imageId, req.body || {});
  return success(res, image);
}

export async function assignGroups(req, res) {
  const row = await service.assignGroups(req.user, req.params.id, req.body || {});
  return success(res, row);
}

export async function assignOptions(req, res) {
  const row = await service.assignOptions(req.user, req.params.id, req.body || {});
  return success(res, row);
}

export default {
  list,
  get,
  create,
  update,
  publish,
  remove,
  addImage,
  removeImage,
  updateImage,
  assignGroups,
  assignOptions,
};

