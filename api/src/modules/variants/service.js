/**
 * Variant engine — option_hash resolution, create/update sellable combinations.
 */

import * as repo from './repository.js';
import { computeOptionHash } from '../../lib/optionHash.js';
import { validateOptionSet } from '../specifications/service.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import db from '../../db/knex.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`variants.${fn} failed`, err);
  if (err.code === 'ER_DUP_ENTRY' || /duplicate/i.test(err.message || '')) {
    throw new ConflictError('SKU or option combination already exists for this product');
  }
  throw new ServiceUnavailableError('Variants temporarily unavailable');
}

export async function getVariant(id) {
  try {
    const row = await repo.findById(id);
    if (!row) throw new NotFoundError('Variant not found');
    const options = await repo.getVariantOptionsDetail(id);
    const inventory = await repo.getInventory(id);
    return {
      ...row,
      options,
      inventory: inventory
        ? {
            quantity: inventory.quantity,
            reserved_quantity: inventory.reserved_quantity,
            available: inventory.quantity - inventory.reserved_quantity,
            low_stock_threshold: inventory.low_stock_threshold,
          }
        : null,
    };
  } catch (err) {
    wrap('getVariant', err);
  }
}

export async function listProductVariants(productId, { status } = {}) {
  try {
    const rows = await repo.listByProduct(productId, { status });
    const detailed = [];
    for (const row of rows) {
      const options = await repo.getVariantOptionsDetail(row.id);
      const inventory = await repo.getInventory(row.id);
      detailed.push({
        ...row,
        options,
        inventory: inventory
          ? {
              quantity: inventory.quantity,
              reserved_quantity: inventory.reserved_quantity,
              available: inventory.quantity - inventory.reserved_quantity,
            }
          : null,
      });
    }
    return detailed;
  } catch (err) {
    wrap('listProductVariants', err);
  }
}

/**
 * Resolve a sellable variant from product + option IDs.
 * Used by cart/PDP: given choices, return the matching SKU/price/stock.
 */
export async function resolveVariant(productId, optionIds) {
  try {
    if (!productId) throw new BadRequestError('product_id is required');
    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      throw new BadRequestError('option_ids must be a non-empty array');
    }

    // Validate options exist & one per group
    await validateOptionSet(optionIds);

    const hash = computeOptionHash(optionIds);
    const variant = await repo.findByProductAndHash(productId, hash);
    if (!variant) {
      throw new NotFoundError('No sellable variant matches this option combination');
    }
    if (variant.status !== 'active') {
      throw new NotFoundError('Variant is not available');
    }

    return getVariant(variant.id);
  } catch (err) {
    wrap('resolveVariant', err);
  }
}

/**
 * Preview hash without DB write (admin tooling / frontend validation).
 */
export function previewHash(optionIds) {
  return {
    option_ids: [...new Set(optionIds.map(Number))].sort((a, b) => a - b),
    option_hash: computeOptionHash(optionIds),
  };
}

/**
 * Create a sellable variant for a product.
 * Body: { product_id, sku, price, option_ids[], initial_stock?, ... }
 */
