import * as repo from './repository.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`wishlist.${fn} failed`, err);
  throw new ServiceUnavailableError('Wishlist temporarily unavailable');
}

export async function list(userId) {
  try {
    return await repo.listByUser(userId);
  } catch (err) {
    wrap('list', err);
  }
}

export async function add(userId, { product_id, variant_id }) {
  try {
    const productId = Number(product_id);
    if (!Number.isFinite(productId)) throw new BadRequestError('product_id is required');
    const product = await db('products').where({ id: productId }).whereNull('deleted_at').first();
    if (!product) throw new NotFoundError('Product not found');
    let variantId = variant_id != null ? Number(variant_id) : null;
    if (variantId != null) {
      const v = await db('product_variants')
        .where({ id: variantId, product_id: productId })
        .first();
      if (!v) throw new NotFoundError('Variant not found for product');
    }
    return await repo.add({ userId, productId, variantId });
  } catch (err) {
    wrap('add', err);
  }
}

export async function remove(userId, id) {
  try {
    const n = await repo.remove(userId, id);
    if (!n) throw new NotFoundError('Wishlist item not found');
    return { removed: true };
  } catch (err) {
    wrap('remove', err);
  }
}

export default { list, add, remove };
