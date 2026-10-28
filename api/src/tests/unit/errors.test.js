import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from '../../lib/errors.js';

describe('AppError hierarchy', () => {
  it('AppError defaults', () => {
    const e = new AppError('boom');
    assert.equal(e.message, 'boom');
    assert.equal(e.status, 500);
    assert.equal(e.isOperational, true);
  });

  it('BadRequestError is 400', () => {
    const e = new BadRequestError('bad');
    assert.equal(e.status, 400);
    assert.equal(e.code, 'BAD_REQUEST');
  });

  it('NotFoundError is 404', () => {
    assert.equal(new NotFoundError('x').status, 404);
  });

  it('ForbiddenError is 403', () => {
    assert.equal(new ForbiddenError('no').status, 403);
  });

  it('UnauthorizedError is 401', () => {
    assert.equal(new UnauthorizedError('auth').status, 401);
  });

  it('ConflictError is 409', () => {
    assert.equal(new ConflictError('dup').status, 409);
  });
});
