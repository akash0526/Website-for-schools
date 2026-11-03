import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { Container } from '../business/container.js';
import { pagination, routeId, wrap } from './helpers.js';
export function publicRoutes(container: Container) {
  const router = Router(),
    s = container.services;
  router.get('/config', (_req, res) =>
    res.json({
      data: {
        mode: container.config.mode,
        schoolSlug: container.config.schoolSlug,
        auth:
          container.config.mode === 'live'
            ? {
                provider: 'supabase',
                url: container.config.supabaseUrl,
                publishableKey: container.config.supabasePublishableKey,
              }
            : { provider: 'demo' },
        uploads: {
          maxBytes: container.config.maxUploadBytes,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
      },
    }),
  );
  router.get(
    '/home',
    wrap(async (_req, res) => {
      res.json({ data: await s.home() });
    }),
  );
  router.get(
    '/settings',
    wrap(async (_req, res) => {
      res.json({ data: await s.settings() });
    }),
  );
  router.get(
    '/events',
    wrap(async (req, res) => {
      const period = z
        .enum(['upcoming', 'past', 'all'])
        .default('upcoming')
        .parse(req.query.period);
      const query = pagination(req);
      const category = z
        .enum(['Academic', 'Community', 'Sports', 'Arts', 'Celebration'])
        .optional()
        .parse(req.query.category || undefined);
      if (category) query.filters?.push({ field: 'category', op: 'eq', value: category });
      res.json({ data: await s.publicEvents(query, period) });
    }),
  );
  router.get(
    '/events/:slug',
    wrap(async (req, res) => {
      res.json({ data: await s.eventBySlug(z.string().max(150).parse(req.params.slug)) });
    }),
  );
  router.get(
    '/announcements',
    wrap(async (req, res) => {
      res.json({ data: await s.publicAnnouncements(pagination(req)) });
    }),
  );
  router.get(
    '/announcements/:id',
    wrap(async (req, res) => {
      res.json({ data: await s.publicAnnouncement(routeId(req.params.id)) });
    }),
  );
  router.get(
    '/programs',
    wrap(async (_req, res) => {
      res.json({
        data: await s.repositories.programs.list({
          filters: [{ field: 'status', op: 'eq', value: 'published' }],
          order: [{ field: 'sortOrder', ascending: true }],
          limit: 100,
        }),
      });
    }),
  );
  router.get(
    '/albums',
    wrap(async (req, res) => {
      res.json({ data: await s.publicAlbums(pagination(req)) });
    }),
  );
  router.get(
    '/albums/:id',
    wrap(async (req, res) => {
      const id = routeId(req.params.id),
        page = z.coerce.number().int().min(1).default(1).parse(req.query.page);
      res.json({ data: req.query.page ? await s.albumPhotos(id, page) : await s.albumDetails(id) });
    }),
  );
  router.post(
    '/inquiries',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: {
          code: 'RATE_LIMITED',
          message:
            'Too many enquiries. Please contact the school office directly or try again later.',
        },
      },
    }),
    wrap(async (req, res) => {
      res.status(201).json({ data: await s.createInquiry(req.body) });
    }),
  );
  return router;
}
