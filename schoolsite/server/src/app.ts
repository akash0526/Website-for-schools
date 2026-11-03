import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Container } from './business/container.js';
import { AppError, errorHandler } from './middleware/errors.js';
import { publicRoutes } from './routes/public.js';
import { adminRoutes } from './routes/admin.js';

export function createApp(container: Container) {
  const app = express();
  app.disable('x-powered-by');
  if (container.config.trustProxy) app.set('trust proxy', container.config.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
          fontSrc: ["'self'"],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'https://upload.imagekit.io',
            ...(container.config.supabaseUrl ? [container.config.supabaseUrl] : []),
          ],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: container.config.environment === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: container.config.origins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use((req, res, next) => {
    const id = randomUUID();
    res.setHeader('X-Request-ID', id);
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api/'))
        console.log(
          JSON.stringify({
            requestId: id,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - start,
          }),
        );
    });
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) =>
    res.json({ data: { status: 'ok', mode: container.config.mode } }),
  );
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
      },
    }),
  );
  app.use('/api/admin', adminRoutes(container));
  app.use('/api', publicRoutes(container));
  app.use('/api', (_req, _res, next) =>
    next(new AppError(404, 'NOT_FOUND', 'API endpoint not found.')),
  );
  if (container.config.mode === 'demo') {
    app.use(
      '/uploads',
      express.static(join(container.config.dataDirectory, 'uploads'), {
        immutable: true,
        maxAge: '1y',
        dotfiles: 'deny',
        index: false,
        setHeaders(res) {
          res.setHeader('X-Content-Type-Options', 'nosniff');
        },
      }),
    );
    app.use('/uploads', (_req, _res, next) =>
      next(new AppError(404, 'NOT_FOUND', 'Image not found.')),
    );
  }
  if (existsSync(container.config.clientDirectory)) {
    app.use(express.static(container.config.clientDirectory, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(join(container.config.clientDirectory, 'index.html')));
  } else
    app.get('/', (_req, res) =>
      res.json({
        data: {
          name: 'SchoolSite API',
          hint: 'Open the Vite client on port 5173, or build the client for production.',
        },
      }),
    );
  app.use(errorHandler);
  return app;
}
