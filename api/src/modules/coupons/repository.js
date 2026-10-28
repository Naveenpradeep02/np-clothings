import db from '../../db/knex.js';

export async function findById(id) {
  return db('coupons').where({ id }).first();
}

export async function findByCode(code) {
  return db('coupons').where({ code: String(code).toUpperCase() }).first();
}

export async function list({ status, limit = 20, offset = 0, search } = {}) {
  let q = db('coupons');
  if (status) q = q.where({ status });
  if (search) {
    q = q.where((b) => {
      b.whereILike('code', `%${search}%`).orWhereILike('name', `%${search}%`);
    });
  }
  const rows = await q.clone().orderBy('created_at', 'desc').limit(limit).offset(offset);
  let countQ = db('coupons');
  if (status) countQ = countQ.where({ status });
  if (search) {
    countQ = countQ.where((b) => {
      b.whereILike('code', `%${search}%`).orWhereILike('name', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function create(data) {
  const [id] = await db('coupons').insert({
    code: data.code,
    name: data.name,
    description: data.description ?? null,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    min_order_value: data.min_order_value ?? null,
    max_discount: data.max_discount ?? null,
    usage_limit: data.usage_limit ?? null,
    per_customer_limit: data.per_customer_limit ?? null,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    status: data.status || 'active',
    created_by: data.created_by ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findById(id);
}

export async function update(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'name',
    'description',
    'discount_type',
    'discount_value',
    'min_order_value',
    'max_discount',
    'usage_limit',
    'per_customer_limit',
    'starts_at',
    'ends_at',
    'status',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await db('coupons').where({ id }).update(patch);
  return findById(id);
}

export async function getRules(couponId) {
  return db('coupon_rules').where({ coupon_id: couponId });
}

export async function setRules(couponId, rules) {
  await db.transaction(async (trx) => {
    await trx('coupon_rules').where({ coupon_id: couponId }).del();
    if (rules.length) {
      await trx('coupon_rules').insert(
        rules.map((r) => ({
          coupon_id: couponId,
          rule_type: r.rule_type,
          reference_id: r.reference_id,
        }))
      );
    }
  });
}

export async function redemptionStats(couponId) {
  const [{ total }] = await db('coupon_redemptions')
    .where({ coupon_id: couponId })
    .count({ total: '*' });
  const [{ sum }] = await db('coupon_redemptions')
    .where({ coupon_id: couponId })
    .sum({ sum: 'discount_amount' });
  return {
    redemptions: Number(total) || 0,
    total_discount: Number(sum) || 0,
  };
}

export async function listRedemptions(couponId, { limit = 20, offset = 0 } = {}) {
  const rows = await db('coupon_redemptions as cr')
    .leftJoin('orders as o', 'o.id', 'cr.order_id')
    .where('cr.coupon_id', couponId)
    .select('cr.*', 'o.order_number')
    .orderBy('cr.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db('coupon_redemptions')
    .where({ coupon_id: couponId })
    .count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function listActivePublic() {
  const now = new Date();
  return db('coupons')
    .where({ status: 'active' })
    .where('starts_at', '<=', now)
    .where('ends_at', '>=', now)
    .select(
      'code',
      'name',
      'description',
      'discount_type',
      'discount_value',
      'min_order_value',
      'max_discount',
      'ends_at'
    )
    .orderBy('ends_at', 'asc')
    .limit(20);
}

export default {
  findById,
  findByCode,
  list,
  create,
  update,
  getRules,
  setRules,
  redemptionStats,
  listRedemptions,
  listActivePublic,
};
