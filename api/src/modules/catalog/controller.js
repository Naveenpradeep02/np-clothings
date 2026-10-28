import * as service from './service.js';
import { success, created, noContent } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

function parseParentId(query) {
  if (query.parent_id === 'null' || query.parent_id === '') return null;
  if (query.parent_id !== undefined) return Number(query.parent_id);
  return undefined;
}

// ---------- Categories ----------

export async function listCategories(req, res) {
  const pagination = parsePagination(req.query);
  const isAdmin = req.user?.user_type === 'employee';
  const { rows, total } = await service.getCategories(pagination, {
    parentId: parseParentId(req.query),
    status: isAdmin && req.query.status ? req.query.status : 'active',
    includeDeleted: false,
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function getCategory(req, res) {
  const row = await service.getCategory(req.params.id);
  return success(res, row);
}

export async function getCategoryTree(req, res) {
  const tree = await service.getCategoryTree();
  return success(res, tree);
}

export async function createCategory(req, res) {
  const row = await service.createCategory(req.user, req.body || {});
  return created(res, row);
}

export async function updateCategory(req, res) {
  const row = await service.updateCategory(req.user, req.params.id, req.body || {});
  return success(res, row);
}

export async function deleteCategory(req, res) {
  const result = await service.deleteCategory(req.user, req.params.id);
  return success(res, result);
}

// ---------- Brands ----------

export async function listBrands(req, res) {
  const pagination = parsePagination(req.query);
  const isAdmin = req.user?.user_type === 'employee';
  const { rows, total } = await service.getBrands(pagination, {
    status: isAdmin && req.query.status ? req.query.status : 'active',
    search: req.query.q || req.query.search,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function getBrand(req, res) {
  const row = await service.getBrand(req.params.id);
  return success(res, row);
}

export async function createBrand(req, res) {
  const row = await service.createBrand(req.user, req.body || {});
  return created(res, row);
}

export async function updateBrand(req, res) {
  const row = await service.updateBrand(req.user, req.params.id, req.body || {});
  return success(res, row);
}

export async function deleteBrand(req, res) {
  const result = await service.deleteBrand(req.user, req.params.id);
  return success(res, result);
}

export default {
  listCategories,
  getCategory,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
