/**
 * Reviews + product recommendations.
 */

import * as repo from './repository.js';
import * as productsRepo from '../products/repository.js';
import { writeAudit } from '../audit/service.js';
import db from '../../db/knex.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`reviews.${fn} failed`, err);
  throw new ServiceUnavailableError('Reviews temporarily unavailable');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [u, d] = email.split('@');
  return `${u.slice(0, 1)}***@${d}`;
}

async function hydrate(review) {
  const media = await repo.getMedia(review.id);
  return {
    id: review.id,
    product_id: review.product_id,
    variant_id: review.variant_id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    status: review.status,
    is_verified_purchase: Boolean(review.is_verified_purchase),
    created_at: review.created_at,
    author: {
      display_name: review.user_display_name || 'Customer',
      email_masked: maskEmail(review.user_email),
    },
    media,
    product_name: review.product_name,
    product_slug: review.product_slug,
  };
}

export async function createReview(userId, body) {
  try {
    if (!body?.product_id) throw new BadRequestError('product_id is required');
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestError('rating must be an integer from 1 to 5');
    }

    const product = await productsRepo.findById(body.product_id);
    if (!product || product.status !== 'published') {
      throw new NotFoundError('Product not found');
    }

    const existing = await repo.findByUserProduct(userId, body.product_id);
    if (existing) {
      throw new ConflictError('You have already reviewed this product');
    }

    const verified = await repo.findVerifiedOrder(userId, body.product_id);

    const review = await db.transaction(async (trx) => {
      const row = await repo.createReview(
        {
          product_id: Number(body.product_id),
          variant_id: body.variant_id ? Number(body.variant_id) : null,
          user_id: userId,
          order_id: verified?.order_id || body.order_id || null,
          rating,
          title: body.title?.trim() || null,
          body: body.body?.trim() || null,
          status: 'pending',
          is_verified_purchase: Boolean(verified),
        },
        trx
      );
      if (Array.isArray(body.media_urls) && body.media_urls.length) {
        await repo.addMedia(
          row.id,
          body.media_urls.slice(0, 5).map((u) => String(u).slice(0, 512)),
          trx
        );
      }
      return row;
    });

    return hydrate({ ...review, user_display_name: null, user_email: null });
  } catch (err) {
    wrap('createReview', err);
  }
}

export async function listProductReviews(productId, pagination, { status = 'approved' } = {}) {
  try {
    const product = await productsRepo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const { rows, total } = await repo.listByProduct(productId, {
      status,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const summary = await repo.ratingSummary(productId);
    const items = [];
    for (const r of rows) {
      items.push(await hydrate(r));
    }
    return { summary, items, total };
  } catch (err) {
    wrap('listProductReviews', err);
  }
}

export async function listAdmin(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.listAdmin({
      status: filters.status,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const items = [];
    for (const r of rows) {
      items.push(await hydrate(r));
    }
    return { items, total };
  } catch (err) {
    wrap('listAdmin', err);
  }
}

export async function moderate(actor, reviewId, { action, reason }) {
  try {
    if (!['approve', 'reject', 'hide'].includes(action)) {
      throw new BadRequestError('action must be approve, reject, or hide');
    }
    const review = await repo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');

    const statusMap = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
    const status = statusMap[action];

    await db.transaction(async (trx) => {
      await repo.updateStatus(reviewId, status, trx);
      await repo.insertModeration(
        {
          review_id: reviewId,
          action,
          reason: reason || null,
          actor_id: actor.id,
        },
        trx
      );
    });

    await writeAudit({
      actorId: actor.id,
      action: `review.${action}`,
      entityType: 'review',
      entityId: Number(reviewId),
      newValues: { status, reason },
    });

    return hydrate({ ...(await repo.findById(reviewId)) });
  } catch (err) {
    wrap('moderate', err);
  }
}

/**
 * Recommendations for a product:
 * 1. Same category (published)
 * 2. Co-purchased with this product
 * 3. Featured fillers
 */
export async function recommendations(productId, { limit = 8 } = {}) {
  try {
    const product = await productsRepo.findById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const limitN = Math.min(Number(limit) || 8, 24);
    const seen = new Set([Number(productId)]);
    const results = [];

    async function pushProduct(p) {
      if (!p || seen.has(Number(p.id)) || p.status !== 'published') return;
      seen.add(Number(p.id));
      const images = await productsRepo.listImages(p.id);
      const summary = await repo.ratingSummary(p.id);
      results.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_description: p.short_description,
        is_featured: p.is_featured,
        primary_image: images.find((i) => i.is_primary) || images[0] || null,
        rating_average: summary.average,
        rating_count: summary.count,
        reason: p._reason || 'related',
      });
    }

    // Same category
    if (product.category_id) {
      const { rows } = await productsRepo.listProducts({
        limit: limitN,
        offset: 0,
        status: 'published',
        categoryId: product.category_id,
      });
      for (const p of rows) {
        p._reason = 'same_category';
        await pushProduct(p);
        if (results.length >= limitN) break;
      }
    }

    // Co-purchase: orders that contain this product also contain…
    if (results.length < limitN) {
      const co = await db('order_items as a')
        .join('order_items as b', 'b.order_id', 'a.order_id')
        .join('products as p', 'p.id', 'b.product_id')
        .where('a.product_id', productId)
        .whereNot('b.product_id', productId)
        .where('p.status', 'published')
        .whereNull('p.deleted_at')
        .select('p.*')
        .count({ freq: '*' })
        .groupBy('p.id')
        .orderBy('freq', 'desc')
        .limit(limitN);
      for (const p of co) {
        p._reason = 'frequently_bought_together';
        await pushProduct(p);
        if (results.length >= limitN) break;
      }
    }

    // Featured fillers
    if (results.length < limitN) {
      const { rows } = await productsRepo.listProducts({
        limit: limitN,
        offset: 0,
        status: 'published',
        featured: true,
      });
      for (const p of rows) {
        p._reason = 'featured';
        await pushProduct(p);
        if (results.length >= limitN) break;
      }
    }

    // Latest fillers
    if (results.length < limitN) {
      const { rows } = await productsRepo.listProducts({
        limit: limitN,
        offset: 0,
        status: 'published',
      });
      for (const p of rows) {
        p._reason = 'latest';
        await pushProduct(p);
        if (results.length >= limitN) break;
      }
    }

    return { product_id: Number(productId), items: results.slice(0, limitN) };
  } catch (err) {
    wrap('recommendations', err);
  }
}

export default {
  createReview,
  listProductReviews,
  listAdmin,
  moderate,
  recommendations,
};
