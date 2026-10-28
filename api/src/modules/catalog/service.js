/**
 * Catalog service — categories & brands business rules.
 */

import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

function wrapDb(fnName, err) {
  if (err instanceof AppError) throw err;
  logger.error(`catalog.${fnName} failed`, err);
  // Duplicate key
  if (err.code === 'ER_DUP_ENTRY' || /duplicate/i.test(err.message || '')) {
    throw new ConflictError('A record with this slug or name already exists');
  }
  throw new ServiceUnavailableError('Catalog temporarily unavailable');
}

// ---------- Categories ----------

export async function getCategories(pagination, filters = {}) {
  try {
    return await repo.listCategories({
      limit: pagination.limit,
      offset: pagination.offset,
      parentId: filters.parentId,
      status: filters.status ?? 'active',
      includeDeleted: filters.includeDeleted === true,
      search: filters.search,
    });
  } catch (err) {
    wrapDb('getCategories', err);
  }
}

export async function getCategory(id) {
  try {
    const row = await repo.findCategoryById(id);
    if (!row) throw new NotFoundError('Category not found');
    return row;
  } catch (err) {
    wrapDb('getCategory', err);
  }
}

export async function getCategoryTree() {
  try {
    const rows = await repo.listAllActiveCategories();
    const byParent = new Map();
    for (const r of rows) {
      const key = r.parent_id ?? 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push({ ...r, children: [] });
    }
    function attach(node) {
      const kids = byParent.get(node.id) || [];
      node.children = kids.map(attach);
      return node;
    }
    return (byParent.get(0) || []).map(attach);
  } catch (err) {
    wrapDb('getCategoryTree', err);
  }
}

export async function createCategory(actor, body) {
  try {
    if (!body?.name || !String(body.name).trim()) {
      throw new BadRequestError('name is required');
    }
    const name = String(body.name).trim();
    let slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) throw new BadRequestError('Invalid slug');

    const existing = await repo.findCategoryBySlug(slug);
    if (existing) throw new ConflictError(`Slug already in use: ${slug}`);

    if (body.parent_id != null) {
      const parent = await repo.findCategoryById(body.parent_id);
      if (!parent) throw new BadRequestError('parent_id does not exist');
    }

    if (body.status && !['active', 'inactive'].includes(body.status)) {
      throw new BadRequestError('status must be active or inactive');
    }

    const row = await repo.createCategory({
      parent_id: body.parent_id ?? null,
      name,
      slug,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      sort_order: Number(body.sort_order) || 0,
      status: body.status || 'active',
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'category.created',
      entityType: 'category',
      entityId: row.id,
      newValues: { name, slug },
    });

    return row;
  } catch (err) {
    wrapDb('createCategory', err);
  }
}

export async function updateCategory(actor, id, body) {
  try {
    const current = await repo.findCategoryById(id);
    if (!current) throw new NotFoundError('Category not found');

    const patch = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new BadRequestError('name cannot be empty');
      patch.name = String(body.name).trim();
    }
    if (body.slug !== undefined) {
      patch.slug = slugify(body.slug);
      if (!patch.slug) throw new BadRequestError('Invalid slug');
      const clash = await repo.findCategoryBySlug(patch.slug);
      if (clash && Number(clash.id) !== Number(id)) {
        throw new ConflictError(`Slug already in use: ${patch.slug}`);
      }
    }
    if (body.parent_id !== undefined) {
      if (body.parent_id === null || body.parent_id === '') {
        patch.parent_id = null;
      } else {
        if (Number(body.parent_id) === Number(id)) {
          throw new BadRequestError('Category cannot be its own parent');
        }
        const parent = await repo.findCategoryById(body.parent_id);
        if (!parent) throw new BadRequestError('parent_id does not exist');
        patch.parent_id = Number(body.parent_id);
      }
    }
    for (const key of ['description', 'image_url', 'seo_title', 'seo_description']) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        throw new BadRequestError('status must be active or inactive');
      }
      patch.status = body.status;
    }

    const row = await repo.updateCategory(id, patch);

    await writeAudit({
      actorId: actor?.id,
      action: 'category.updated',
      entityType: 'category',
      entityId: Number(id),
      oldValues: { name: current.name, slug: current.slug, status: current.status },
      newValues: patch,
    });

    return row;
  } catch (err) {
    wrapDb('updateCategory', err);
  }
}

