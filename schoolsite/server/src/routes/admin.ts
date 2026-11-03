import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { Container } from '../business/container.js';
import type { SchoolEvent } from '../domain/models.js';
import { authenticate, currentUser, requireOwner } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { inquiryUpdateSchema } from '../validation/schemas.js';
import { pagination, routeId, wrap } from './helpers.js';

export function adminRoutes(c: Container) {
  const router = Router(),
    s = c.services;
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' },
    },
  });
  router.post('/auth/demo', authLimiter, (_req, res, next) => {
    if (!c.demoAuth) {
      next(new AppError(404, 'NOT_FOUND', 'Demo sign-in is disabled.'));
      return;
    }
    res.json({ data: c.demoAuth.login() });
  });
  router.use(authenticate(c.auth));
  router.get('/auth/me', (_req, res) => {
    res.json({ data: currentUser(res) });
  });
  router.post('/auth/logout', (_req, res) => {
    c.demoAuth?.logout(res.locals.token);
    res.json({ data: { signedOut: true } });
  });
  router.get(
    '/dashboard',
    wrap(async (_req, res) => {
      res.json({ data: await s.dashboard() });
    }),
  );

  router.get(
    '/events',
    wrap(async (req, res) => {
      const query = pagination(req);
      if (req.query.upcoming === 'true')
        query.filters?.push({ field: 'startsAt', op: 'gte', value: new Date().toISOString() });
      query.order = [{ field: 'startsAt', ascending: false }];
      res.json({
        data: await s.events.list(query as import('../domain/ports.js').ListQuery<SchoolEvent>),
      });
    }),
  );
  resourceRoutes(router, '/events', s.events);
  resourceRoutes(router, '/announcements', s.announcements, [
    { field: 'createdAt', ascending: false },
  ]);
  resourceRoutes(router, '/programs', s.programs, [{ field: 'sortOrder', ascending: true }]);

  router.get(
    '/albums',
    wrap(async (req, res) => {
      const query = pagination(req);
      query.order = [{ field: 'eventDate', ascending: false }];
      res.json({ data: await s.repositories.albums.listSummaries(query) });
    }),
  );
  router.get(
    '/albums/:id',
    wrap(async (req, res) => {
      res.json({ data: await s.albums.get(routeId(req.params.id)) });
    }),
  );
  router.post(
    '/albums',
    wrap(async (req, res) => {
      res.status(201).json({ data: await s.albums.create(req.body) });
    }),
  );
  router.patch(
    '/albums/:id',
    wrap(async (req, res) => {
      res.json({ data: await s.albums.update(routeId(req.params.id), req.body) });
    }),
  );
  router.delete(
    '/albums/:id',
    wrap(async (req, res) => {
      await s.removeAlbum(routeId(req.params.id));
      res.status(204).end();
    }),
  );
  router.get(
    '/albums/:id/photos',
    wrap(async (req, res) => {
      await s.albums.get(routeId(req.params.id));
      const page = z.coerce.number().int().min(1).default(1).parse(req.query.page);
      res.json({
        data: await s.repositories.photos.list({
          filters: [{ field: 'albumId', op: 'eq', value: routeId(req.params.id) }],
          order: [
            { field: 'sortOrder', ascending: true },
            { field: 'createdAt', ascending: true },
          ],
          page,
          limit: 100,
        }),
      });
    }),
  );
  router.post(
    '/photos',
    wrap(async (req, res) => {
      res.status(201).json({ data: await s.addPhoto(req.body) });
    }),
  );
  router.get(
    '/photos/:id',
    wrap(async (req, res) => {
      res.json({ data: await s.photos.get(routeId(req.params.id)) });
    }),
  );
  router.patch(
    '/photos/:id',
    wrap(async (req, res) => {
      res.json({ data: await s.photos.update(routeId(req.params.id), req.body) });
    }),
  );
  router.delete(
    '/photos/:id',
    wrap(async (req, res) => {
      await s.photos.remove(routeId(req.params.id));
      res.status(204).end();
    }),
  );

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: c.config.maxUploadBytes, files: 1, fields: 2, fieldSize: 1024 },
  });
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: { code: 'RATE_LIMITED', message: 'Upload limit reached. Please try again later.' },
    },
  });
  router.post(
    '/uploads/authorize',
    uploadLimiter,
    wrap(async (_req, res) => {
      res.json({ data: await c.storage.getUploadPlan() });
    }),
  );
  router.post(
    '/uploads/verify',
    uploadLimiter,
    wrap(async (req, res) => {
      const { fileId } = z
        .object({ fileId: z.string().min(1).max(100) })
        .strict()
        .parse(req.body);
      res.json({ data: await c.storage.verifyUpload(fileId) });
    }),
  );
  router.post(
    '/uploads',
    uploadLimiter,
    upload.single('file'),
    wrap(async (req, res) => {
      if (c.storage.mode !== 'local')
        throw new AppError(
          400,
          'DIRECT_UPLOAD_REQUIRED',
          'Upload to ImageKit using an authorized upload plan.',
        );
      if (!req.file) throw new AppError(400, 'FILE_REQUIRED', 'Choose an image to upload.');
      res.status(201).json({
        data: await c.storage.upload({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
        }),
      });
    }),
  );

  router.get(
    '/settings',
    requireOwner,
    wrap(async (_req, res) => {
      res.json({ data: await s.settings() });
    }),
  );
  router.patch(
    '/settings',
    requireOwner,
    wrap(async (req, res) => {
      res.json({ data: await s.updateSettings(req.body) });
    }),
  );
  router.get(
    '/inquiries',
    requireOwner,
    wrap(async (req, res) => {
      const query = pagination(req);
      query.filters = [];
      const status = z
        .enum(['new', 'read', 'archived'])
        .optional()
        .parse(req.query.status || undefined);
      if (status) query.filters.push({ field: 'status', op: 'eq', value: status });
      query.order = [{ field: 'createdAt', ascending: false }];
      res.json({ data: await s.listInquiries(query) });
    }),
  );
  router.patch(
    '/inquiries/:id',
    requireOwner,
    wrap(async (req, res) => {
      const input = inquiryUpdateSchema.parse(req.body);
      res.json({ data: await s.updateInquiry(routeId(req.params.id), input.status) });
    }),
  );
  router.delete(
    '/inquiries/:id',
    requireOwner,
    wrap(async (req, res) => {
      await s.removeInquiry(routeId(req.params.id));
      res.status(204).end();
    }),
  );
  return router;
}
function resourceRoutes<T extends import('../domain/models.js').Entity, I>(
  router: Router,
  path: string,
  service: import('../business/content-service.js').ContentService<T, I>,
  order: { field: keyof T & string; ascending: boolean }[] = [
    { field: 'createdAt', ascending: false },
  ],
) {
  router.get(
    path,
    wrap(async (req, res) => {
      const query = pagination(req);
      query.order = order;
      res.json({ data: await service.list(query) });
    }),
  );
  router.get(
    `${path}/:id`,
    wrap(async (req, res) => {
      res.json({ data: await service.get(routeId(req.params.id)) });
    }),
  );
  router.post(
    path,
    wrap(async (req, res) => {
      res.status(201).json({ data: await service.create(req.body) });
    }),
  );
  router.patch(
    `${path}/:id`,
    wrap(async (req, res) => {
      res.json({ data: await service.update(routeId(req.params.id), req.body) });
    }),
  );
  router.delete(
    `${path}/:id`,
    wrap(async (req, res) => {
      await service.remove(routeId(req.params.id));
      res.status(204).end();
    }),
  );
}
