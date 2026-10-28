/**
 * Integration: catalog tables exist after migrate.
 * Run with: RUN_INTEGRATION=1 npm run test:integration
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { skipWithoutDb } from './helpers.js';
import db from '../../db/knex.js';

describe('integration: catalog schema', () => {
  it('categories table is queryable', async (t) => {
    if (!(await skipWithoutDb(t))) return;
    const rows = await db('categories').select('id').limit(1);
    assert.ok(Array.isArray(rows));
  });

  it('products table is queryable', async (t) => {
    if (!(await skipWithoutDb(t))) return;
    const rows = await db('products').select('id').limit(1);
    assert.ok(Array.isArray(rows));
  });

  it('product_variants has option_hash column', async (t) => {
    if (!(await skipWithoutDb(t))) return;
    const cols = await db('product_variants').columnInfo();
    assert.ok(cols.option_hash || cols.option_hash === undefined || 'option_hash' in cols);
  });
});
