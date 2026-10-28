import db from '../../db/knex.js';

export async function listPublishedSections(page = 'home') {
  const now = new Date();
  return db('cms_sections')
    .where({ page, status: 'published' })
    .where(function () {
      this.whereNull('starts_at').orWhere('starts_at', '<=', now);
    })
    .where(function () {
      this.whereNull('ends_at').orWhere('ends_at', '>=', now);
    })
    .orderBy('sort_order', 'asc')
    .orderBy('id', 'asc');
}

export async function getBanners(sectionId) {
  return db('cms_banners')
    .where({ section_id: sectionId })
    .orderBy('sort_order', 'asc');
}

export async function getSectionProductIds(sectionId) {
  return db('cms_section_products')
    .where({ section_id: sectionId })
    .orderBy('sort_order', 'asc')
    .select('product_id', 'sort_order');
}

export async function listAdminSections(page = 'home') {
  return db('cms_sections').where({ page }).orderBy('sort_order', 'asc').orderBy('id', 'asc');
}

export async function findSection(id) {
  return db('cms_sections').where({ id }).first();
}

export async function createSection(data) {
  const [id] = await db('cms_sections').insert({
    page: data.page || 'home',
    section_type: data.section_type,
    title: data.title ?? null,
    subtitle: data.subtitle ?? null,
    config: data.config ? JSON.stringify(data.config) : null,
    sort_order: data.sort_order ?? 0,
    status: data.status || 'draft',
    starts_at: data.starts_at ?? null,
    ends_at: data.ends_at ?? null,
    created_by: data.created_by ?? null,
    updated_by: data.updated_by ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findSection(id);
}

export async function updateSection(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of [
    'title',
    'subtitle',
    'sort_order',
    'status',
    'starts_at',
    'ends_at',
    'updated_by',
    'page',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  if (data.config !== undefined) {
    patch.config = data.config ? JSON.stringify(data.config) : null;
  }
  if (data.section_type !== undefined) patch.section_type = data.section_type;
  await db('cms_sections').where({ id }).update(patch);
  return findSection(id);
}

export async function deleteSection(id) {
  // banners & section products cascade via FK
  return db('cms_sections').where({ id }).del();
}

export async function addBanner(sectionId, data) {
  const [id] = await db('cms_banners').insert({
    section_id: sectionId,
    image_url: data.image_url,
    mobile_image_url: data.mobile_image_url ?? null,
    alt_text: data.alt_text ?? null,
    link_url: data.link_url ?? null,
    link_text: data.link_text ?? null,
    sort_order: data.sort_order ?? 0,
    created_at: db.fn.now(),
  });
  return db('cms_banners').where({ id }).first();
}

export async function findBanner(id) {
  return db('cms_banners').where({ id }).first();
}

export async function updateBanner(id, data) {
  const patch = {};
  for (const key of [
    'image_url',
    'mobile_image_url',
    'alt_text',
    'link_url',
    'link_text',
    'sort_order',
  ]) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  if (Object.keys(patch).length) {
    await db('cms_banners').where({ id }).update(patch);
  }
  return findBanner(id);
}

export async function deleteBanner(id) {
  return db('cms_banners').where({ id }).del();
}

export async function setSectionProducts(sectionId, productIds) {
  await db.transaction(async (trx) => {
    await trx('cms_section_products').where({ section_id: sectionId }).del();
    if (productIds.length) {
      await trx('cms_section_products').insert(
        productIds.map((product_id, i) => ({
          section_id: sectionId,
          product_id: Number(product_id),
          sort_order: i,
        }))
      );
    }
  });
}

export async function reorderSections(page, orderedIds) {
  await db.transaction(async (trx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await trx('cms_sections')
        .where({ id: orderedIds[i], page })
        .update({ sort_order: i, updated_at: trx.fn.now() });
    }
  });
}

export default {
  listPublishedSections,
  getBanners,
  getSectionProductIds,
  listAdminSections,
  findSection,
  createSection,
  updateSection,
  deleteSection,
  addBanner,
  findBanner,
  updateBanner,
  deleteBanner,
  setSectionProducts,
  reorderSections,
};
