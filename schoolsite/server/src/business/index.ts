import type {
  Album,
  Announcement,
  Inquiry,
  Photo,
  Program,
  SchoolEvent,
} from '../domain/models.js';
import type { ListQuery, MediaStorage, Repositories } from '../domain/ports.js';
import { AppError, notFound } from '../middleware/errors.js';
import {
  albumSchema,
  announcementSchema,
  editableFields,
  eventSchema,
  inquirySchema,
  photoSchema,
  programSchema,
  settingsSchema,
} from '../validation/schemas.js';
import { ContentService } from './content-service.js';
import { MediaService } from './media-service.js';
import {
  createEventSlug,
  eventPeriodFilters,
  publicationTimestamp,
  publishedFilter,
} from '../logic/content-rules.js';

export class SchoolServices {
  readonly events: ContentService<SchoolEvent, ReturnType<typeof eventSchema.parse>>;
  readonly announcements: ContentService<Announcement, ReturnType<typeof announcementSchema.parse>>;
  readonly programs: ContentService<Program, ReturnType<typeof programSchema.parse>>;
  readonly albums: ContentService<Album, ReturnType<typeof albumSchema.parse>>;
  readonly photos: ContentService<Photo, ReturnType<typeof photoSchema.parse>>;
  readonly media: MediaService;
  constructor(
    readonly repositories: Repositories,
    readonly storage: MediaStorage,
  ) {
    this.media = new MediaService(storage);
    this.events = new ContentService(
      repositories.events,
      eventSchema,
      'Event',
      async (input, existing) => ({
        ...(await this.media.prepareFields(input, existing)),
        slug: existing?.slug || createEventSlug(input.title),
      }),
    );
    this.announcements = new ContentService(
      repositories.announcements,
      announcementSchema,
      'Announcement',
      async (input, existing) => ({
        ...input,
        publishedAt: publicationTimestamp(
          input.status,
          existing?.publishedAt,
          new Date().toISOString(),
        ),
      }),
    );
    this.programs = new ContentService(repositories.programs, programSchema, 'Program');
    this.albums = new ContentService(repositories.albums, albumSchema, 'Album', (input, existing) =>
      this.media.prepareFields(input, existing),
    );
    this.photos = new ContentService(
      repositories.photos,
      photoSchema,
      'Photo',
      async (input, existing) => {
        const album = await repositories.albums.findById(input.albumId);
        if (!album) throw new AppError(422, 'INVALID_ALBUM', 'Choose an existing album.');
        return this.media.prepareFields(input, existing);
      },
    );
  }
  async settings() {
    return this.repositories.settings.get();
  }
  async updateSettings(raw: unknown) {
    const existing = await this.settings();
    const input = settingsSchema.parse(editableFields({ ...existing, ...(raw as object) }));
    return this.repositories.settings.save(await this.media.prepareFields(input, existing));
  }
  async home() {
    const [settings, events, announcements, programs, albums, gallery] = await Promise.all([
      this.settings(),
      this.upcomingEvents({ page: 1, limit: 3 }),
      this.publicAnnouncements({ page: 1, limit: 3 }),
      this.repositories.programs.list({
        filters: [publishedFilter()],
        order: [{ field: 'sortOrder', ascending: true }],
        limit: 12,
      }),
      this.publicAlbums({ page: 1, limit: 4 }),
      this.galleryPreview(),
    ]);
    return {
      settings,
      events: events.items,
      announcements: announcements.items,
      programs: programs.items,
      albums: albums.items,
      gallery,
    };
  }
  upcomingEvents(query: ListQuery<SchoolEvent> = {}) {
    return this.repositories.events.list({
      ...query,
      filters: [
        publishedFilter<SchoolEvent>(),
        ...eventPeriodFilters('upcoming', new Date().toISOString()),
        ...(query.filters || []),
      ],
      order: [{ field: 'startsAt', ascending: true }],
    });
  }
  publicEvents(
    query: ListQuery<SchoolEvent> = {},
    period: 'upcoming' | 'past' | 'all' = 'upcoming',
  ) {
    if (period === 'upcoming') return this.upcomingEvents(query);
    return this.repositories.events.list({
      ...query,
      filters: [
        publishedFilter<SchoolEvent>(),
        ...eventPeriodFilters(period, new Date().toISOString()),
        ...(query.filters || []),
      ],
      order: [{ field: 'startsAt', ascending: period !== 'past' }],
    });
  }
  async eventBySlug(slug: string) {
    const result = await this.repositories.events.list({
      filters: [publishedFilter<SchoolEvent>(), { field: 'slug', op: 'eq', value: slug }],
      limit: 1,
    });
    if (!result.items[0]) notFound('Event');
    return result.items[0];
  }
  publicAnnouncements(query: ListQuery<Announcement> = {}) {
    return this.repositories.announcements.list({
      ...query,
      filters: [publishedFilter<Announcement>()],
      order: [
        { field: 'pinned', ascending: false },
        { field: 'publishedAt', ascending: false },
      ],
    });
  }
  async publicAnnouncement(id: string) {
    const item = await this.repositories.announcements.findById(id);
    if (!item || item.status !== 'published') notFound('Announcement');
    return item;
  }
  publicAlbums(query: ListQuery<Album> = {}) {
    return this.repositories.albums.listSummaries({
      ...query,
      filters: [publishedFilter<Album>()],
      order: [{ field: 'eventDate', ascending: false }],
    });
  }
  async albumDetails(id: string) {
    const album = await this.repositories.albums.findById(id);
    if (!album || album.status !== 'published') notFound('Album');
    const photos = await this.repositories.photos.list({
      filters: [{ field: 'albumId', op: 'eq', value: id }],
      order: [
        { field: 'sortOrder', ascending: true },
        { field: 'createdAt', ascending: true },
      ],
      limit: 100,
    });
    return {
      ...album,
      photos: photos.items,
      photoTotal: photos.total,
      page: photos.page,
      limit: photos.limit,
    };
  }
  async albumPhotos(id: string, page = 1) {
    await this.albumDetails(id);
    return this.repositories.photos.list({
      filters: [{ field: 'albumId', op: 'eq', value: id }],
      order: [
        { field: 'sortOrder', ascending: true },
        { field: 'createdAt', ascending: true },
      ],
      page,
      limit: 100,
    });
  }
  private async galleryPreview() {
    const albums = await this.repositories.albums.list({
      filters: [publishedFilter<Album>()],
      order: [{ field: 'eventDate', ascending: false }],
      limit: 100,
    });
    if (!albums.items.length) return [];
    const photos = await this.repositories.photos.list({
      filters: [{ field: 'albumId', op: 'in', value: albums.items.map((a) => a.id) }],
      order: [{ field: 'createdAt', ascending: false }],
      limit: 8,
    });
    return photos.items.map((photo) => ({
      ...photo,
      albumTitle: albums.items.find((a) => a.id === photo.albumId)?.title || '',
    }));
  }
  async addPhoto(raw: unknown) {
    const photo = await this.photos.create(raw);
    const album = await this.repositories.albums.findById(photo.albumId);
    if (album && !album.coverImage)
      await this.repositories.albums.update(album.id, { coverImage: photo.image });
    return photo;
  }
  async removeAlbum(id: string) {
    await this.albums.get(id);
    // Database FK cascades in live mode; explicitly clean up every demo photo, including large albums.
    if (this.storage.mode === 'local') {
      let remaining = await this.repositories.photos.list({
        filters: [{ field: 'albumId', op: 'eq', value: id }],
        limit: 100,
      });
      while (remaining.items.length) {
        for (const photo of remaining.items) await this.repositories.photos.delete(photo.id);
        remaining = await this.repositories.photos.list({
          filters: [{ field: 'albumId', op: 'eq', value: id }],
          limit: 100,
        });
      }
    }
    await this.repositories.albums.delete(id);
  }
  async createInquiry(raw: unknown) {
    const { website: _website, ...input } = inquirySchema.parse(raw);
    const inquiry = await this.repositories.inquiries.create({ ...input, status: 'new' });
    return { id: inquiry.id, received: true };
  }
  listInquiries(query: ListQuery<Inquiry> = {}) {
    return this.repositories.inquiries.list({
      ...query,
      order: [{ field: 'createdAt', ascending: false }],
    });
  }
  async updateInquiry(id: string, status: Inquiry['status']) {
    const item = await this.repositories.inquiries.update(id, { status });
    if (!item) notFound('Enquiry');
    return item;
  }
  async removeInquiry(id: string) {
    const deleted = await this.repositories.inquiries.delete(id);
    if (!deleted) notFound('Enquiry');
  }
  async dashboard() {
    const [upcoming, drafts, photos, albums, inquiries, events, recentInquiries] =
      await Promise.all([
        this.repositories.events.count([
          publishedFilter<SchoolEvent>(),
          { field: 'startsAt', op: 'gte', value: new Date().toISOString() },
        ]),
        this.repositories.events.count([{ field: 'status', op: 'eq', value: 'draft' }]),
        this.repositories.photos.count(),
        this.repositories.albums.count([publishedFilter<Album>()]),
        this.repositories.inquiries.count([{ field: 'status', op: 'eq', value: 'new' }]),
        this.upcomingEvents({ limit: 4 }),
        this.listInquiries({ limit: 4 }),
      ]);
    return {
      upcoming,
      drafts,
      photos,
      albums,
      inquiries,
      events: events.items,
      recentInquiries: recentInquiries.items,
    };
  }
}
