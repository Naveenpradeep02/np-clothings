import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function listTemplates(req, res) {
  return success(res, await service.listTemplates());
}

export async function upsertTemplate(req, res) {
  return created(res, await service.upsertTemplate(req.body || {}));
}

export async function send(req, res) {
  const log = await service.send({
    code: req.body?.code,
    channel: req.body?.channel,
    recipient: req.body?.recipient,
    vars: req.body?.vars || {},
    userId: req.body?.user_id || req.user?.id,
    orderId: req.body?.order_id,
  });
  return success(res, log);
}

export async function listLogs(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listLogs(pagination, {
    channel: req.query.channel,
    status: req.query.status,
    orderId: req.query.order_id ? Number(req.query.order_id) : undefined,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function seedTemplates(req, res) {
  await service.ensureDefaultTemplates();
  return success(res, await service.listTemplates());
}

export default { listTemplates, upsertTemplate, send, listLogs, seedTemplates };
