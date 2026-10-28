/**
 * Support tickets — create, reply, assign, status.
 */

import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`support.${fn} failed`, err);
  throw new ServiceUnavailableError('Support temporarily unavailable');
}

function ticketNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TKT-${ts}-${r}`;
}

async function hydrate(ticket, { includeInternal = false } = {}) {
  const messages = await repo.listMessages(ticket.id, { includeInternal });
  return { ...ticket, messages };
}

export async function createTicket(userId, body, { isEmployee = false } = {}) {
  try {
    if (!body?.subject?.trim()) throw new BadRequestError('subject is required');
    if (!body?.body?.trim()) throw new BadRequestError('body is required');

    const priority = body.priority || 'medium';
    if (!PRIORITIES.includes(priority)) {
      throw new BadRequestError(`priority must be one of: ${PRIORITIES.join(', ')}`);
    }

    const ticket = await db.transaction(async (trx) => {
      const row = await repo.createTicket(
        {
          ticket_number: ticketNumber(),
          user_id: userId,
          order_id: body.order_id ? Number(body.order_id) : null,
          subject: body.subject.trim(),
          priority,
          channel: body.channel || 'web',
          status: 'open',
        },
        trx
      );
      await repo.insertMessage(
        {
          ticket_id: row.id,
          sender_id: userId,
          sender_type: isEmployee ? 'employee' : 'customer',
          body: body.body.trim(),
          is_internal: false,
        },
        trx
      );
      return row;
    });

    await writeAudit({
      actorId: userId,
      action: 'support.ticket_created',
      entityType: 'support_ticket',
      entityId: ticket.id,
      newValues: { subject: ticket.subject, ticket_number: ticket.ticket_number },
    });

    return hydrate(ticket, { includeInternal: isEmployee });
  } catch (err) {
    wrap('createTicket', err);
  }
}

export async function getTicket(id, userId, { admin = false } = {}) {
  try {
    const ticket = await repo.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (!admin && Number(ticket.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your ticket');
    }
    return hydrate(ticket, { includeInternal: admin });
  } catch (err) {
    wrap('getTicket', err);
  }
}

export async function listMyTickets(userId, pagination) {
  try {
    return await repo.listByUser(userId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (err) {
    wrap('listMyTickets', err);
  }
}

export async function listTicketsAdmin(pagination, filters = {}) {
  try {
    return await repo.listAll({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      priority: filters.priority,
      assignedTo: filters.assignedTo,
    });
  } catch (err) {
    wrap('listTicketsAdmin', err);
  }
}

export async function reply(userId, ticketId, body, { isEmployee = false } = {}) {
  try {
    if (!body?.body?.trim()) throw new BadRequestError('body is required');
    const ticket = await repo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');

    if (!isEmployee && Number(ticket.user_id) !== Number(userId)) {
      throw new ForbiddenError('Not your ticket');
    }

    const is_internal = Boolean(body.is_internal) && isEmployee;
    if (is_internal && !isEmployee) {
      throw new ForbiddenError('Only staff can post internal notes');
    }

    const msg = await repo.insertMessage({
      ticket_id: ticketId,
      sender_id: userId,
      sender_type: isEmployee ? 'employee' : 'customer',
      body: body.body.trim(),
      is_internal,
    });

    // Auto status nudge
    if (!is_internal) {
      if (isEmployee && ticket.status === 'open') {
        await repo.updateTicket(ticketId, { status: 'in_progress' });
      } else if (isEmployee) {
        await repo.updateTicket(ticketId, { status: 'waiting_customer' });
      } else if (ticket.status === 'waiting_customer') {
        await repo.updateTicket(ticketId, { status: 'in_progress' });
      }
    }

    return hydrate(await repo.findById(ticketId), { includeInternal: isEmployee });
  } catch (err) {
    wrap('reply', err);
  }
}

export async function updateTicket(actor, ticketId, body) {
  try {
    const ticket = await repo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');

    const patch = {};
    if (body.status !== undefined) {
      if (!TICKET_STATUSES.includes(body.status)) {
        throw new BadRequestError(`status must be one of: ${TICKET_STATUSES.join(', ')}`);
      }
      patch.status = body.status;
      if (body.status === 'closed' || body.status === 'resolved') {
        patch.closed_at = new Date();
      }
    }
    if (body.priority !== undefined) {
      if (!PRIORITIES.includes(body.priority)) {
        throw new BadRequestError(`priority must be one of: ${PRIORITIES.join(', ')}`);
      }
      patch.priority = body.priority;
    }
    if (body.assigned_to !== undefined) {
      patch.assigned_to = body.assigned_to ? Number(body.assigned_to) : null;
    }

    const updated = await repo.updateTicket(ticketId, patch);

    await writeAudit({
      actorId: actor?.id,
      action: 'support.ticket_updated',
      entityType: 'support_ticket',
      entityId: Number(ticketId),
      oldValues: {
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to,
      },
      newValues: patch,
    });

    return hydrate(updated, { includeInternal: true });
  } catch (err) {
    wrap('updateTicket', err);
  }
}

export default {
  createTicket,
  getTicket,
  listMyTickets,
  listTicketsAdmin,
  reply,
  updateTicket,
};
