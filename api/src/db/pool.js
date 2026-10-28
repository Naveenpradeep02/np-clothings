/**
 * MySQL 8 connection pool.
 * Uses mysql2/promise. Graceful when DB is unreachable (dev).
 */

import env from '../config/env.js';
import logger from '../lib/logger.js';

let pool = null;
let lastHealth = { ok: false, checkedAt: null, error: null };

function buildPoolConfig() {
  const isSsl = env.db.ssl || (env.db.url && (env.db.url.includes('ssl') || env.db.url.includes('ssl-mode')));
  const ssl = isSsl ? { rejectUnauthorized: false } : undefined;

  if (env.db.url) {
    // mysql2 supports connection URI in some versions; prefer explicit fields when possible
    try {
      const u = new URL(env.db.url);
      const conf = {
        host: u.hostname,
        port: Number(u.port) || 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
        waitForConnections: true,
        connectionLimit: env.db.connectionLimit,
        enableKeepAlive: true,
      };
      if (ssl) conf.ssl = ssl;
      return conf;
    } catch {
      // fall through to discrete fields
    }
  }

  const conf = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: env.db.connectionLimit,
    enableKeepAlive: true,
  };
  if (ssl) conf.ssl = ssl;
  return conf;
}

/**
 * Lazily create pool. Does not throw on import.
 */
export async function getPool() {
  if (pool) return pool;

  try {
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool(buildPoolConfig());
    logger.info('MySQL pool created', {
      host: env.db.host,
      database: env.db.database,
    });
    return pool;
  } catch (err) {
    logger.error('Failed to create MySQL pool', err);
    throw err;
  }
}

/**
 * Health check — SELECT 1
 */
export async function checkDatabase() {
  const checkedAt = new Date().toISOString();
  try {
    const p = await getPool();
    const [rows] = await p.query('SELECT 1 AS ok');
    lastHealth = { ok: true, checkedAt, error: null, result: rows?.[0] };
    return lastHealth;
  } catch (err) {
    lastHealth = {
      ok: false,
      checkedAt,
      error: err.message || String(err),
    };
    logger.warn('Database health check failed', { error: lastHealth.error });
    return lastHealth;
  }
}

export function getLastDbHealth() {
  return lastHealth;
}

/**
 * Close pool (for graceful shutdown / tests)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('MySQL pool closed');
  }
}

export default { getPool, checkDatabase, getLastDbHealth, closePool };
