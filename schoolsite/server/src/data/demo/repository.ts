import { randomUUID } from 'node:crypto';
import type {
  Album,
  AlbumSummary,
  CollectionName,
  Entity,
  SchoolSettings,
} from '../../domain/models.js';
import type { AlbumRepository, ListQuery, Repositories, Repository } from '../../domain/ports.js';
import { queryItems } from '../query.js';
import { DemoStore } from './store.js';

export class DemoRepository<T extends Entity> implements Repository<T> {
  constructor(
    protected store: DemoStore,
    protected collection: CollectionName,
  ) {}
  protected items() {
    return this.store.read()[this.collection] as unknown as T[];
  }
  async list(query: ListQuery<T> = {}) {
    return queryItems(this.items(), query);
  }
  async count(filters: ListQuery<T>['filters'] = []) {
    return queryItems(this.items(), { filters, limit: 100000 }).total;
  }
  async findById(id: string) {
    return this.items().find((item) => item.id === id) || null;
  }
  async create(values: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item = { ...values, id: randomUUID(), createdAt: now, updatedAt: now } as T;
    return this.store.update((data) => {
      (data[this.collection] as unknown as T[]).push(item);
      return item;
    });
  }
  async update(id: string, values: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.store.update((data) => {
      const items = data[this.collection] as unknown as T[];
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return null;
      items[index] = { ...items[index], ...values, updatedAt: new Date().toISOString() };
      return items[index];
    });
  }
  async delete(id: string) {
    return this.store.update((data) => {
      const items = data[this.collection] as unknown as T[];
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return false;
      items.splice(index, 1);
      return true;
    });
  }
}
class DemoAlbumRepository extends DemoRepository<Album> implements AlbumRepository {
  async listSummaries(query: ListQuery<Album> = {}) {
    const page = queryItems(this.items(), query);
    const photos = this.store.read().photos;
    const items: AlbumSummary[] = page.items.map((album) => ({
      ...album,
      photoCount: photos.filter((photo) => photo.albumId === album.id).length,
    }));
    return { ...page, items };
  }
}
export function createDemoRepositories(store: DemoStore): Repositories {
  return {
    settings: {
      async get() {
        return store.read().settings;
      },
      async save(values) {
        return store.update((data) => {
          data.settings = {
            ...data.settings,
            ...values,
            updatedAt: new Date().toISOString(),
          } as SchoolSettings;
          return data.settings;
        });
      },
    },
    events: new DemoRepository(store, 'events'),
    announcements: new DemoRepository(store, 'announcements'),
    programs: new DemoRepository(store, 'programs'),
    albums: new DemoAlbumRepository(store, 'albums'),
    photos: new DemoRepository(store, 'photos'),
    inquiries: new DemoRepository(store, 'inquiries'),
  };
}
