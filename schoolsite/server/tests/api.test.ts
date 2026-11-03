import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { loadConfig } from '../src/config/env.js';
import { createDemoContainer, type Container } from '../src/business/container.js';
import { createApp } from '../src/app.js';
import { ImageKitStorage } from '../src/providers/imagekit-storage.js';
import type { SchoolEvent } from '../src/domain/models.js';

const config = () =>
  loadConfig({
    APP_MODE: 'demo',
    NODE_ENV: 'test',
    PORT: '3001',
    CLIENT_ORIGINS: 'http://localhost:5173',
  });
let container: Container, app: ReturnType<typeof createApp>, token: string;
const eventInput = (overrides = {}) => ({
  title: 'A test school day',
  description: 'A lovely day for our school community.',
  category: 'Community',
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: null,
  location: 'School hall',
  coverImage: null,
  featured: false,
  status: 'draft',
  ...overrides,
});
const auth = () => `Bearer ${token}`;
beforeEach(async () => {
  container = createDemoContainer(config(), false);
  app = createApp(container);
  token = container.demoAuth!.login().token;
});

describe('public API and authentication', () => {
  it('exposes only public configuration, never server credentials', async () => {
    const response = await request(app).get('/api/config').expect(200);
    assert.equal(response.body.data.mode, 'demo');
    assert.equal(response.body.data.auth.provider, 'demo');
    assert.equal(JSON.stringify(response.body).includes('privateKey'), false);
    assert.equal(JSON.stringify(response.body).includes('secretKey'), false);
  });
  it('filters drafts and past events, and accepts empty filter controls', async () => {
    const response = await request(app).get('/api/events?category=&search=&status=').expect(200);
    const events = response.body.data.items as SchoolEvent[];
    assert.ok(events.length > 0);
    assert.ok(events.every((e) => e.status === 'published' && Date.parse(e.startsAt) > Date.now()));
    const home = await request(app).get('/api/home').expect(200);
    assert.ok(
      home.body.data.announcements.every((a: { status: string }) => a.status === 'published'),
    );
  });
  it('rejects unauthenticated and forged administrator tokens', async () => {
    await request(app).get('/api/admin/events').expect(401);
    await request(app)
      .get('/api/admin/events')
      .set('Authorization', 'Bearer forged-token')
      .expect(401);
    await request(app).post('/api/admin/uploads/authorize').expect(401);
  });
  it('supports demo session logout', async () => {
    await request(app).get('/api/admin/auth/me').set('Authorization', auth()).expect(200);
    await request(app).post('/api/admin/auth/logout').set('Authorization', auth()).expect(200);
    await request(app).get('/api/admin/auth/me').set('Authorization', auth()).expect(401);
  });
  it('blocks demo mode in production', () => {
    assert.throws(
      () => loadConfig({ APP_MODE: 'demo', NODE_ENV: 'production' }),
      /DEMO MODE IS BLOCKED/,
    );
    assert.throws(() => loadConfig({ APP_MODE: 'live', NODE_ENV: 'production' }), /SUPABASE_URL/);
  });
});

describe('content business rules', () => {
  it('creates a draft, publishes it, updates it, and deletes it', async () => {
    const created = await request(app)
      .post('/api/admin/events')
      .set('Authorization', auth())
      .send(eventInput())
      .expect(201);
    const event = created.body.data as SchoolEvent;
    await request(app).get(`/api/events/${event.slug}`).expect(404);
    await request(app)
      .get(`/api/admin/events/${event.id}`)
      .set('Authorization', auth())
      .expect(200);
    await request(app)
      .patch(`/api/admin/events/${event.id}`)
      .set('Authorization', auth())
      .send({ status: 'published' })
      .expect(200);
    await request(app).get(`/api/events/${event.slug}`).expect(200);
    const updated = await request(app)
      .patch(`/api/admin/events/${event.id}`)
      .set('Authorization', auth())
      .send({ title: 'Our updated school day', featured: true })
      .expect(200);
    assert.equal(updated.body.data.slug, event.slug);
    assert.equal(updated.body.data.featured, true);
    assert.equal(updated.body.data.status, 'published');
    await request(app)
      .delete(`/api/admin/events/${event.id}`)
      .set('Authorization', auth())
      .expect(204);
    await request(app).get(`/api/events/${event.slug}`).expect(404);
  });
  it('validates dates and rejects unknown or empty fields', async () => {
    await request(app)
      .post('/api/admin/events')
      .set('Authorization', auth())
      .send(eventInput({ endsAt: '2020-01-01T00:00:00Z' }))
      .expect(422);
    await request(app)
      .post('/api/admin/events')
      .set('Authorization', auth())
      .send(eventInput({ title: ' ' }))
      .expect(422);
    await request(app)
      .post('/api/admin/events')
      .set('Authorization', auth())
      .send(eventInput({ unexpected: true }))
      .expect(422);
  });
  it('preserves announcement publication time when editing', async () => {
    const created = await request(app)
      .post('/api/admin/announcements')
      .set('Authorization', auth())
      .send({
        title: 'A school notice',
        body: 'Please join us.',
        category: 'Notice',
        status: 'published',
        pinned: false,
      })
      .expect(201);
    const updated = await request(app)
      .patch(`/api/admin/announcements/${created.body.data.id}`)
      .set('Authorization', auth())
      .send({ title: 'An updated notice' })
      .expect(200);
    assert.equal(updated.body.data.publishedAt, created.body.data.publishedAt);
  });
  it('allows only the owner to edit settings and read family enquiries', async () => {
    const editorApp = createApp({
      ...container,
      auth: {
        resolveToken: async (value) =>
          value === 'editor'
            ? { id: 'editor', name: 'Editor', email: 'editor@example.com', role: 'editor' }
            : null,
      },
    });
    await request(editorApp)
      .patch('/api/admin/settings')
      .set('Authorization', 'Bearer editor')
      .send({ name: 'Not allowed' })
      .expect(403);
    await request(editorApp)
      .get('/api/admin/inquiries')
      .set('Authorization', 'Bearer editor')
      .expect(403);
    await request(editorApp)
      .post('/api/admin/events')
      .set('Authorization', 'Bearer editor')
      .send(eventInput())
      .expect(201);
    const updated = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', auth())
      .send({ shortName: 'ourschool' })
      .expect(200);
    assert.equal(updated.body.data.shortName, 'ourschool');
    assert.equal((await request(app).get('/api/settings')).body.data.shortName, 'ourschool');
  });
  it('deletes every demo photo when an album is deleted', async () => {
    const album = await container.services.albums.create({
      title: 'Large album',
      description: '',
      eventDate: '2026-11-03',
      status: 'draft',
      coverImage: null,
    });
    const image = container.services.home
      ? (await container.repositories.photos.list({ limit: 1 })).items[0].image
      : null;
    for (let i = 0; i < 105; i++)
      await container.repositories.photos.create({
        albumId: album.id,
        caption: `Photo ${i}`,
        image,
        sortOrder: i,
      });
    await request(app)
      .delete(`/api/admin/albums/${album.id}`)
      .set('Authorization', auth())
      .expect(204);
    assert.equal(
      await container.repositories.photos.count([{ field: 'albumId', op: 'eq', value: album.id }]),
      0,
    );
  });
});

