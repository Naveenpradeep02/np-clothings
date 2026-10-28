/**
 * Notification dispatch — template render + SMS/WhatsApp providers + logs.
 * Credentials never leave the API process.
 */

import * as repo from './repository.js';
import { getSmsProvider, getWhatsAppProvider } from '../../services/notification/index.js';
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';
import { renderTemplate } from '../../lib/templateRender.js';
export { renderTemplate };

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`notifications.${fn} failed`, err);
  throw new ServiceUnavailableError('Notifications temporarily unavailable');
}

export async function send({
  code,
  channel,
  recipient,
  vars = {},
  userId = null,
  orderId = null,
}) {
  try {
    if (!code || !channel || !recipient) {
      throw new BadRequestError('code, channel, and recipient are required');
    }
    if (!['sms', 'whatsapp', 'email'].includes(channel)) {
      throw new BadRequestError('channel must be sms, whatsapp, or email');
    }

    const template = await repo.findTemplate(code, channel);
    if (!template) {
      throw new NotFoundError(`No active template for ${code}/${channel}`);
    }

    const body = renderTemplate(template.body_template, vars);
    const subject = template.subject
      ? renderTemplate(template.subject, vars)
      : null;

    const log = await repo.insertLog({
      template_id: template.id,
      channel,
      recipient,
      user_id: userId,
      order_id: orderId,
      status: 'queued',
      payload: { vars, body, subject },
    });

    try {
      let result;
      if (channel === 'sms') {
        result = await getSmsProvider().send({ to: recipient, body });
      } else if (channel === 'whatsapp') {
        result = await getWhatsAppProvider().send({ to: recipient, body });
      } else {
        // email stub
        result = {
          success: true,
          providerMessageId: `email_stub_${log.id}`,
          raw: { subject, body },
        };
      }

      const updated = await repo.updateLog(log.id, {
        status: 'sent',
        provider_message_id: result.providerMessageId,
        sent_at: new Date(),
        payload: { vars, body, subject, provider: result.raw },
      });

      logger.info('Notification sent', {
        logId: log.id,
        channel,
        code,
        recipient: recipient.slice(-4),
      });

      return updated;
    } catch (sendErr) {
      await repo.updateLog(log.id, {
        status: 'failed',
        error_message: String(sendErr.message || sendErr).slice(0, 500),
      });
      throw sendErr;
    }
  } catch (err) {
    wrap('send', err);
  }
}

/**
 * Order lifecycle helpers.
 */
export async function notifyOrderEvent(event, order, customer = {}) {
  const phone = customer.phone || order.shipping_address?.phone;
  if (!phone) {
    logger.warn('No phone for order notification', { orderId: order.id, event });
    return null;
  }

  const vars = {
    order_number: order.order_number,
    customer_name: customer.full_name || order.shipping_address?.full_name || 'Customer',
    grand_total: String(order.grand_total),
    status: order.status,
    tracking_number: order.tracking_number || '',
  };

  const codeMap = {
    placed: 'order_placed',
    confirmed: 'order_confirmed',
    shipped: 'order_shipped',
    delivered: 'order_delivered',
    cancelled: 'order_cancelled',
  };

  const code = codeMap[event];
  if (!code) return null;

  const results = [];
  for (const channel of ['sms', 'whatsapp']) {
    try {
      // Skip if template missing — don't fail the order flow
      const tpl = await repo.findTemplate(code, channel);
      if (!tpl) continue;
      const log = await send({
        code,
        channel,
        recipient: phone,
        vars,
        userId: order.user_id,
        orderId: order.id,
      });
      results.push(log);
    } catch (err) {
      logger.error('Order notification failed', {
        event,
        channel,
        orderId: order.id,
        error: err.message,
      });
    }
  }
  return results;
}

export async function listTemplates() {
  try {
    return await repo.listTemplates();
  } catch (err) {
    wrap('listTemplates', err);
  }
}

export async function upsertTemplate(body) {
  try {
    if (!body?.code || !body?.channel || !body?.body_template || !body?.name) {
      throw new BadRequestError('code, channel, name, body_template required');
    }
    return await repo.upsertTemplate(body);
  } catch (err) {
    wrap('upsertTemplate', err);
  }
}

export async function listLogs(pagination, filters = {}) {
  try {
    return await repo.listLogs({
      limit: pagination.limit,
      offset: pagination.offset,
      channel: filters.channel,
      status: filters.status,
      orderId: filters.orderId,
    });
  } catch (err) {
    wrap('listLogs', err);
  }
}

/**
 * Seed default templates if empty.
 */
export async function ensureDefaultTemplates() {
  const defaults = [
    {
      code: 'order_placed',
      channel: 'sms',
      name: 'Order Placed SMS',
      body_template:
        'Hi {{customer_name}}, your AUREA order {{order_number}} for ₹{{grand_total}} is placed. We will confirm shortly.',
    },
    {
      code: 'order_confirmed',
      channel: 'sms',
      name: 'Order Confirmed SMS',
      body_template:
        'AUREA: Order {{order_number}} is confirmed. Total ₹{{grand_total}}. Thank you for shopping with us.',
    },
    {
      code: 'order_shipped',
      channel: 'sms',
      name: 'Order Shipped SMS',
      body_template:
        'AUREA: Order {{order_number}} has shipped. Track: {{tracking_number}}',
    },
    {
      code: 'order_delivered',
      channel: 'sms',
      name: 'Order Delivered SMS',
      body_template:
        'AUREA: Order {{order_number}} was delivered. We hope you love it.',
    },
    {
      code: 'order_cancelled',
      channel: 'sms',
      name: 'Order Cancelled SMS',
      body_template:
        'AUREA: Order {{order_number}} has been cancelled. Contact support if you need help.',
    },
    {
      code: 'order_placed',
      channel: 'whatsapp',
      name: 'Order Placed WhatsApp',
      body_template:
        'Hello {{customer_name}} 👋 Your AUREA order *{{order_number}}* (₹{{grand_total}}) is placed. We will update you when confirmed.',
    },
    {
      code: 'order_confirmed',
      channel: 'whatsapp',
      name: 'Order Confirmed WhatsApp',
      body_template:
        '✅ Order *{{order_number}}* is confirmed. Total ₹{{grand_total}}. — AUREA',
    },
    {
      code: 'order_shipped',
      channel: 'whatsapp',
      name: 'Order Shipped WhatsApp',
      body_template:
        '📦 Order *{{order_number}}* is on the way. Tracking: {{tracking_number}}',
    },
  ];

  for (const t of defaults) {
    try {
      const existing = await repo.findTemplate(t.code, t.channel);
      if (!existing) await repo.upsertTemplate(t);
    } catch (err) {
      logger.warn('Template seed skipped', { code: t.code, error: err.message });
    }
  }
}

export default {
  renderTemplate,
  send,
  notifyOrderEvent,
  listTemplates,
  upsertTemplate,
  listLogs,
  ensureDefaultTemplates,
};
