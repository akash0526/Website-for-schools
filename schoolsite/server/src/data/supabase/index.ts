import type { Album, SchoolSettings } from '../../domain/models.js';
import type { AlbumRepository, ListQuery, Repositories } from '../../domain/ports.js';
import { DataError, notFound } from '../../middleware/errors.js';
import type { Config } from '../../config/env.js';
import { createDatabaseClient } from './client.js';
import { fromRow, SupabaseRepository, toRow } from './repository.js';

class SupabaseAlbumRepository extends SupabaseRepository<Album> implements AlbumRepository {
  async listSummaries(query: ListQuery<Album> = {}) {
    const page = query.page || 1, limit = query.limit || 50;
    let builder = this.client.from(this.table).select('*, photos(count)', { count: 'exact' });
    for (const f of query.filters || []) {
      const key = f.field.replace(/[A-Z]/g, v => `_${v.toLowerCase()}`);
      if (f.op === 'eq') builder = builder.eq(key, f.value);
      else if (f.op === 'in') builder = builder.in(key, f.value as string[]);
      else if (f.op === 'gte') builder = builder.gte(key, f.value);
      else if (f.op === 'lte') builder = builder.lte(key, f.value);
      else builder = builder.ilike(key, `%${String(f.value).replace(/[%_,()]/g, ' ')}%`);
    }
    for (const o of query.order || []) builder = builder.order(o.field.replace(/[A-Z]/g, v => `_${v.toLowerCase()}`), { ascending: o.ascending });
    const { data, error, count } = await builder.range((page - 1) * limit, page * limit - 1);
    if (error) throw new DataError();
    return {
      items: (data || []).map(row => ({ ...fromRow<Album>(row), photoCount: Number(row.photos?.[0]?.count || 0) })),
      total: count || 0, page, limit
    };
  }
}
export function createSupabaseRepositories(config: Config): Repositories {
  const client = createDatabaseClient(config);
  return {
    settings: {
      async get() {
        const { data, error } = await client.from('school_settings').select('*').eq('id', 'main').single();
        if (error) throw new DataError('School settings are missing. Run the Supabase migration first.');
        return fromRow<SchoolSettings>(data);
      },
      async save(values) {
        const { data, error } = await client.from('school_settings').update(toRow(values)).eq('id', 'main').select('*').single();
        if (error) throw new DataError();
        if (!data) notFound('School settings');
        return fromRow<SchoolSettings>(data);
      }
    },
    events: new SupabaseRepository(client, 'events'),
    announcements: new SupabaseRepository(client, 'announcements'),
    programs: new SupabaseRepository(client, 'programs'),
    albums: new SupabaseAlbumRepository(client, 'albums'),
    photos: new SupabaseRepository(client, 'photos'),
    inquiries: new SupabaseRepository(client, 'inquiries')
  };
}
