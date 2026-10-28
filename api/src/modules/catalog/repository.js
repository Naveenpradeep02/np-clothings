/**
 * Catalog repository — categories & brands (full CRUD).
 */

import db from '../../db/knex.js';

// ---------- Categories ----------

export async function listCategories({
  limit = 20,
  offset = 0,
  parentId,
  status = 'active',
  includeDeleted = false,
  search,
} = {}) {
  let q = db('categories');
  if (!includeDeleted) q = q.whereNull('deleted_at');
  if (status && status !== 'all') q = q.where({ status });
  if (parentId !== undefined) {
    q = parentId === null ? q.whereNull('parent_id') : q.where({ parent_id: parentId });
  }
  if (search) {
    q = q.where((b) => {
      b.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`);
    });
  }

  const rows = await q
    .clone()
    .orderBy('sort_order', 'asc')
    .orderBy('id', 'asc')
    .limit(limit)
    .offset(offset);

  let countQ = db('categories');
  if (!includeDeleted) countQ = countQ.whereNull('deleted_at');
  if (status && status !== 'all') countQ = countQ.where({ status });
  if (parentId !== undefined) {
    countQ =
      parentId === null ? countQ.whereNull('parent_id') : countQ.where({ parent_id: parentId });
  }
  if (search) {
    countQ = countQ.where((b) => {
      b.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function findCategoryById(id, { includeDeleted = false } = {}) {
  let q = db('categories').where({ id });
  if (!includeDeleted) q = q.whereNull('deleted_at');
  return q.first();
}

export async function findCategoryBySlug(slug) {
  return db('categories').where({ slug }).whereNull('deleted_at').first();
}

export async function createCategory(data) {
  const [id] = await db('categories').insert({
    parent_id: data.parent_id ?? null,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    sort_order: data.sort_order ?? 0,
    status: data.status ?? 'active',
    seo_title: data.seo_title ?? null,
    seo_description: data.seo_description ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findCategoryById(id);
}

export async function updateCategory(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'parent_id',
    'name',
    'slug',
    'description',
    'image_url',
    'sort_order',
    'status',
    'seo_title',
    'seo_description',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await db('categories').where({ id }).update(patch);
  return findCategoryById(id, { includeDeleted: true });
}

export async function softDeleteCategory(id) {
  await db('categories').where({ id }).update({
    deleted_at: db.fn.now(),
    status: 'inactive',
    updated_at: db.fn.now(),
  });
}

export async function countChildCategories(parentId) {
  const [{ total }] = await db('categories')
    .where({ parent_id: parentId })
    .whereNull('deleted_at')
    .count({ total: '*' });
  return Number(total);
}

export async function countProductsInCategory(categoryId) {
  const [{ total }] = await db('products')
    .where({ category_id: categoryId })
    .whereNull('deleted_at')
    .count({ total: '*' });
  return Number(total);
}

export async function listAllActiveCategories() {
  return db('categories')
    .whereNull('deleted_at')
    .where({ status: 'active' })
    .orderBy('sort_order', 'asc')
    .select('id', 'parent_id', 'name', 'slug', 'sort_order', 'image_url');
}

// ---------- Brands ----------

export async function listBrands({
  limit = 20,
  offset = 0,
  status = 'active',
  includeDeleted = false,
  search,
} = {}) {
  let q = db('brands');
  if (!includeDeleted) q = q.whereNull('deleted_at');
  if (status && status !== 'all') q = q.where({ status });
  if (search) {
    q = q.where((b) => {
      b.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`);
    });
  }

  const rows = await q
    .clone()
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc')
    .limit(limit)
    .offset(offset);

  let countQ = db('brands');
  if (!includeDeleted) countQ = countQ.whereNull('deleted_at');
  if (status && status !== 'all') countQ = countQ.where({ status });
  if (search) {
    countQ = countQ.where((b) => {
      b.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`);
    });
  }
  const [{ total }] = await countQ.count({ total: '*' });
  return { rows, total: Number(total) };
}

export async function findBrandById(id, { includeDeleted = false } = {}) {
  let q = db('brands').where({ id });
  if (!includeDeleted) q = q.whereNull('deleted_at');
  return q.first();
}

export async function findBrandBySlug(slug) {
  return db('brands').where({ slug }).whereNull('deleted_at').first();
}

export async function findBrandByName(name) {
  return db('brands').where({ name }).whereNull('deleted_at').first();
}

export async function createBrand(data) {
  const [id] = await db('brands').insert({
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    logo_url: data.logo_url ?? null,
    website_url: data.website_url ?? null,
    sort_order: data.sort_order ?? 0,
    status: data.status ?? 'active',
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findBrandById(id);
}

export async function updateBrand(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'name',
    'slug',
    'description',
    'logo_url',
    'website_url',
    'sort_order',
    'status',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await db('brands').where({ id }).update(patch);
  return findBrandById(id, { includeDeleted: true });
}

export async function softDeleteBrand(id) {
  await db('brands').where({ id }).update({
    deleted_at: db.fn.now(),
    status: 'inactive',
    updated_at: db.fn.now(),
  });
}

export async function countProductsForBrand(brandId) {
  const [{ total }] = await db('products')
    .where({ brand_id: brandId })
    .whereNull('deleted_at')
    .count({ total: '*' });
  return Number(total);
}

export default {
  listCategories,
  findCategoryById,
  findCategoryBySlug,
  createCategory,
  updateCategory,
  softDeleteCategory,
  countChildCategories,
  countProductsInCategory,
  listAllActiveCategories,
  listBrands,
  findBrandById,
  findBrandBySlug,
  findBrandByName,
  createBrand,
  updateBrand,
  softDeleteBrand,
  countProductsForBrand,
};
