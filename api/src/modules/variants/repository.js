import db from '../../db/knex.js';

export async function findById(id) {
  return db('product_variants').where({ id }).whereNull('deleted_at').first();
}

export async function findBySku(sku) {
  return db('product_variants').where({ sku }).whereNull('deleted_at').first();
}

export async function findByProductAndHash(productId, optionHash) {
  return db('product_variants')
    .where({ product_id: productId, option_hash: optionHash })
    .whereNull('deleted_at')
    .first();
}

export async function listByProduct(productId, { status } = {}) {
  let q = db('product_variants').where({ product_id: productId }).whereNull('deleted_at');
  if (status) q = q.where({ status });
  return q.orderBy('id', 'asc');
}

export async function getOptionIds(variantId) {
  const rows = await db('variant_option_values').where({ variant_id: variantId }).select('option_id');
  return rows.map((r) => r.option_id);
}

export async function getVariantOptionsDetail(variantId) {
  return db('variant_option_values as vov')
    .join('specification_options as o', 'o.id', 'vov.option_id')
    .join('specification_groups as g', 'g.id', 'o.group_id')
    .where('vov.variant_id', variantId)
    .select(
      'o.id as option_id',
      'o.code as option_code',
      'o.name as option_name',
      'o.metadata',
      'g.id as group_id',
      'g.code as group_code',
      'g.name as group_name'
    )
    .orderBy('g.sort_order', 'asc');
}

export async function createVariant(data, optionIds, trx = db) {
  const [id] = await trx('product_variants').insert({
    product_id: data.product_id,
    sku: data.sku,
    barcode: data.barcode ?? null,
    price: data.price,
    compare_at_price: data.compare_at_price ?? null,
    cost_price: data.cost_price ?? null,
    status: data.status || 'active',
    weight_grams: data.weight_grams ?? null,
    option_hash: data.option_hash,
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });

  if (optionIds.length) {
    await trx('variant_option_values').insert(
      optionIds.map((option_id) => ({
        variant_id: id,
        option_id,
      }))
    );
  }

  // Ensure inventory row exists
  await trx('inventory').insert({
    variant_id: id,
    quantity: data.initial_stock ?? 0,
    reserved_quantity: 0,
    low_stock_threshold: data.low_stock_threshold ?? 5,
    updated_at: trx.fn.now(),
  });

  if ((data.initial_stock ?? 0) > 0) {
    await trx('inventory_ledger').insert({
      variant_id: id,
      change_type: 'adjustment',
      quantity_delta: data.initial_stock,
      quantity_after: data.initial_stock,
      reference_type: 'variant_create',
      reason: 'Initial stock on variant create',
      created_at: trx.fn.now(),
    });
  }

  return findById(id);
}

export async function updateVariant(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'sku',
    'barcode',
    'price',
    'compare_at_price',
    'cost_price',
    'status',
    'weight_grams',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await db('product_variants').where({ id }).update(patch);
  return findById(id);
}

export async function softDeleteVariant(id) {
  await db('product_variants').where({ id }).update({
    deleted_at: db.fn.now(),
    status: 'inactive',
    updated_at: db.fn.now(),
  });
}

export async function getInventory(variantId) {
  return db('inventory').where({ variant_id: variantId }).first();
}

export default {
  findById,
  findBySku,
  findByProductAndHash,
  listByProduct,
  getOptionIds,
  getVariantOptionsDetail,
  createVariant,
  updateVariant,
  softDeleteVariant,
  getInventory,
};
