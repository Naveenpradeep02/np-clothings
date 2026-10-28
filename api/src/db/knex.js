/**
 * Shared Knex instance for repositories / transactions.
 * Uses the same connection settings as knexfile.cjs / env.js.
 */

import knex from 'knex';
import env from '../config/env.js';
import logger from '../lib/logger.js';

function connectionConfig() {
  if (env.db.url) {
    try {
      const u = new URL(env.db.url);
      return {
        host: u.hostname,
        port: Number(u.port) || 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      };
    } catch {
      /* fall through */
    }
  }
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  };
}

const db = knex({
  client: 'mysql2',
  connection: connectionConfig(),
  pool: {
    min: 0,
    max: env.db.connectionLimit || 10,
  },
  acquireConnectionTimeout: 10000,
});

db.on('query-error', (err) => {
  logger.error('Knex query error', err);
});

/**
 * Run work inside a transaction.
 * @template T
 * @param {(trx: import('knex').Knex.Transaction) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  return db.transaction(fn);
}

export default db;
