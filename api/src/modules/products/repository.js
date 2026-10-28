/**
 * Products repository — parent products, images, spec assignment.
 */

import db from '../../db/knex.js';

export async function listProducts({
  limit = 20,
  offset = 0,
  status = 'published',
  categoryId,
  brandId,
  featured,
  search,
  includeDeleted = false,
} = {}) {
  let q = db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .leftJoin('brands as b', 'b.id', 'p.brand_id')
    .select(
      'p.*',
      'c.name as category_name',
      'c.slug as category_slug',
      'b.name as brand_name',
      'b.slug as brand_slug'
    );

  if (!includeDeleted) q = q.whereNull('p.deleted_at');
  if (status && status !== 'all') q = q.where('p.status', status);
  if (categoryId) {
    if (Array.isArray(categoryId)) q = q.whereIn('p.category_id', categoryId);
    else q = q.where('p.category_id', categoryId);
  }
  if (brandId) q = q.where('p.brand_id', brandId);
  if (featured === true || featured === 'true') q = q.where('p.is_featured', true);
  if (search) {
    q = q.where((bldr) => {
      bldr
        .whereILike('p.name', `%${search}%`)
        .orWhereILike('p.slug', `%${search}%`)
        .orWhereILike('p.short_description', `%${search}%`);
    });
  }

  const rows = await q
    .clone()
    .orderBy('p.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQ = db('products as p');
  if (!includeDeleted) countQ = countQ.whereNull('p.deleted_at');
  if (status && status !== 'all') countQ = countQ.where('p.status', status);
  if (categoryId) {
    if (Array.isArray(categoryId)) countQ = countQ.whereIn('p.category_id', categoryId);
    else countQ = countQ.where('p.category_id', categoryId);
  }
  if (brandId) countQ = countQ.where('p.brand_id', brandId);
  if (featured === true || featured === 'true') countQ = countQ.where('p.is_featured', true);
  if (search) {
    countQ = countQ.where((bldr) => {
      bldr
        .whereILike('p.name', `%${search}%`)
        .orWhereILike('p.slug', `%${search}%`)
        .orWhereILike('p.short_description', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function findById(id, { includeDeleted = false } = {}) {
  let q = db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .leftJoin('brands as b', 'b.id', 'p.brand_id')
    .where('p.id', id)
    .select(
      'p.*',
      'c.name as category_name',
      'c.slug as category_slug',
      'b.name as brand_name',
      'b.slug as brand_slug'
    );
  if (!includeDeleted) q = q.whereNull('p.deleted_at');
  return q.first();
}

export async function findBySlug(slug) {
  return db('products').where({ slug }).whereNull('deleted_at').first();
}

export async function createProduct(data) {
  const [id] = await db('products').insert({
    category_id: data.category_id,
    brand_id: data.brand_id ?? null,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    short_description: data.short_description ?? null,
    design_pattern: data.design_pattern ?? null,
    base_material: data.base_material ?? null,
    status: data.status || 'draft',
    is_featured: Boolean(data.is_featured),
    seo_title: data.seo_title ?? null,
    seo_description: data.seo_description ?? null,
    seo_keywords: data.seo_keywords ?? null,
    published_at: data.published_at ?? null,
    created_by: data.created_by ?? null,
    updated_by: data.updated_by ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findById(id);
}

export async function updateProduct(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'category_id',
    'brand_id',
    'name',
    'slug',
    'description',
    'short_description',
    'design_pattern',
    'base_material',
    'status',
    'is_featured',
    'seo_title',
    'seo_description',
    'seo_keywords',
    'published_at',
    'updated_by',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await db('products').where({ id }).update(patch);
  return findById(id, { includeDeleted: true });
}

export async function softDeleteProduct(id) {
  await db('products').where({ id }).update({
    deleted_at: db.fn.now(),
    status: 'archived',
    updated_at: db.fn.now(),
  });
}

// ----- Images -----
export async function listImages(productId) {
  return db('product_images')
    .where({ product_id: productId })
    .orderBy('sort_order', 'asc')
    .orderBy('id', 'asc');
}

export async function addImage(productId, data) {
  if (data.is_primary) {
    await db('product_images').where({ product_id: productId }).update({ is_primary: false });
  }
  const [id] = await db('product_images').insert({
    product_id: productId,
    url: data.url,
    alt_text: data.alt_text ?? null,
    sort_order: data.sort_order ?? 0,
    is_primary: Boolean(data.is_primary),
    created_at: db.fn.now(),
  });
  return db('product_images').where({ id }).first();
}

export async function deleteImage(productId, imageId) {
  return db('product_images').where({ id: imageId, product_id: productId }).del();
}

export async function updateImage(productId, imageId, data) {
  if (data.is_primary) {
    await db('product_images').where({ product_id: productId }).update({ is_primary: false });
  }
  const patch = {};
  if (data.alt_text !== undefined) patch.alt_text = data.alt_text;
  if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
  if (data.is_primary !== undefined) patch.is_primary = Boolean(data.is_primary);
  if (data.url !== undefined) patch.url = data.url;

  await db('product_images').where({ id: imageId, product_id: productId }).update(patch);
  return db('product_images').where({ id: imageId }).first();
}

// ----- Spec assignment -----
export async function getProductGroups(productId) {
  return db('product_specification_groups as psg')
    .join('specification_groups as g', 'g.id', 'psg.group_id')
    .where('psg.product_id', productId)
    .select('g.id', 'g.code', 'g.name', 'g.input_type', 'psg.sort_order', 'psg.is_required')
    .orderBy('psg.sort_order', 'asc');
}

export async function getProductOptions(productId) {
  return db('product_specification_options as pso')
    .join('specification_options as o', 'o.id', 'pso.option_id')
    .join('specification_groups as g', 'g.id', 'o.group_id')
    .where('pso.product_id', productId)
    .select(
      'o.id',
      'o.code',
      'o.name',
      'o.metadata',
      'o.status',
      'g.id as group_id',
      'g.code as group_code',
      'g.name as group_name'
    )
    .orderBy('g.sort_order', 'asc')
    .orderBy('o.sort_order', 'asc');
}

export async function setProductGroups(productId, groups) {
  // groups: [{ group_id, sort_order?, is_required? }]
  await db.transaction(async (trx) => {
    await trx('product_specification_groups').where({ product_id: productId }).del();
    if (groups.length) {
      await trx('product_specification_groups').insert(
        groups.map((g, i) => ({
          product_id: productId,
          group_id: g.group_id,
          sort_order: g.sort_order ?? i,
          is_required: g.is_required !== false,
        }))
      );
    }
  });
}

export async function setProductOptions(productId, optionIds) {
  await db.transaction(async (trx) => {
    await trx('product_specification_options').where({ product_id: productId }).del();
    if (optionIds.length) {
      await trx('product_specification_options').insert(
        optionIds.map((option_id) => ({
          product_id: productId,
          option_id,
        }))
      );
    }
  });
}

export async function countActiveVariants(productId) {
  const [{ total }] = await db('product_variants')
    .where({ product_id: productId, status: 'active' })
    .whereNull('deleted_at')
    .count({ total: '*' });
  return Number(total);
}

export default {
  listProducts,
  findById,
  findBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
  listImages,
  addImage,
  deleteImage,
  getProductGroups,
  getProductOptions,
  setProductGroups,
  setProductOptions,
  countActiveVariants,
};
