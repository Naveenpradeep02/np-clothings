/**
 * Coupons — validation (cart) + admin CRUD + marketing listing.
 */

import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`coupons.${fn} failed`, err);
  if (err.code === 'ER_DUP_ENTRY' || /duplicate/i.test(err.message || '')) {
    throw new ConflictError('Coupon code already exists');
  }
  throw new ServiceUnavailableError('Coupons temporarily unavailable');
}

export async function findActiveCoupon(code) {
  const coupon = await repo.findByCode(code);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.status !== 'active') throw new BadRequestError('Coupon is not active');
  const now = new Date();
  if (new Date(coupon.starts_at) > now) throw new BadRequestError('Coupon not yet valid');
  if (new Date(coupon.ends_at) < now) throw new BadRequestError('Coupon has expired');
  return coupon;
}

export async function calculateDiscount(coupon, subtotal) {
  const sub = Number(subtotal);
  if (coupon.min_order_value != null && sub < Number(coupon.min_order_value)) {
    throw new BadRequestError(
      `Minimum order value ₹${Number(coupon.min_order_value).toLocaleString('en-IN')} required`
    );
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (sub * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount != null) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    discount = Number(coupon.discount_value);
  }
  discount = Math.min(discount, sub);
  return Math.round(discount * 100) / 100;
}

export async function countRedemptions(couponId, userId) {
  const [{ total }] = await db('coupon_redemptions')
    .where({ coupon_id: couponId })
    .count({ total: '*' });
  const global = Number(total);
  let perUser = 0;
  if (userId) {
    const [{ total: u }] = await db('coupon_redemptions')
      .where({ coupon_id: couponId, user_id: userId })
      .count({ total: '*' });
    perUser = Number(u);
  }
  return { global, perUser };
}

export async function assertRedeemable(coupon, userId) {
  const { global, perUser } = await countRedemptions(coupon.id, userId);
  if (coupon.usage_limit != null && global >= coupon.usage_limit) {
    throw new BadRequestError('Coupon usage limit reached');
  }
  if (coupon.per_customer_limit != null && userId && perUser >= coupon.per_customer_limit) {
    throw new BadRequestError('You have already used this coupon the maximum times');
  }
}

/** Preview discount without applying */
export async function validateCode(code, { subtotal = 0, userId } = {}) {
  try {
    const coupon = await findActiveCoupon(code);
    await assertRedeemable(coupon, userId);
    const discount =
      subtotal > 0 ? await calculateDiscount(coupon, subtotal) : null;
    return {
      valid: true,
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_order_value: coupon.min_order_value != null ? Number(coupon.min_order_value) : null,
      max_discount: coupon.max_discount != null ? Number(coupon.max_discount) : null,
      discount_amount: discount,
      ends_at: coupon.ends_at,
    };
  } catch (err) {
    if (err instanceof AppError) {
      return { valid: false, error: err.message };
    }
    wrap('validateCode', err);
  }
}

export async function listPublic() {
  try {
    const rows = await repo.listActivePublic();
    return rows.map((c) => ({
      code: c.code,
      name: c.name,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order_value: c.min_order_value != null ? Number(c.min_order_value) : null,
      ends_at: c.ends_at,
    }));
  } catch (err) {
    wrap('listPublic', err);
  }
}

export async function listAdmin(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.list({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      search: filters.search,
    });
    const enriched = [];
    for (const c of rows) {
      const stats = await repo.redemptionStats(c.id);
      enriched.push({
        ...c,
        discount_value: Number(c.discount_value),
        min_order_value: c.min_order_value != null ? Number(c.min_order_value) : null,
        max_discount: c.max_discount != null ? Number(c.max_discount) : null,
        ...stats,
      });
    }
    return { rows: enriched, total };
  } catch (err) {
    wrap('listAdmin', err);
  }
}

