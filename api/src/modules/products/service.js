/**
 * Product service — parent product lifecycle, images, specs, publish.
 */

import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import { slugify } from '../catalog/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import db from '../../db/knex.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`products.${fn} failed`, err);
  if (err.code === 'ER_DUP_ENTRY' || /duplicate/i.test(err.message || '')) {
    throw new ConflictError('Product slug already exists');
  }
  throw new ServiceUnavailableError('Products temporarily unavailable');
}

async function assertCategory(categoryId) {
  const cat = await db('categories').where({ id: categoryId }).whereNull('deleted_at').first();
  if (!cat) throw new BadRequestError('category_id does not exist');
  return cat;
}

async function assertBrand(brandId) {
  if (brandId == null) return null;
  const brand = await db('brands').where({ id: brandId }).whereNull('deleted_at').first();
  if (!brand) throw new BadRequestError('brand_id does not exist');
  return brand;
}

export async function listProducts(pagination, filters = {}) {
  try {
    return await repo.listProducts({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      featured: filters.featured,
      search: filters.search,
    });
  } catch (err) {
    wrap('listProducts', err);
  }
}

export async function getProduct(idOrSlug, { forAdmin = false } = {}) {
  try {
    let row;
    if (/^\d+$/.test(String(idOrSlug))) {
      row = await repo.findById(idOrSlug);
    } else {
      row = await repo.findBySlug(idOrSlug);
      if (row) row = await repo.findById(row.id);
    }
    if (!row) throw new NotFoundError('Product not found');
    if (!forAdmin && row.status !== 'published') {
      throw new NotFoundError('Product not found');
    }

    const [images, groups, options, variantCount] = await Promise.all([
      repo.listImages(row.id),
      repo.getProductGroups(row.id),
      repo.getProductOptions(row.id),
      repo.countActiveVariants(row.id),
    ]);

    // Group options under groups for PDP
    const optionsByGroup = {};
    for (const o of options) {
      if (!optionsByGroup[o.group_id]) optionsByGroup[o.group_id] = [];
      optionsByGroup[o.group_id].push(o);
    }
    const specifications = groups.map((g) => ({
      ...g,
      options: optionsByGroup[g.id] || [],
    }));

    return {
      ...row,
      images,
      specifications,
      active_variant_count: variantCount,
    };
  } catch (err) {
    wrap('getProduct', err);
  }
}

export async function createProduct(actor, body) {
  try {
    if (!body?.name?.trim()) throw new BadRequestError('name is required');
    if (!body?.category_id) throw new BadRequestError('category_id is required');

    await assertCategory(body.category_id);
    await assertBrand(body.brand_id);

    const name = body.name.trim();
    const slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) throw new BadRequestError('Invalid slug');
    if (await repo.findBySlug(slug)) {
      throw new ConflictError(`Slug already in use: ${slug}`);
    }

    const status = body.status || 'draft';
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestError('status must be draft, published, or archived');
    }
    if (status === 'published' && !actorPermissionsInclude(actor, 'products:publish')) {
      // allow if they have products:write and we're not strict — require publish perm
      throw new ForbiddenError('Missing permission: products:publish');
    }

    const row = await repo.createProduct({
      category_id: Number(body.category_id),
      brand_id: body.brand_id != null ? Number(body.brand_id) : null,
      name,
      slug,
      description: body.description ?? null,
      short_description: body.short_description ?? null,
      design_pattern: body.design_pattern ?? null,
      base_material: body.base_material ?? null,
      status,
      is_featured: Boolean(body.is_featured),
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      seo_keywords: body.seo_keywords ?? null,
      published_at: status === 'published' ? new Date() : null,
      created_by: actor?.id,
      updated_by: actor?.id,
    });

    // Optional initial spec assignment
    if (Array.isArray(body.specification_group_ids) && body.specification_group_ids.length) {
      await repo.setProductGroups(
        row.id,
        body.specification_group_ids.map((gid, i) => ({
          group_id: Number(gid),
          sort_order: i,
          is_required: true,
        }))
      );
    }
    if (Array.isArray(body.specification_option_ids) && body.specification_option_ids.length) {
      await repo.setProductOptions(
        row.id,
        body.specification_option_ids.map(Number)
      );
    }

    await writeAudit({
      actorId: actor?.id,
      action: 'product.created',
      entityType: 'product',
      entityId: row.id,
      newValues: { name, slug, status },
    });

    return getProduct(row.id, { forAdmin: true });
  } catch (err) {
    wrap('createProduct', err);
  }
}

function actorPermissionsInclude(actor, code) {
  if (!actor) return false;
  const perms = actor.permissions || [];
  // super_admin effectively has all via seed, but check list
  return perms.includes(code) || perms.includes('products:write');
}

