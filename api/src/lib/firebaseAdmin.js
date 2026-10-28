/**
 * Firebase Admin initialization (server only).
 * Private key never leaves this process.
 * If credentials are missing, init is skipped and auth runs in "unconfigured" mode.
 */

import env from '../config/env.js';
import logger from './logger.js';

let app = null;
let status = {
  configured: false,
  initialized: false,
  error: null,
};

export function getFirebaseStatus() {
  return { ...status };
}

/**
 * Attempt to initialize Firebase Admin.
 * Safe to call multiple times.
 */
export async function initFirebaseAdmin() {
  if (status.initialized) return app;

  const { projectId, clientEmail, privateKey } = env.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    status = {
      configured: false,
      initialized: false,
      error: 'FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY not set',
    };
    logger.warn('Firebase Admin not configured — identity verification disabled until env is set');
    return null;
  }

  status.configured = true;

  try {
    // Dynamic import so the package is optional until installed
    const admin = await import('firebase-admin');

    if (admin.apps.length === 0) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      app = admin.app();
    }

    status.initialized = true;
    status.error = null;
    logger.info('Firebase Admin initialized', { projectId });
    return app;
  } catch (err) {
    status.initialized = false;
    status.error = err.message || String(err);
    logger.error('Firebase Admin init failed', err);
    return null;
  }
}

/**
 * Verify a Firebase ID token. Returns decoded claims or null.
 * Throws if Firebase is required and not initialized (callers decide).
 */
export async function verifyIdToken(idToken) {
  if (!status.initialized) {
    await initFirebaseAdmin();
  }
  if (!status.initialized) {
    const error = new Error('Firebase Admin is not initialized');
    error.code = 'FIREBASE_UNAVAILABLE';
    error.status = 503;
    throw error;
  }

  const admin = await import('firebase-admin');
  return admin.auth().verifyIdToken(idToken);
}

export default { initFirebaseAdmin, verifyIdToken, getFirebaseStatus };
