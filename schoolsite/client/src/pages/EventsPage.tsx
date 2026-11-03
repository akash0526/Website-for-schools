import { useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { useApi, useDebounced } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import type { Page, SchoolEvent } from '../types';
import { EmptyState, ErrorState, PageHeading, Pagination, Spinner } from '../components/ui';
import { EventCard } from '../components/EventCard';
export function EventsPage() {
  usePageTitle('School life & events');
  const [period, setPeriod] = useState('upcoming'),
    [category, setCategory] = useState(''),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, loading, error, refresh } = useApi<Page<SchoolEvent>>(
    `/events?period=${period}&page=${page}&limit=9&category=${encodeURIComponent(category)}&search=${encodeURIComponent(q)}`,
  );
  return (
    <>
      <PageHeading
        eyebrow="THE EVERGREEN CALENDAR"
        title="There’s so much to look forward to."
        description="Big discoveries, small victories, and good times together. Find your next school moment."
      />
      <section className="section">
        <div className="container">
          <div className="filter-bar">
            <div className="segmented-control" aria-label="Event period">
              {[
                ['upcoming', 'Upcoming events'],
                ['past', 'Past events'],
                ['all', 'All events'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={period === value ? 'selected' : ''}
                  aria-pressed={period === value}
                  onClick={() => {
                    setPeriod(value);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="filter-inputs">
              <label className="search-input">
                <Search size={17} />
                <input
                  aria-label="Search events"
                  placeholder="Find an event…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>
                {['Academic', 'Community', 'Sports', 'Arts', 'Celebration'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="timezone-note">
            <CalendarDays size={14} />
            Times are shown in your device’s time zone:{' '}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}.
          </p>
          {loading && !data ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} retry={refresh} />
          ) : data?.items.length ? (
            <div className={`event-grid ${loading ? 'is-loading' : ''}`}>
              {data.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={period === 'upcoming' ? 'New adventures are on the way.' : 'No events found.'}
              description="Try another filter, or check back soon for more school moments."
            />
          )}
          {data && (
            <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
          )}
        </div>
      </section>
    </>
  );
}
