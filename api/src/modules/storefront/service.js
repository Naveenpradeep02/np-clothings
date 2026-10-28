/**
 * Storefront listing — search, filters, pagination, search analytics.
 */

import db from '../../db/knex.js';
import * as productsRepo from '../products/repository.js';
import { parsePagination } from '../../lib/pagination.js';
import logger from '../../lib/logger.js';
import {
  ServiceUnavailableError,
  AppError,
  NotFoundError,
} from '../../lib/errors.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`storefront.${fn} failed`, err);
  throw new ServiceUnavailableError('Storefront temporarily unavailable');
}

async function minPriceForProduct(productId) {
  const row = await db('product_variants')
    .where({ product_id: productId, status: 'active' })
    .whereNull('deleted_at')
    .min('price as min_price')
    .first();
  return row?.min_price != null ? Number(row.min_price) : null;
}

async function logSearch({ query, resultsCount, userId, sessionId, filters }) {
  try {
    await db('search_events').insert({
      user_id: userId || null,
      session_id: sessionId || null,
      query: String(query).slice(0, 255),
      results_count: resultsCount,
      filters: filters ? JSON.stringify(filters) : null,
      created_at: db.fn.now(),
    });
  } catch (err) {
    logger.warn('search_events insert failed', { error: err.message });
  }
}

/**
 * Product listing for shop page.
 * Filters: q, category_id, brand_id, featured, min_price, max_price, sort
 */
export async function listProducts(query, { userId, sessionId } = {}) {
  try {
    const pagination = {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
    };
    pagination.offset = (pagination.page - 1) * pagination.limit;

    let categoryIdFilter = undefined;
    if (query.category_id) {
      const catId = Number(query.category_id);
      const allCats = await db('categories').whereNull('deleted_at').select('id', 'parent_id');
      const ids = [catId];
      const collectChildren = (pid) => {
        allCats.filter((c) => c.parent_id === pid).forEach((c) => {
          ids.push(c.id);
          collectChildren(c.id);
        });
      };
      collectChildren(catId);
      categoryIdFilter = ids;
    }

    const filters = {
      status: 'published',
      categoryId: categoryIdFilter,
      brandId: query.brand_id ? Number(query.brand_id) : undefined,
      featured: query.featured,
      search: query.q || query.search || undefined,
    };

    const { rows, total } = await productsRepo.listProducts({
      limit: pagination.limit,
      offset: pagination.offset,
      ...filters,
    });

    // Enrich with primary image + min price; optional price filter post-query for simplicity
    let items = [];
    for (const p of rows) {
      const images = await productsRepo.listImages(p.id);
      const min_price = await minPriceForProduct(p.id);
      items.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_description: p.short_description,
        category_id: p.category_id,
        category_name: p.category_name,
        brand_id: p.brand_id,
        brand_name: p.brand_name,
        is_featured: p.is_featured,
        min_price,
        primary_image: images.find((i) => i.is_primary) || images[0] || null,
      });
    }

    if (query.min_price != null) {
      const min = Number(query.min_price);
      items = items.filter((i) => i.min_price != null && i.min_price >= min);
    }
    if (query.max_price != null) {
      const max = Number(query.max_price);
      items = items.filter((i) => i.min_price != null && i.min_price <= max);
    }

    const sort = query.sort || 'newest';
    if (sort === 'price_asc') items.sort((a, b) => (a.min_price || 0) - (b.min_price || 0));
    if (sort === 'price_desc') items.sort((a, b) => (b.min_price || 0) - (a.min_price || 0));
    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));

    if (filters.search) {
      await logSearch({
        query: filters.search,
        resultsCount: total,
        userId,
        sessionId,
        filters: {
          category_id: filters.categoryId,
          brand_id: filters.brandId,
          sort,
        },
      });
    }

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
        filters: {
          q: filters.search || null,
          category_id: filters.categoryId || null,
          brand_id: filters.brandId || null,
          featured: filters.featured || null,
          sort,
        },
      },
    };
  } catch (err) {
    wrap('listProducts', err);
  }
}

export async function getFacets() {
  try {
    const categories = await db('categories')
      .whereNull('deleted_at')
      .where({ status: 'active' })
      .orderBy('sort_order', 'asc')
      .select('id', 'name', 'slug', 'parent_id');

    const brands = await db('brands')
      .whereNull('deleted_at')
      .where({ status: 'active' })
      .orderBy('sort_order', 'asc')
      .select('id', 'name', 'slug');

    return { categories, brands };
  } catch (err) {
    wrap('getFacets', err);
  }
}

export default { listProducts, getFacets };
