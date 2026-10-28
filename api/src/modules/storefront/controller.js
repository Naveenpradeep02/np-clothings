import * as service from './service.js';
import { success } from '../../lib/response.js';

export async function listProducts(req, res) {
  const data = await service.listProducts(req.query, {
    userId: req.user?.id,
    sessionId: req.headers['x-session-id'],
  });
  return success(res, data.items, data.meta);
}

export async function facets(req, res) {
  return success(res, await service.getFacets());
}

export default { listProducts, facets };
