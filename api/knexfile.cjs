/**
 * Knex configuration for AUREA API migrations & seeds.
 * Reads the same env vars as the application (apps/api/.env or root .env).
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function connectionFromEnv() {
  const isSsl = process.env.DB_SSL === 'true' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('ssl'));
  const ssl = isSsl ? { rejectUnauthorized: false } : undefined;

  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      const conf = {
        host: u.hostname,
        port: Number(u.port) || 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      };
      if (ssl) conf.ssl = ssl;
      return conf;
    } catch {
      // fall through
    }
  }
  const conf = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'aurea',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aurea_commerce',
  };
  if (ssl) conf.ssl = ssl;
  return conf;
}

const shared = {
  client: 'mysql2',
  connection: connectionFromEnv(),
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
  },
};

module.exports = {
  development: { ...shared },
  test: {
    ...shared,
    connection: {
      ...connectionFromEnv(),
      database: process.env.DB_NAME_TEST || 'aurea_commerce_test',
    },
  },
  production: { ...shared },
};
