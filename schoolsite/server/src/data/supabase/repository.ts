import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Entity } from '../../domain/models.js';
import type { ListQuery, Repository } from '../../domain/ports.js';
import { DataError } from '../../middleware/errors.js';
import type { DatabaseClient } from './client.js';

const snake = (key: string) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const mapObject = (value: Record<string, unknown>, convert: (key: string) => string) => Object.fromEntries(Object.entries(value).map(([key, v]) => [convert(key), v]));
export const fromRow = <T>(row: Record<string, unknown>): T => mapObject(row, camel) as T;
export const toRow = (value: object) => mapObject(value as Record<string, unknown>, snake);
// Filter/query builders are thenable, not native Promises. Keep the full builder type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = PostgrestFilterBuilder<any, any, any, any>;
function applyQuery(builder: QueryBuilder, query: ListQuery<any> = {}): QueryBuilder {
  for (const filter of query.filters || []) {
    const column = snake(filter.field);
    if (filter.op === 'ilike') {
      const safe = String(filter.value).replace(/[\\%_,()]/g, ' ').slice(0, 150);
      builder = builder.ilike(column, `%${safe}%`);
    } else if (filter.op === 'eq') builder = builder.eq(column, filter.value);
    else if (filter.op === 'gte') builder = builder.gte(column, filter.value);
    else if (filter.op === 'lte') builder = builder.lte(column, filter.value);
    else builder = builder.in(column, filter.value as string[]);
  }
  for (const order of query.order || []) builder = builder.order(snake(order.field), { ascending: order.ascending });
  return builder;
}
export class SupabaseRepository<T extends Entity> implements Repository<T> {
  constructor(protected client: DatabaseClient, protected table: string) {}
  async list(query: ListQuery<T> = {}): Promise<{ items: T[]; total: number; page: number; limit: number }> {
    const page = query.page || 1, limit = query.limit || 50;
    const builder = applyQuery(this.client.from(this.table).select('*', { count: 'exact' }), query);
    const { data, error, count } = await builder.range((page - 1) * limit, page * limit - 1);
    if (error) throw new DataError();
    return { items: (data || []).map((row: Record<string, unknown>) => fromRow<T>(row)), total: count || 0, page, limit };
  }
  async count(filters: ListQuery<T>['filters'] = []) {
    const { count, error } = await applyQuery(this.client.from(this.table).select('*', { count: 'exact', head: true }), { filters });
    if (error) throw new DataError();
    return count || 0;
  }
  async findById(id: string) {
    const { data, error } = await this.client.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) throw new DataError();
    return data ? fromRow<T>(data) : null;
  }
  async create(values: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await this.client.from(this.table).insert(toRow(values)).select('*').single();
    if (error) throw new DataError();
    return fromRow<T>(data);
  }
  async update(id: string, values: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) {
    const { data, error } = await this.client.from(this.table).update(toRow(values)).eq('id', id).select('*').maybeSingle();
    if (error) throw new DataError();
    return data ? fromRow<T>(data) : null;
  }
  async delete(id: string) {
    const { data, error } = await this.client.from(this.table).delete().eq('id', id).select('id').maybeSingle();
    if (error) throw new DataError();
    return !!data;
  }
}
