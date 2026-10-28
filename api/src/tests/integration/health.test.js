/**
 * Integration: health / readiness.
 * Skips when DB is offline.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { skipWithoutDb } from './helpers.js';
import db from '../../db/knex.js';

describe('integration: database connectivity', () => {
  it('can SELECT 1', async (t) => {
    if (!(await skipWithoutDb(t))) return;
    const [rows] = await db.raw('SELECT 1 AS ok');
    const row = Array.isArray(rows) ? rows[0] : rows;
    assert.ok(row.ok === 1 || row.OK === 1 || Object.values(row)[0] === 1);
  });
});
