/**
 * Users — customer self-service + admin customer management.
 * Employees require customers:read / customers:write.
 */

import * as repo from './repository.js';
import * as ordersRepo from '../orders/repository.js';
import { writeAudit } from '../audit/service.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

const CUSTOMER_STATUSES = ['active', 'inactive', 'suspended'];

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`users.${fn} failed`, err);
  throw new ServiceUnavailableError('Users temporarily unavailable');
}

function publicCustomer(user, profile = null, extras = {}) {
  return {
    id: user.id,
    email: user.email,
    email_verified: Boolean(user.email_verified),
    phone: user.phone,
    status: user.status,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    profile: profile
      ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
        }
      : {
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          display_name: user.display_name || null,
          avatar_url: user.avatar_url || null,
        },
    ...extras,
  };
}

/** Current customer profile */
export async function getMe(userId) {
  try {
    const user = await repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const profile = await repo.getCustomerProfile(userId);
    const addresses = await repo.getAddresses(userId);
    return publicCustomer(user, profile, { addresses });
  } catch (err) {
    wrap('getMe', err);
  }
}

export async function updateMe(userId, body) {
  try {
    const user = await repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.user_type !== 'customer') {
      // employees may still update phone
    }

    if (body.phone !== undefined) {
      await repo.updateUser(userId, { phone: body.phone || null });
    }

    await repo.ensureCustomerProfile(userId, {
      first_name: body.first_name,
      last_name: body.last_name,
      display_name: body.display_name,
    });

    // Optional profile fields
    if (
      body.date_of_birth !== undefined ||
      body.gender !== undefined ||
      body.avatar_url !== undefined
    ) {
      const db = (await import('../../db/knex.js')).default;
      const patch = { updated_at: db.fn.now() };
      if (body.date_of_birth !== undefined) patch.date_of_birth = body.date_of_birth;
      if (body.gender !== undefined) patch.gender = body.gender;
      if (body.avatar_url !== undefined) patch.avatar_url = body.avatar_url;
      await db('customer_profiles').where({ user_id: userId }).update(patch);
    }

    return getMe(userId);
  } catch (err) {
    wrap('updateMe', err);
  }
}

export async function listCustomers(pagination, filters = {}) {
  try {
    const { rows, total } = await repo.listCustomers({
      limit: pagination.limit,
      offset: pagination.offset,
      status: filters.status,
      search: filters.search,
    });
    return {
      rows: rows.map((r) => publicCustomer(r)),
      total,
    };
  } catch (err) {
    wrap('listCustomers', err);
  }
}

export async function getCustomer(id) {
  try {
    const user = await repo.findById(id);
    if (!user || user.user_type !== 'customer') {
      throw new NotFoundError('Customer not found');
    }
    const profile = await repo.getCustomerProfile(id);
    const addresses = await repo.getAddresses(id);
    const stats = await repo.customerOrderStats(id);
    return publicCustomer(user, profile, { addresses, stats });
  } catch (err) {
    wrap('getCustomer', err);
  }
}

export async function updateCustomerStatus(actor, id, { status, reason }) {
  try {
    if (!CUSTOMER_STATUSES.includes(status)) {
      throw new BadRequestError(`status must be one of: ${CUSTOMER_STATUSES.join(', ')}`);
    }
    const user = await repo.findById(id);
    if (!user || user.user_type !== 'customer') {
      throw new NotFoundError('Customer not found');
    }

    const updated = await repo.updateUser(id, { status });

    await writeAudit({
      actorId: actor?.id,
      action: 'customer.status_changed',
      entityType: 'user',
      entityId: Number(id),
      oldValues: { status: user.status },
      newValues: { status, reason },
    });

    return publicCustomer(updated, await repo.getCustomerProfile(id));
  } catch (err) {
    wrap('updateCustomerStatus', err);
  }
}

export async function listCustomerOrders(customerId, pagination) {
  try {
    const user = await repo.findById(customerId);
    if (!user || user.user_type !== 'customer') {
      throw new NotFoundError('Customer not found');
    }
    return await ordersRepo.listByUser(customerId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (err) {
    wrap('listCustomerOrders', err);
  }
}


export async function listAddresses(userId) {
  try {
    return await repo.getAddresses(userId);
  } catch (err) {
    wrap('listAddresses', err);
  }
}

export async function createAddress(userId, body) {
  try {
    if (!body?.full_name?.trim()) throw new BadRequestError('full_name is required');
    if (!body?.phone?.trim()) throw new BadRequestError('phone is required');
    if (!body?.line1?.trim()) throw new BadRequestError('line1 is required');
    if (!body?.city?.trim()) throw new BadRequestError('city is required');
    if (!body?.state?.trim()) throw new BadRequestError('state is required');
    if (!body?.postal_code?.trim()) throw new BadRequestError('postal_code is required');
    return await repo.createAddress(userId, body);
  } catch (err) {
    wrap('createAddress', err);
  }
}

export async function updateAddress(userId, id, body) {
  try {
    const existing = await repo.findAddress(userId, id);
    if (!existing) throw new NotFoundError('Address not found');
    return await repo.updateAddress(userId, id, body || {});
  } catch (err) {
    wrap('updateAddress', err);
  }
}

export async function deleteAddress(userId, id) {
  try {
    const n = await repo.deleteAddress(userId, id);
    if (!n) throw new NotFoundError('Address not found');
    return { removed: true };
  } catch (err) {
    wrap('deleteAddress', err);
  }
}

export default {
  getMe,
  updateMe,
  listCustomers,
  getCustomer,
  updateCustomerStatus,
  listCustomerOrders,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};

