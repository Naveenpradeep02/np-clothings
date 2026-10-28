import db from '../../db/knex.js';

export async function createTicket(data, trx = db) {
  const [id] = await trx('support_tickets').insert({
    ticket_number: data.ticket_number,
    user_id: data.user_id,
    order_id: data.order_id ?? null,
    subject: data.subject,
    status: data.status || 'open',
    priority: data.priority || 'medium',
    assigned_to: data.assigned_to ?? null,
    channel: data.channel || 'web',
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
  return trx('support_tickets').where({ id }).first();
}

export async function findById(id) {
  return db('support_tickets').where({ id }).first();
}

export async function findByNumber(ticketNumber) {
  return db('support_tickets').where({ ticket_number: ticketNumber }).first();
}

export async function listByUser(userId, { limit = 20, offset = 0 } = {}) {
  const rows = await db('support_tickets')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db('support_tickets').where({ user_id: userId }).count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function listAll({ limit = 20, offset = 0, status, priority, assignedTo } = {}) {
  let q = db('support_tickets');
  if (status) q = q.where({ status });
  if (priority) q = q.where({ priority });
  if (assignedTo) q = q.where({ assigned_to: assignedTo });
  const rows = await q.clone().orderBy('created_at', 'desc').limit(limit).offset(offset);
  let countQ = db('support_tickets');
  if (status) countQ = countQ.where({ status });
  if (priority) countQ = countQ.where({ priority });
  if (assignedTo) countQ = countQ.where({ assigned_to: assignedTo });
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function updateTicket(id, patch, trx = db) {
  const data = { updated_at: trx.fn.now() };
  for (const key of ['status', 'priority', 'assigned_to', 'subject', 'closed_at']) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  await trx('support_tickets').where({ id }).update(data);
  return trx('support_tickets').where({ id }).first();
}

export async function insertMessage(data, trx = db) {
  const [id] = await trx('support_messages').insert({
    ticket_id: data.ticket_id,
    sender_id: data.sender_id,
    sender_type: data.sender_type,
    body: data.body,
    is_internal: Boolean(data.is_internal),
    created_at: trx.fn.now(),
  });
  return trx('support_messages').where({ id }).first();
}

export async function listMessages(ticketId, { includeInternal = false } = {}) {
  let q = db('support_messages').where({ ticket_id: ticketId });
  if (!includeInternal) q = q.where({ is_internal: false });
  return q.orderBy('created_at', 'asc');
}

export default {
  createTicket,
  findById,
  findByNumber,
  listByUser,
  listAll,
  updateTicket,
  insertMessage,
  listMessages,
};
