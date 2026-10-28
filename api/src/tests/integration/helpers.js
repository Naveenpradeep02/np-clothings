/**
 * Integration test helpers.
 * Tests skip automatically when MySQL is not configured or unreachable.
 */

import db from '../../db/knex.js';

let dbReady = null;

export async function isDbAvailable() {
  if (dbReady !== null) return dbReady;
  try {
    await db.raw('SELECT 1');
    dbReady = true;
  } catch {
    dbReady = false;
  }
  return dbReady;
}

export function skipWithoutDb(t) {
  return isDbAvailable().then((ok) => {
    if (!ok) {
      t.skip('MySQL not available — set DB_* env vars and run migrations');
      return false;
    }
    return true;
  });
}

export async function cleanupTestData() {
  // Best-effort; only used when RUN_INTEGRATION=1
  if (process.env.RUN_INTEGRATION !== '1') return;
}

export default { isDbAvailable, skipWithoutDb, cleanupTestData };
