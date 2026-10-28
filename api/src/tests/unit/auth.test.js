/**
 * Auth-related unit tests (no Firebase / DB required).
 * Run: node --test src/tests/unit/auth.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UnauthorizedError,
  ForbiddenError,
  ServiceUnavailableError,
  BadRequestError,
  AppError,
} from '../../lib/errors.js';

describe('Auth error mapping', () => {
  it('UnauthorizedError is 401', () => {
    const err = new UnauthorizedError('Invalid token');
    assert.equal(err.status, 401);
    assert.equal(err.code, 'UNAUTHORIZED');
    assert.ok(err instanceof AppError);
  });

  it('ForbiddenError is 403 for inactive accounts', () => {
    const err = new ForbiddenError('Account is not active');
    assert.equal(err.status, 403);
    assert.equal(err.code, 'FORBIDDEN');
  });

  it('ServiceUnavailableError is 503 when Firebase missing', () => {
    const err = new ServiceUnavailableError('Authentication service is not configured');
    assert.equal(err.status, 503);
    assert.equal(err.code, 'SERVICE_UNAVAILABLE');
  });

  it('BadRequestError is 400 for bad claims', () => {
    const err = new BadRequestError('Email is required on the identity token');
    assert.equal(err.status, 400);
  });
});

describe('toPublicUser shape (inline mirror of service contract)', () => {
  function toPublicUser(user, extras = {}) {
    return {
      id: user.id,
      email: user.email,
      email_verified: Boolean(user.email_verified),
      phone: user.phone,
      user_type: user.user_type,
      status: user.status,
      permissions: extras.permissions || [],
      roles: extras.roles || [],
      profile: extras.profile
        ? {
            first_name: extras.profile.first_name,
            last_name: extras.profile.last_name,
            display_name: extras.profile.display_name,
            avatar_url: extras.profile.avatar_url,
          }
        : null,
    };
  }

  it('never exposes firebase_uid', () => {
    const pub = toPublicUser(
      {
        id: 9,
        email: 'c@aurea.test',
        email_verified: true,
        phone: null,
        user_type: 'customer',
        status: 'active',
        firebase_uid: 'should-not-leak',
      },
      { permissions: [], roles: [], profile: { first_name: 'C' } }
    );
    assert.equal(pub.firebase_uid, undefined);
    assert.equal(pub.id, 9);
    assert.equal(pub.profile.first_name, 'C');
  });
});

describe('Bearer extraction contract', () => {
  function extractBearer(authorization) {
    if (!authorization || !authorization.startsWith('Bearer ')) return null;
    const token = authorization.slice(7).trim();
    return token || null;
  }

  it('returns null for missing header', () => {
    assert.equal(extractBearer(undefined), null);
    assert.equal(extractBearer('Basic xyz'), null);
  });

  it('returns token for valid Bearer', () => {
    assert.equal(extractBearer('Bearer abc.def.ghi'), 'abc.def.ghi');
  });
});
