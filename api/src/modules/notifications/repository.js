import db from '../../db/knex.js';

export async function findTemplate(code, channel) {
  return db('notification_templates')
    .where({ code, channel, status: 'active' })
    .first();
}

export async function listTemplates() {
  return db('notification_templates').orderBy('code').orderBy('channel');
}

export async function upsertTemplate(data) {
  const existing = await db('notification_templates')
    .where({ code: data.code, channel: data.channel })
    .first();
  if (existing) {
    await db('notification_templates').where({ id: existing.id }).update({
      name: data.name,
      subject: data.subject ?? null,
      body_template: data.body_template,
      status: data.status || 'active',
      updated_at: db.fn.now(),
    });
    return db('notification_templates').where({ id: existing.id }).first();
  }
  const [id] = await db('notification_templates').insert({
    code: data.code,
    channel: data.channel,
    name: data.name,
    subject: data.subject ?? null,
    body_template: data.body_template,
    status: data.status || 'active',
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return db('notification_templates').where({ id }).first();
}

export async function insertLog(data) {
  const [id] = await db('notification_logs').insert({
    template_id: data.template_id ?? null,
    channel: data.channel,
    recipient: data.recipient,
    user_id: data.user_id ?? null,
    order_id: data.order_id ?? null,
    status: data.status || 'queued',
    provider_message_id: data.provider_message_id ?? null,
    error_message: data.error_message ?? null,
    payload: data.payload ? JSON.stringify(data.payload) : null,
    sent_at: data.sent_at ?? null,
    created_at: db.fn.now(),
  });
  return db('notification_logs').where({ id }).first();
}

export async function updateLog(id, patch) {
  const data = {};
  for (const key of ['status', 'provider_message_id', 'error_message', 'sent_at']) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  if (patch.payload !== undefined) data.payload = JSON.stringify(patch.payload);
  await db('notification_logs').where({ id }).update(data);
  return db('notification_logs').where({ id }).first();
}

export async function listLogs({ limit = 50, offset = 0, channel, status, orderId } = {}) {
  let q = db('notification_logs');
  if (channel) q = q.where({ channel });
  if (status) q = q.where({ status });
  if (orderId) q = q.where({ order_id: orderId });
  const rows = await q.clone().orderBy('created_at', 'desc').limit(limit).offset(offset);
  let countQ = db('notification_logs');
  if (channel) countQ = countQ.where({ channel });
  if (status) countQ = countQ.where({ status });
  if (orderId) countQ = countQ.where({ order_id: orderId });
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export default {
  findTemplate,
  listTemplates,
  upsertTemplate,
  insertLog,
  updateLog,
  listLogs,
};
