import * as repo from './repository.js';
import * as inventoryService from '../inventory/service.js';
import * as couponService from '../coupons/service.js';
import db from '../../db/knex.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`carts.${fn} failed`, err);
  throw new ServiceUnavailableError('Cart temporarily unavailable');
}

async function getVariantOptions(variantId) {
  return db('variant_option_values as vov')
    .join('specification_options as o', 'o.id', 'vov.option_id')
    .join('specification_groups as g', 'g.id', 'o.group_id')
    .where('vov.variant_id', variantId)
    .select('g.code as group_code', 'g.name as group_name', 'o.name as option_name', 'o.code as option_code');
}

/**
 * Resolve or create cart for user / session.
 */
export async function getOrCreateCart({ userId, sessionId }) {
  try {
    if (!userId && !sessionId) {
      throw new BadRequestError('user or session_id required');
    }
    let cart = userId
      ? await repo.findCartByUser(userId)
      : await repo.findCartBySession(sessionId);
    if (!cart && userId && sessionId) {
      // prefer user cart; else session
      cart = await repo.findCartBySession(sessionId);
    }
    if (!cart) {
      cart = await repo.createCart({ userId, sessionId });
    } else if (userId && !cart.user_id) {
      await db('carts').where({ id: cart.id }).update({ user_id: userId });
      cart = await repo.findCartById(cart.id);
    }
    return cart;
  } catch (err) {
    wrap('getOrCreateCart', err);
  }
}

export async function getCartView(cartId, { couponCode, userId } = {}) {
  try {
    const cart = await repo.findCartById(cartId);
    if (!cart) throw new NotFoundError('Cart not found');

    const rawItems = await repo.listItems(cartId);
    const items = [];
    let subtotal = 0;

    for (const row of rawItems) {
      const inv = await inventoryService.getInventory(row.variant_id);
      const options = await getVariantOptions(row.variant_id);
      const unit = Number(row.price);
      const line = unit * row.quantity;
      subtotal += line;
      items.push({
        cart_item_id: row.cart_item_id,
        variant_id: row.variant_id,
        product_id: row.product_id,
        product_name: row.product_name,
        product_slug: row.product_slug,
        sku: row.sku,
        quantity: row.quantity,
        unit_price: unit,
        line_total: Math.round(line * 100) / 100,
        variant_status: row.variant_status,
        available: inv.available,
        options,
        in_stock: inv.available >= row.quantity && row.variant_status === 'active',
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    let discount_amount = 0;
    let coupon = null;

    if (couponCode) {
      try {
        const c = await couponService.findActiveCoupon(couponCode);
        await couponService.assertRedeemable(c, userId || cart.user_id);
        discount_amount = await couponService.calculateDiscount(c, subtotal);
        coupon = { id: c.id, code: c.code, name: c.name, discount_amount };
      } catch (err) {
        if (!(err instanceof AppError)) throw err;
        coupon = { error: err.message };
      }
    }

    // Settings-driven tax/shipping simplified
    const taxRate = 0.18;
    const taxable = Math.max(0, subtotal - discount_amount);
    const tax_amount = Math.round(taxable * taxRate * 100) / 100;
    const freeAbove = 3000;
    const shipping_amount = taxable >= freeAbove || taxable === 0 ? 0 : 99;
    const grand_total =
      Math.round((subtotal - discount_amount + tax_amount + shipping_amount) * 100) / 100;

    return {
      id: cart.id,
      currency: cart.currency,
      items,
      totals: {
        subtotal,
        discount_amount,
        tax_amount,
        shipping_amount,
        grand_total,
      },
      coupon,
      item_count: items.reduce((s, i) => s + i.quantity, 0),
    };
  } catch (err) {
    wrap('getCartView', err);
  }
}

export async function addItem({ cartId, variantId, quantity = 1 }) {
  try {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestError('quantity must be a positive integer');
    }

    const variant = await db('product_variants')
      .where({ id: variantId })
      .whereNull('deleted_at')
      .first();
    if (!variant || variant.status !== 'active') {
      throw new NotFoundError('Variant not available');
    }

    const cart = await repo.findCartById(cartId);
    if (!cart) throw new NotFoundError('Cart not found');

    const existing = await repo.findItem(cartId, variantId);
    const newQty = (existing?.quantity || 0) + qty;

    const inv = await inventoryService.getInventory(variantId);
    if (newQty > inv.available) {
      throw new ConflictError(`Only ${inv.available} units available`);
    }

    await repo.upsertItem(cartId, variantId, newQty);
    await repo.touchCart(cartId);
    return getCartView(cartId);
  } catch (err) {
    wrap('addItem', err);
  }
}

export async function updateItem({ cartId, cartItemId, quantity }) {
  try {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new BadRequestError('quantity must be a non-negative integer');
    }

    const item = await db('cart_items').where({ id: cartItemId, cart_id: cartId }).first();
    if (!item) throw new NotFoundError('Cart item not found');

    if (qty === 0) {
      await repo.removeItem(cartId, cartItemId);
    } else {
      const inv = await inventoryService.getInventory(item.variant_id);
      if (qty > inv.available) {
        throw new ConflictError(`Only ${inv.available} units available`);
      }
      await repo.updateItemQty(cartItemId, qty);
    }
    await repo.touchCart(cartId);
    return getCartView(cartId);
  } catch (err) {
    wrap('updateItem', err);
  }
}

export async function removeItem({ cartId, cartItemId }) {
  try {
    const deleted = await repo.removeItem(cartId, cartItemId);
    if (!deleted) throw new NotFoundError('Cart item not found');
    await repo.touchCart(cartId);
    return getCartView(cartId);
  } catch (err) {
    wrap('removeItem', err);
  }
}

export function assertCartAccess(cart, { userId, sessionId }) {
  if (cart.user_id && userId && Number(cart.user_id) === Number(userId)) return;
  if (cart.session_id && sessionId && cart.session_id === sessionId) return;
  if (!cart.user_id && sessionId && cart.session_id === sessionId) return;
  throw new ForbiddenError('Not allowed to access this cart');
}

export default {
  getOrCreateCart,
  getCartView,
  addItem,
  updateItem,
  removeItem,
  assertCartAccess,
};