export async function deleteCategory(actor, id) {
  try {
    const current = await repo.findCategoryById(id);
    if (!current) throw new NotFoundError('Category not found');

    const children = await repo.countChildCategories(id);
    if (children > 0) {
      throw new BadRequestError(`Category has ${children} child categories — reassign or delete them first`);
    }
    const products = await repo.countProductsInCategory(id);
    if (products > 0) {
      throw new BadRequestError(`Category has ${products} products — reassign them first`);
    }

    await repo.softDeleteCategory(id);

    await writeAudit({
      actorId: actor?.id,
      action: 'category.deleted',
      entityType: 'category',
      entityId: Number(id),
      oldValues: { name: current.name, slug: current.slug },
    });

    return { id: Number(id), deleted: true };
  } catch (err) {
    wrapDb('deleteCategory', err);
  }
}

// ---------- Brands ----------

export async function getBrands(pagination, filters = {}) {
  try {
    return await repo.listBrands({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status ?? 'active',
      includeDeleted: filters.includeDeleted === true,
      search: filters.search,
    });
  } catch (err) {
    wrapDb('getBrands', err);
  }
}

export async function getBrand(id) {
  try {
    const row = await repo.findBrandById(id);
    if (!row) throw new NotFoundError('Brand not found');
    return row;
  } catch (err) {
    wrapDb('getBrand', err);
  }
}

export async function createBrand(actor, body) {
  try {
    if (!body?.name || !String(body.name).trim()) {
      throw new BadRequestError('name is required');
    }
    const name = String(body.name).trim();
    let slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) throw new BadRequestError('Invalid slug');

    if (await repo.findBrandBySlug(slug)) {
      throw new ConflictError(`Slug already in use: ${slug}`);
    }
    if (await repo.findBrandByName(name)) {
      throw new ConflictError(`Brand name already exists: ${name}`);
    }

    if (body.status && !['active', 'inactive'].includes(body.status)) {
      throw new BadRequestError('status must be active or inactive');
    }

    const row = await repo.createBrand({
      name,
      slug,
      description: body.description ?? null,
      logo_url: body.logo_url ?? null,
      website_url: body.website_url ?? null,
      sort_order: Number(body.sort_order) || 0,
      status: body.status || 'active',
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'brand.created',
      entityType: 'brand',
      entityId: row.id,
      newValues: { name, slug },
    });

    return row;
  } catch (err) {
    wrapDb('createBrand', err);
  }
}

export async function updateBrand(actor, id, body) {
  try {
    const current = await repo.findBrandById(id);
    if (!current) throw new NotFoundError('Brand not found');

    const patch = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new BadRequestError('name cannot be empty');
      patch.name = String(body.name).trim();
      const clash = await repo.findBrandByName(patch.name);
      if (clash && Number(clash.id) !== Number(id)) {
        throw new ConflictError(`Brand name already exists: ${patch.name}`);
      }
    }
    if (body.slug !== undefined) {
      patch.slug = slugify(body.slug);
      if (!patch.slug) throw new BadRequestError('Invalid slug');
      const clash = await repo.findBrandBySlug(patch.slug);
      if (clash && Number(clash.id) !== Number(id)) {
        throw new ConflictError(`Slug already in use: ${patch.slug}`);
      }
    }
    for (const key of ['description', 'logo_url', 'website_url']) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        throw new BadRequestError('status must be active or inactive');
      }
      patch.status = body.status;
    }

    const row = await repo.updateBrand(id, patch);

    await writeAudit({
      actorId: actor?.id,
      action: 'brand.updated',
      entityType: 'brand',
      entityId: Number(id),
      oldValues: { name: current.name, slug: current.slug, status: current.status },
      newValues: patch,
    });

    return row;
  } catch (err) {
    wrapDb('updateBrand', err);
  }
}

export async function deleteBrand(actor, id) {
  try {
    const current = await repo.findBrandById(id);
    if (!current) throw new NotFoundError('Brand not found');

    const products = await repo.countProductsForBrand(id);
    if (products > 0) {
      throw new BadRequestError(`Brand has ${products} products — reassign them first`);
    }

    await repo.softDeleteBrand(id);

    await writeAudit({
      actorId: actor?.id,
      action: 'brand.deleted',
      entityType: 'brand',
      entityId: Number(id),
      oldValues: { name: current.name, slug: current.slug },
    });

    return { id: Number(id), deleted: true };
  } catch (err) {
    wrapDb('deleteBrand', err);
  }
}

export default {
  slugify,
  getCategories,
  getCategory,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