export async function updateProduct(actor, id, body) {
  try {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Product not found');

    const patch = { updated_by: actor?.id };

    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new BadRequestError('name cannot be empty');
      patch.name = String(body.name).trim();
    }
    if (body.slug !== undefined) {
      patch.slug = slugify(body.slug);
      if (!patch.slug) throw new BadRequestError('Invalid slug');
      const clash = await repo.findBySlug(patch.slug);
      if (clash && Number(clash.id) !== Number(id)) {
        throw new ConflictError(`Slug already in use: ${patch.slug}`);
      }
    }
    if (body.category_id !== undefined) {
      await assertCategory(body.category_id);
      patch.category_id = Number(body.category_id);
    }
    if (body.brand_id !== undefined) {
      if (body.brand_id === null || body.brand_id === '') {
        patch.brand_id = null;
      } else {
        await assertBrand(body.brand_id);
        patch.brand_id = Number(body.brand_id);
      }
    }
    for (const key of [
      'description',
      'short_description',
      'design_pattern',
      'base_material',
      'seo_title',
      'seo_description',
      'seo_keywords',
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.is_featured !== undefined) patch.is_featured = Boolean(body.is_featured);

    if (body.status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(body.status)) {
        throw new BadRequestError('status must be draft, published, or archived');
      }
      if (body.status === 'published' && current.status !== 'published') {
        if (!actorPermissionsInclude(actor, 'products:publish')) {
          throw new ForbiddenError('Missing permission: products:publish');
        }
        patch.published_at = new Date();
      }
      patch.status = body.status;
    }

    await repo.updateProduct(id, patch);

    await writeAudit({
      actorId: actor?.id,
      action: 'product.updated',
      entityType: 'product',
      entityId: Number(id),
      oldValues: { name: current.name, status: current.status },
      newValues: patch,
    });

    return getProduct(id, { forAdmin: true });
  } catch (err) {
    wrap('updateProduct', err);
  }
}

export async function publishProduct(actor, id) {
  return updateProduct(actor, id, { status: 'published' });
}

export async function deleteProduct(actor, id) {
  try {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Product not found');

    const variants = await repo.countActiveVariants(id);
    // Soft-delete allowed even with variants; they become unreachable from storefront
    await repo.softDeleteProduct(id);

    await writeAudit({
      actorId: actor?.id,
      action: 'product.deleted',
      entityType: 'product',
      entityId: Number(id),
      oldValues: { name: current.name, slug: current.slug, active_variants: variants },
    });

    return { id: Number(id), deleted: true };
  } catch (err) {
    wrap('deleteProduct', err);
  }
}

export async function addImage(actor, productId, body) {
  try {
    const product = await repo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (!body?.url?.trim()) throw new BadRequestError('url is required');

    const image = await repo.addImage(productId, {
      url: body.url.trim(),
      alt_text: body.alt_text ?? null,
      sort_order: Number(body.sort_order) || 0,
      is_primary: Boolean(body.is_primary),
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'product.image_added',
      entityType: 'product',
      entityId: Number(productId),
      newValues: { image_id: image.id, url: image.url },
    });

    return image;
  } catch (err) {
    wrap('addImage', err);
  }
}

export async function removeImage(actor, productId, imageId) {
  try {
    const product = await repo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    const deleted = await repo.deleteImage(productId, imageId);
    if (!deleted) throw new NotFoundError('Image not found');

    await writeAudit({
      actorId: actor?.id,
      action: 'product.image_removed',
      entityType: 'product',
      entityId: Number(productId),
      oldValues: { image_id: Number(imageId) },
    });

    return { deleted: true };
  } catch (err) {
    wrap('removeImage', err);
  }
}

export async function updateImage(actor, productId, imageId, body) {
  try {
    const product = await repo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    const image = await repo.updateImage(productId, imageId, body);
    if (!image) throw new NotFoundError('Image not found');

    await writeAudit({
      actorId: actor?.id,
      action: 'product.image_updated',
      entityType: 'product',
      entityId: Number(productId),
      newValues: { image_id: Number(imageId), ...body },
    });

    return image;
  } catch (err) {
    wrap('updateImage', err);
  }
}

/**
 * Assign which specification groups apply to this product.
 * body: { groups: [{ group_id, is_required?, sort_order? }] }
 */
export async function assignGroups(actor, productId, body) {
  try {
    const product = await repo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const groups = body?.groups;
    if (!Array.isArray(groups)) throw new BadRequestError('groups must be an array');

    for (const g of groups) {
      const exists = await db('specification_groups').where({ id: g.group_id }).first();
      if (!exists) throw new BadRequestError(`group_id ${g.group_id} does not exist`);
    }

    await repo.setProductGroups(
      productId,
      groups.map((g, i) => ({
        group_id: Number(g.group_id),
        sort_order: g.sort_order ?? i,
        is_required: g.is_required !== false,
      }))
    );

    await writeAudit({
      actorId: actor?.id,
      action: 'product.specs_assigned',
      entityType: 'product',
      entityId: Number(productId),
      newValues: { groups },
    });

    return getProduct(productId, { forAdmin: true });
  } catch (err) {
    wrap('assignGroups', err);
  }
}

/**
 * Assign which options are available for this product.
 * body: { option_ids: number[] }
 */
export async function assignOptions(actor, productId, body) {
  try {
    const product = await repo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const optionIds = body?.option_ids;
    if (!Array.isArray(optionIds)) throw new BadRequestError('option_ids must be an array');

    if (optionIds.length) {
      const found = await db('specification_options').whereIn('id', optionIds).select('id');
      if (found.length !== optionIds.length) {
        throw new BadRequestError('One or more option_ids are invalid');
      }
    }

    await repo.setProductOptions(productId, optionIds.map(Number));

    await writeAudit({
      actorId: actor?.id,
      action: 'product.options_assigned',
      entityType: 'product',
      entityId: Number(productId),
      newValues: { option_ids: optionIds },
    });

    return getProduct(productId, { forAdmin: true });
  } catch (err) {
    wrap('assignOptions', err);
  }
}

export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  publishProduct,
  deleteProduct,
  addImage,
  removeImage,
  assignGroups,
  assignOptions,
};
