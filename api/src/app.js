import express from 'express';
import cors from 'cors';
import config, { validateEnv } from './config/index.js';
import logger from './lib/logger.js';
import { checkDatabase, getLastDbHealth, closePool } from './db/pool.js';
import { initFirebaseAdmin, getFirebaseStatus } from './lib/firebaseAdmin.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, requestTimeout, sanitizeBody } from './middleware/security.js';
import { requestId } from './middleware/requestId.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { getSnapshot, toPrometheus } from './lib/metrics.js';
import { asyncHandler } from './lib/asyncHandler.js';
import { success } from './lib/response.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import v1Router from './routes/v1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../public/uploads');

const app = express();

// Trust proxy for correct req.ip behind load balancers
app.set('trust proxy', 1);

// ----- Security -----
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(requestId);
app.use(metricsMiddleware);
app.use(requestTimeout(30_000));

// ----- CORS allow-list -----
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.isDev || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      logger.warn('CORS blocked origin', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// ----- Structured request logging -----
if (!config.isTest) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.request(req, res, Date.now() - start);
    });
    next();
  });
}

// ----- Health (liveness + readiness) — outside versioned API -----
app.get(
  '/health',
  asyncHandler(async (req, res) => {
    const deep = req.query.deep === '1' || req.query.deep === 'true';

    const payload = {
      status: 'ok',
      service: 'aurea-api',
      env: config.env,
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
    };

    if (deep) {
      const db = await checkDatabase();
      const firebase = getFirebaseStatus();
      payload.checks = {
        database: {
          ok: db.ok,
          checkedAt: db.checkedAt,
          error: db.error || undefined,
        },
        firebase: {
          configured: firebase.configured,
          initialized: firebase.initialized,
          error: firebase.error || undefined,
        },
      };
      payload.status = db.ok || !config.db.requiredOnBoot ? 'ok' : 'degraded';
      const httpStatus = payload.status === 'ok' ? 200 : 503;
      return res.status(httpStatus).json({ success: payload.status === 'ok', data: payload });
    }

    return success(res, payload);
  })
);


// ----- Metrics (Prometheus + JSON) -----
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(toPrometheus());
});

app.get('/metrics/json', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return success(res, getSnapshot());
});

// ----- Versioned API -----
app.use('/api/v1', v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

// ----- Startup -----
async function boot() {
  const validation = validateEnv();

  for (const w of validation.warnings) {
    logger.warn(w);
  }
  if (!validation.ok) {
    for (const e of validation.errors) {
      logger.error(e);
    }
    if (config.isProd) {
      logger.error('Aborting startup due to invalid environment');
      process.exit(1);
    }
  }

  await initFirebaseAdmin();

  const dbHealth = await checkDatabase();
  if (!dbHealth.ok) {
    if (config.db.requiredOnBoot || config.isProd) {
      logger.error('Database required but unreachable — aborting', { error: dbHealth.error });
      process.exit(1);
    }
    logger.warn('Database unreachable — continuing in degraded mode', {
      error: dbHealth.error,
      hint: 'Set DB_* in apps/api/.env. Use /health?deep=true to re-check.',
    });
  } else {
    logger.info('Database connection OK');
  }

  const server = app.listen(config.port, () => {
    logger.info('API listening', {
      port: config.port,
      env: config.env,
      cors: config.corsOrigins,
      url: `http://localhost:${config.port}`,
      health: `http://localhost:${config.port}/health`,
      metrics: `http://localhost:${config.port}/metrics`,
      api: `http://localhost:${config.port}/api/v1`,
    });
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal} — shutting down`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

let serverPromise;
if (!config.isTest) {
  serverPromise = boot().catch((err) => {
    logger.error('Fatal startup error', err);
    process.exit(1);
  });
}

export default app;
export { serverPromise };
export function getLastDbHealthExport() {
  return getLastDbHealth();
}
