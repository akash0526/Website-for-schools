import { it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEventSlug,
  eventPeriodFilters,
  publicationTimestamp,
  publishedFilter,
} from '../src/logic/content-rules.js';
it('publication preserves the original date and clears it for drafts', () => {
  assert.equal(publicationTimestamp('published', '2026-01-01', '2026-11-03'), '2026-01-01');
  assert.equal(publicationTimestamp('published', null, '2026-11-03'), '2026-11-03');
  assert.equal(publicationTimestamp('draft', '2026-01-01', '2026-11-03'), null);
});
it('event periods use an explicit instant and exclude drafts at the service boundary', () => {
  assert.deepEqual(eventPeriodFilters('upcoming', 'now'), [
    { field: 'startsAt', op: 'gte', value: 'now' },
  ]);
  assert.deepEqual(eventPeriodFilters('past', 'now'), [
    { field: 'startsAt', op: 'lte', value: 'now' },
  ]);
  assert.deepEqual(eventPeriodFilters('all', 'now'), []);
  assert.deepEqual(publishedFilter(), { field: 'status', op: 'eq', value: 'published' });
});
it('event slugs are URL-safe and do not collide on identical titles', () => {
  const a = createEventSlug('Our School Open Day!'),
    b = createEventSlug('Our School Open Day!');
  assert.match(a, /^our-school-open-day-[a-f0-9]{6}$/);
  assert.notEqual(a, b);
  assert.match(createEventSlug('विद्यालय'), /^event-[a-f0-9]{6}$/);
});
