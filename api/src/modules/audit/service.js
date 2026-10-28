/**
 * Audit log service — record sensitive administrative actions.
 */

import db from '../../db/knex.js';
import logger from '../../lib/logger.js';

/**
 * @param {object} entry
 * @param {number|null} entry.actorId
 * @param {string} entry.action - e.g. employee.provisioned, role.assigned
 * @param {string} entry.entityType
 * @param {number|null} [entry.entityId]
 * @param {object} [entry.oldValues]
 * @param {object} [entry.newValues]
 * @param {string} [entry.ip]
 * @param {string} [entry.userAgent]
 */
export async function writeAudit(entry) {
  try {
    await db('audit_logs').insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      old_values: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      new_values: entry.newValues ? JSON.stringify(entry.newValues) : null,
      ip_address: entry.ip || null,
      user_agent: entry.userAgent || null,
      created_at: db.fn.now(),
    });
  } catch (err) {
    // Never fail the main request because audit write failed — log loudly
    logger.error('Failed to write audit log', err);
  }
}

export async function listAuditLogs({ limit = 50, offset = 0, actorId, entityType, action } = {}) {
  let q = db('audit_logs').select('*');
  if (actorId) q = q.where({ actor_id: actorId });
  if (entityType) q = q.where({ entity_type: entityType });
  if (action) q = q.where({ action });
  const rows = await q.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const countQ = db('audit_logs');
  if (actorId) countQ.where({ actor_id: actorId });
  if (entityType) countQ.where({ entity_type: entityType });
  if (action) countQ.where({ action });
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export default { writeAudit, listAuditLogs };
