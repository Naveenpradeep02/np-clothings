import * as service from './service.js';
import { success, created } from '../../lib/response.js';

export async function listGroups(req, res) {
  return success(res, await service.listGroups());
}

export async function getGroup(req, res) {
  return success(res, await service.getGroup(req.params.id));
}

export async function createGroup(req, res) {
  return created(res, await service.createGroup(req.user, req.body || {}));
}

export async function updateGroup(req, res) {
  return success(res, await service.updateGroup(req.user, req.params.id, req.body || {}));
}

export async function listOptions(req, res) {
  const filters = {};
  if (req.query.group_id) filters.groupId = Number(req.query.group_id);
  if (req.query.status) filters.status = req.query.status;
  return success(res, await service.listOptions(filters));
}

export async function createOption(req, res) {
  return created(res, await service.createOption(req.user, req.body || {}));
}

export async function updateOption(req, res) {
  return success(res, await service.updateOption(req.user, req.params.id, req.body || {}));
}

export async function getCategorySpecifications(req, res) {
  return success(res, await service.getCategorySpecifications(req.params.categoryId));
}

export async function saveCategorySpecifications(req, res) {
  return success(res, await service.saveCategorySpecifications(req.user, req.params.categoryId, req.body || {}));
}

export async function presetCategorySpecifications(req, res) {
  return success(res, await service.presetCategorySpecifications(req.user, req.params.categoryId, req.body || {}));
}

export default {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  listOptions,
  createOption,
  updateOption,
  getCategorySpecifications,
  saveCategorySpecifications,
  presetCategorySpecifications,
};
