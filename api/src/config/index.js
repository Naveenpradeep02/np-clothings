/**
 * Centralized API configuration export.
 */

import env, { validateEnv } from './env.js';

const config = {
  env: env.nodeEnv,
  isDev: env.isDev,
  isProd: env.isProd,
  isTest: env.isTest,
  port: env.port,
  appBaseUrl: env.appBaseUrl,
  customerWebUrl: env.customerWebUrl,
  adminWebUrl: env.adminWebUrl,
  corsOrigins: env.corsOrigins,
  db: env.db,
  firebase: {
    // Never export privateKey to accidental logs/serializers
    projectId: env.firebase.projectId,
    configured: Boolean(
      env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey
    ),
  },
  payment: {
    provider: env.payment.provider,
    publicKey: env.payment.publicKey,
    configured: Boolean(env.payment.secretKey),
  },
  rateLimit: env.rateLimit,
  logLevel: env.logLevel,
  validateEnv,
};

export { env, validateEnv };
export default config;
