import { randomBytes } from 'node:crypto';
import type { SchoolEvent, PublishStatus } from '../domain/models.js';
import type { Filter } from '../domain/ports.js';

/** Pure content rules. No database, HTTP, clock I/O, or provider SDK dependencies. */
export function publishedFilter<T extends { status: string }>(): Filter<T> {
  return { field: 'status' as keyof T & string, op: 'eq', value: 'published' };
}
export function createEventSlug(title: string): string {
  const slug =
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'event';
  return `${slug}-${randomBytes(3).toString('hex')}`;
}
export function eventPeriodFilters(
  period: 'upcoming' | 'past' | 'all',
  now: string,
): Filter<SchoolEvent>[] {
  if (period === 'all') return [];
  return [{ field: 'startsAt', op: period === 'upcoming' ? 'gte' : 'lte', value: now }];
}
export function publicationTimestamp(
  status: PublishStatus,
  existingPublishedAt: string | null | undefined,
  now: string,
): string | null {
  return status === 'published' ? existingPublishedAt || now : null;
}