describe('image upload boundary', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nJkAAAAASUVORK5CYII=',
    'base64',
  );
  it('accepts real image bytes and returns a usable local demo asset', async () => {
    const plan = await request(app)
      .post('/api/admin/uploads/authorize')
      .set('Authorization', auth())
      .expect(200);
    assert.equal(plan.body.data.mode, 'server');
    const uploaded = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', auth())
      .attach('file', png, { filename: 'school.png', contentType: 'image/png' })
      .expect(201);
    assert.equal(uploaded.body.data.provider, 'local');
    await request(app).get(uploaded.body.data.url).expect(200);
    const event = await request(app)
      .post('/api/admin/events')
      .set('Authorization', auth())
      .send(eventInput({ coverImage: uploaded.body.data, status: 'published' }))
      .expect(201);
    assert.equal(event.body.data.coverImage.url, uploaded.body.data.url);
  });
  it('rejects a script disguised as an image', async () => {
    const response = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', auth())
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(415);
    assert.equal(response.body.error.code, 'UNSUPPORTED_IMAGE');
  });
  it('creates short-lived, unique HMAC upload authorization', async () => {
    const liveConfig = loadConfig({
      APP_MODE: 'live',
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      SUPABASE_SECRET_KEY: 'sb_secret_test',
      IMAGEKIT_PUBLIC_KEY: 'public_test',
      IMAGEKIT_PRIVATE_KEY: 'private_test',
      IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/test',
    });
    const storage = new ImageKitStorage(liveConfig);
    const plan = await storage.getUploadPlan();
    assert.equal(plan.mode, 'direct');
    if (plan.mode !== 'direct') return;
    assert.equal(
      plan.signature,
      createHmac('sha1', 'private_test')
        .update(plan.token + plan.expire)
        .digest('hex'),
    );
    assert.ok(plan.expire > Date.now() / 1000 && plan.expire <= Date.now() / 1000 + 300);
    const second = await storage.getUploadPlan();
    assert.notEqual(second.token, plan.token);
  });
  it('verifies ImageKit metadata server-side and rejects another school’s folder', async () => {
    const liveConfig = loadConfig({
      APP_MODE: 'live',
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      SUPABASE_SECRET_KEY: 'sb_secret_test',
      IMAGEKIT_PUBLIC_KEY: 'public_test',
      IMAGEKIT_PRIVATE_KEY: 'private_test',
      IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/test',
    });
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          fileId: 'abc123',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1024,
          filePath: '/another-school/uploads/photo.jpg',
          url: 'https://ik.imagekit.io/test/photo.jpg',
        }),
        { status: 200 },
      );
    try {
      await assert.rejects(new ImageKitStorage(liveConfig).verifyUpload('abc123'), /upload folder/);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('private family enquiries', () => {
  it('stores an enquiry for the owner, then archives and deletes it', async () => {
    const input = {
      name: 'Test Family',
      email: 'family@example.com',
      phone: '',
      studentGrade: 'Grade 3',
      message: 'We would like to arrange a visit.',
    };
    const created = await request(app).post('/api/inquiries').send(input).expect(201);
    await request(app).get('/api/inquiries').expect(404);
    const list = await request(app)
      .get('/api/admin/inquiries')
      .set('Authorization', auth())
      .expect(200);
    assert.ok(
      list.body.data.items.some((item: { id: string }) => item.id === created.body.data.id),
    );
    await request(app)
      .patch(`/api/admin/inquiries/${created.body.data.id}`)
      .set('Authorization', auth())
      .send({ status: 'archived' })
      .expect(200);
    await request(app)
      .delete(`/api/admin/inquiries/${created.body.data.id}`)
      .set('Authorization', auth())
      .expect(204);
  });
  it('rejects honeypot spam and invalid contact details', async () => {
    await request(app)
      .post('/api/inquiries')
      .send({ name: 'Bot', email: 'bot@example.com', message: 'Spam', website: 'spam.example' })
      .expect(422);
    await request(app)
      .post('/api/inquiries')
      .send({ name: 'Family', email: 'not-an-email', message: 'Hello' })
      .expect(422);
  });
});
