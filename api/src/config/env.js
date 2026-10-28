/**
 * Environment loading + validation.
 * Secrets are never hardcoded. Missing optional vars degrade gracefully.
 * Required vars for boot: none beyond PORT defaults.
 * Required for full features: DB_*, FIREBASE_* (validated when those modules init).
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load from apps/api/.env first, then monorepo root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

function str(key, fallback = undefined) {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return v;
}

function num(key, fallback) {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(key, fallback = false) {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

const env = {
  nodeEnv: str('NODE_ENV', 'development'),
  isDev: str('NODE_ENV', 'development') !== 'production',
  isProd: str('NODE_ENV', 'development') === 'production',
  isTest: str('NODE_ENV', 'development') === 'test',

  port: num('PORT', 4000),
  appBaseUrl: str('APP_BASE_URL', 'http://localhost:4000'),
  customerWebUrl: str('CUSTOMER_WEB_URL', 'http://localhost:5173'),
  adminWebUrl: str('ADMIN_WEB_URL', 'http://localhost:5174'),

  // CORS — comma-separated extra origins allowed
  corsOrigins: [
    str('CUSTOMER_WEB_URL', 'http://localhost:5173'),
    str('ADMIN_WEB_URL', 'http://localhost:5174'),
    ...(str('CORS_EXTRA_ORIGINS', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)),
  ],

  // MySQL
  db: {
    host: str('DB_HOST', '127.0.0.1'),
    port: num('DB_PORT', 3306),
    user: str('DB_USER', 'aurea'),
    password: str('DB_PASSWORD', ''),
    database: str('DB_NAME', 'aurea_commerce'),
    // Optional full URL override
    url: str('DATABASE_URL'),
    // Pool
    connectionLimit: num('DB_POOL_LIMIT', 10),
    // If false, API boots even when DB is unreachable (dev convenience)
    requiredOnBoot: bool('DB_REQUIRED_ON_BOOT', false),
  },

  // Firebase Admin (server only — never expose private key to frontend)
  firebase: {
    projectId: str('FIREBASE_PROJECT_ID', ''),
    clientEmail: str('FIREBASE_CLIENT_EMAIL', ''),
    // Private key may contain escaped newlines in env
    privateKey: str('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  },

  // Provider placeholders (wired in later phases)
  payment: {
    provider: str('PAYMENT_PROVIDER', 'razorpay'),
    secretKey: str('PAYMENT_SECRET_KEY', ''),
    webhookSecret: str('PAYMENT_WEBHOOK_SECRET', ''),
    publicKey: str('PAYMENT_PUBLIC_KEY', ''),
  },

  sms: {
    provider: str('SMS_PROVIDER', ''),
    key: str('SMS_PROVIDER_KEY', ''),
  },

  whatsapp: {
    provider: str('WHATSAPP_PROVIDER', ''),
    key: str('WHATSAPP_PROVIDER_KEY', ''),
  },

  courier: {
    provider: str('COURIER_PROVIDER', ''),
    key: str('COURIER_PROVIDER_KEY', ''),
  },

  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 900_000),
    max: num('RATE_LIMIT_MAX', 100),
  },

  logLevel: str('LOG_LEVEL', str('NODE_ENV', 'development') === 'production' ? 'info' : 'debug'),
};

/**
 * Validate critical shape. Does not throw for missing optional secrets in development.
 * Returns { ok, warnings, errors }.
 */
export function validateEnv() {
  const warnings = [];
  const errors = [];

  if (env.isProd) {
    if (!env.db.password && !env.db.url) {
      errors.push('DB_PASSWORD or DATABASE_URL is required in production');
    }
    if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
      warnings.push('Firebase Admin is not fully configured — auth will not work');
    }
    if (!env.payment.secretKey) {
      warnings.push('PAYMENT_SECRET_KEY is empty — payments disabled');
    }
  } else {
    if (!env.db.password && !env.db.url) {
      warnings.push('DB_PASSWORD not set — database features will be unavailable until configured');
    }
    if (!env.firebase.projectId) {
      warnings.push('FIREBASE_PROJECT_ID not set — auth middleware will run in stub mode');
    }
  }

  if (env.port < 1 || env.port > 65535) {
    errors.push(`Invalid PORT: ${env.port}`);
  }

  return {
    ok: errors.length === 0,
    warnings,
    errors,
  };
}

export default env;
