import * as service from './service.js';
import { success, created } from '../../lib/response.js';
import { parsePagination, paginationMeta } from '../../lib/pagination.js';

export async function create(req, res) {
  const isEmployee = req.user?.user_type === 'employee';
  return created(
    res,
    await service.createTicket(req.user.id, req.body || {}, { isEmployee })
  );
}

export async function listMine(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listMyTickets(req.user.id, pagination);
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function listAdmin(req, res) {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listTicketsAdmin(pagination, {
    status: req.query.status,
    priority: req.query.priority,
    assignedTo: req.query.assigned_to ? Number(req.query.assigned_to) : undefined,
  });
  return success(res, rows, paginationMeta({ ...pagination, total }));
}

export async function get(req, res) {
  const admin = req.user?.user_type === 'employee';
  return success(res, await service.getTicket(req.params.id, req.user.id, { admin }));
}

export async function reply(req, res) {
  const isEmployee = req.user?.user_type === 'employee';
  return success(
    res,
    await service.reply(req.user.id, req.params.id, req.body || {}, { isEmployee })
  );
}

export async function update(req, res) {
  return success(res, await service.updateTicket(req.user, req.params.id, req.body || {}));
}

export default { create, listMine, listAdmin, get, reply, update };
