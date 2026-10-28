import * as service from './service.js';
import { success, created } from '../../lib/response.js';

export async function list(req, res) {
  return success(res, await service.list(req.user.id));
}

export async function add(req, res) {
  return created(res, await service.add(req.user.id, req.body || {}));
}

export async function remove(req, res) {
  return success(res, await service.remove(req.user.id, req.params.id));
}

export default { list, add, remove };
