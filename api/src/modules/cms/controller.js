import * as service from './service.js';
import { success, created } from '../../lib/response.js';

export async function getHome(req, res) {
  const page = req.params.page || req.query.page || 'home';
  return success(res, await service.getPage(page));
}

export async function listAdmin(req, res) {
  return success(res, await service.listAdmin(req.query.page || 'home'));
}

export async function getSection(req, res) {
  return success(res, await service.getSection(req.params.id));
}

export async function createSection(req, res) {
  return created(res, await service.createSection(req.user, req.body || {}));
}

export async function updateSection(req, res) {
  return success(res, await service.updateSection(req.user, req.params.id, req.body || {}));
}

export async function deleteSection(req, res) {
  return success(res, await service.deleteSection(req.user, req.params.id));
}

export async function reorder(req, res) {
  return success(
    res,
    await service.reorder(req.user, req.body?.page || 'home', req.body?.section_ids || [])
  );
}

export async function addBanner(req, res) {
  return created(res, await service.addBanner(req.user, req.params.id, req.body || {}));
}

export async function updateBanner(req, res) {
  return success(
    res,
    await service.updateBanner(req.user, req.params.id, req.params.bannerId, req.body || {})
  );
}

export async function deleteBanner(req, res) {
  return success(res, await service.deleteBanner(req.user, req.params.id, req.params.bannerId));
}

export async function setProducts(req, res) {
  return success(
    res,
    await service.setProducts(req.user, req.params.id, req.body?.product_ids || [])
  );
}

export async function seedHome(req, res) {
  return success(res, await service.seedHome(req.user));
}

export default {
  getHome,
  listAdmin,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorder,
  addBanner,
  updateBanner,
  deleteBanner,
  setProducts,
  seedHome,
};