export async function createVariant(actor, body) {
  try {
    const productId = Number(body.product_id);
    if (!productId) throw new BadRequestError('product_id is required');
    if (!body.sku?.trim()) throw new BadRequestError('sku is required');
    if (body.price === undefined || body.price === null || Number(body.price) < 0) {
      throw new BadRequestError('price must be a non-negative number');
    }
    if (!Array.isArray(body.option_ids) || body.option_ids.length === 0) {
      throw new BadRequestError('option_ids is required');
    }

    const product = await db('products').where({ id: productId }).whereNull('deleted_at').first();
    if (!product) throw new BadRequestError('product_id does not exist');

    // Load product required groups
    const requiredGroups = await db('product_specification_groups')
      .where({ product_id: productId, is_required: true })
      .select('group_id');

    // Optionally restrict to product-allowed options
    const allowed = await db('product_specification_options')
      .where({ product_id: productId })
      .select('option_id');
    if (allowed.length) {
      const allowedSet = new Set(allowed.map((a) => Number(a.option_id)));
      for (const oid of body.option_ids) {
        if (!allowedSet.has(Number(oid))) {
          throw new BadRequestError(`Option ${oid} is not enabled for this product`);
        }
      }
    }

    const options = await validateOptionSet(body.option_ids, {
      requiredGroupIds: requiredGroups.map((g) => g.group_id),
    });

    const optionIds = options.map((o) => o.id);
    const option_hash = computeOptionHash(optionIds);

    if (await repo.findByProductAndHash(productId, option_hash)) {
      throw new ConflictError('This option combination already exists for the product');
    }
    if (await repo.findBySku(body.sku.trim())) {
      throw new ConflictError(`SKU already exists: ${body.sku.trim()}`);
    }

    const variant = await db.transaction(async (trx) => {
      return repo.createVariant(
        {
          product_id: productId,
          sku: body.sku.trim(),
          barcode: body.barcode ?? null,
          price: Number(body.price),
          compare_at_price:
            body.compare_at_price != null ? Number(body.compare_at_price) : null,
          cost_price: body.cost_price != null ? Number(body.cost_price) : null,
          status: body.status || 'active',
          weight_grams: body.weight_grams != null ? Number(body.weight_grams) : null,
          option_hash,
          initial_stock: body.initial_stock != null ? Number(body.initial_stock) : 0,
          low_stock_threshold:
            body.low_stock_threshold != null ? Number(body.low_stock_threshold) : 5,
        },
        optionIds,
        trx
      );
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'variant.created',
      entityType: 'product_variant',
      entityId: variant.id,
      newValues: { sku: variant.sku, product_id: productId, option_hash },
    });

    return getVariant(variant.id);
  } catch (err) {
    wrap('createVariant', err);
  }
}

export async function updateVariant(actor, id, body) {
  try {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Variant not found');

    const patch = {};
    if (body.sku !== undefined) {
      if (!String(body.sku).trim()) throw new BadRequestError('sku cannot be empty');
      const clash = await repo.findBySku(String(body.sku).trim());
      if (clash && Number(clash.id) !== Number(id)) {
        throw new ConflictError(`SKU already exists: ${body.sku}`);
      }
      patch.sku = String(body.sku).trim();
    }
    if (body.price !== undefined) {
      if (Number(body.price) < 0) throw new BadRequestError('price must be non-negative');
      patch.price = Number(body.price);
    }
    if (body.compare_at_price !== undefined) {
      patch.compare_at_price =
        body.compare_at_price === null ? null : Number(body.compare_at_price);
    }
    if (body.cost_price !== undefined) {
      patch.cost_price = body.cost_price === null ? null : Number(body.cost_price);
    }
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        throw new BadRequestError('status must be active or inactive');
      }
      patch.status = body.status;
    }
    if (body.barcode !== undefined) patch.barcode = body.barcode;
    if (body.weight_grams !== undefined) patch.weight_grams = Number(body.weight_grams) || null;

    // option_ids are immutable after create (would change option_hash / historical orders)
    if (body.option_ids !== undefined) {
      throw new BadRequestError(
        'option_ids cannot be changed after create — create a new variant instead'
      );
    }

    const row = await repo.updateVariant(id, patch);
    await writeAudit({
      actorId: actor?.id,
      action: 'variant.updated',
      entityType: 'product_variant',
      entityId: Number(id),
      oldValues: { sku: current.sku, price: current.price, status: current.status },
      newValues: patch,
    });
    return getVariant(row.id);
  } catch (err) {
    wrap('updateVariant', err);
  }
}

export async function deleteVariant(actor, id) {
  try {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError('Variant not found');
    await repo.softDeleteVariant(id);
    await writeAudit({
      actorId: actor?.id,
      action: 'variant.deleted',
      entityType: 'product_variant',
      entityId: Number(id),
      oldValues: { sku: current.sku },
    });
    return { id: Number(id), deleted: true };
  } catch (err) {
    wrap('deleteVariant', err);
  }
}

export default {
  getVariant,
  listProductVariants,
  resolveVariant,
  previewHash,
  createVariant,
  updateVariant,
  deleteVariant,
};
