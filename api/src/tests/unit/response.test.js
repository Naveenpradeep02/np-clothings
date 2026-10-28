import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { success, created, fail } from '../../lib/response.js';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('response helpers', () => {
  it('success wraps data', () => {
    const res = mockRes();
    success(res, { id: 1 });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, { id: 1 });
  });

  it('created is 201', () => {
    const res = mockRes();
    created(res, { id: 2 });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
  });

  it('fail returns error shape', () => {
    const res = mockRes();
    fail(res, 400, 'BAD_REQUEST', 'nope');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'BAD_REQUEST');
  });
});