export async function getCoupon(id) {
  try {
    const c = await repo.findById(id);
    if (!c) throw new NotFoundError('Coupon not found');
    const rules = await repo.getRules(id);
    const stats = await repo.redemptionStats(id);
    return {
      ...c,
      discount_value: Number(c.discount_value),
      min_order_value: c.min_order_value != null ? Number(c.min_order_value) : null,
      max_discount: c.max_discount != null ? Number(c.max_discount) : null,
      rules,
      ...stats,
    };
  } catch (err) {
    wrap('getCoupon', err);
  }
}

export async function createCoupon(actor, body) {
  try {
    if (!body?.code?.trim()) throw new BadRequestError('code is required');
    if (!body?.name?.trim()) throw new BadRequestError('name is required');
    if (!['percentage', 'fixed'].includes(body.discount_type)) {
      throw new BadRequestError('discount_type must be percentage or fixed');
    }
    const value = Number(body.discount_value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestError('discount_value must be positive');
    }
    if (body.discount_type === 'percentage' && value > 100) {
      throw new BadRequestError('percentage cannot exceed 100');
    }
    if (!body.starts_at || !body.ends_at) {
      throw new BadRequestError('starts_at and ends_at are required');
    }
    if (new Date(body.starts_at) >= new Date(body.ends_at)) {
      throw new BadRequestError('ends_at must be after starts_at');
    }

    const code = String(body.code).trim().toUpperCase();
    if (await repo.findByCode(code)) {
      throw new ConflictError(`Code already exists: ${code}`);
    }

    const row = await repo.create({
      code,
      name: body.name.trim(),
      description: body.description ?? null,
      discount_type: body.discount_type,
      discount_value: value,
      min_order_value: body.min_order_value != null ? Number(body.min_order_value) : null,
      max_discount: body.max_discount != null ? Number(body.max_discount) : null,
      usage_limit: body.usage_limit != null ? Number(body.usage_limit) : null,
      per_customer_limit:
        body.per_customer_limit != null ? Number(body.per_customer_limit) : null,
      starts_at: new Date(body.starts_at),
      ends_at: new Date(body.ends_at),
      status: body.status || 'active',
      created_by: actor?.id,
    });

    if (Array.isArray(body.rules) && body.rules.length) {
      await repo.setRules(row.id, body.rules);
    }

    await writeAudit({
      actorId: actor?.id,
      action: 'coupon.created',
      entityType: 'coupon',
      entityId: row.id,
      newValues: { code, discount_type: body.discount_type, discount_value: value },
    });

    return getCoupon(row.id);
  } catch (err) {
    wrap('createCoupon', err);
  }
}

export async function updateCoupon(actor, id, body) {
  try {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Coupon not found');

    const patch = { ...body };
    if (patch.discount_type && !['percentage', 'fixed'].includes(patch.discount_type)) {
      throw new BadRequestError('discount_type must be percentage or fixed');
    }
    if (patch.status && !['active', 'inactive', 'expired'].includes(patch.status)) {
      throw new BadRequestError('status must be active, inactive, or expired');
    }
    // code immutable after create
    delete patch.code;

    if (patch.starts_at) patch.starts_at = new Date(patch.starts_at);
    if (patch.ends_at) patch.ends_at = new Date(patch.ends_at);

    const row = await repo.update(id, patch);

    if (Array.isArray(body.rules)) {
      await repo.setRules(id, body.rules);
    }

    await writeAudit({
      actorId: actor?.id,
      action: 'coupon.updated',
      entityType: 'coupon',
      entityId: Number(id),
      newValues: patch,
    });

    return getCoupon(row.id);
  } catch (err) {
    wrap('updateCoupon', err);
  }
}

export async function listRedemptions(id, pagination) {
  try {
    const c = await repo.findById(id);
    if (!c) throw new NotFoundError('Coupon not found');
    return await repo.listRedemptions(id, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (err) {
    wrap('listRedemptions', err);
  }
}

export default {
  findActiveCoupon,
  calculateDiscount,
  countRedemptions,
  assertRedeemable,
  validateCode,
  listPublic,
  listAdmin,
  getCoupon,
  createCoupon,
  updateCoupon,
  listRedemptions,
};
