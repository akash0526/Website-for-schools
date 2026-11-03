import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Images, Search } from 'lucide-react';
import { useApi, useDebounced } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import type { Album, Page } from '../types';
import { formatDate } from '../lib/format';
import { EmptyState, ErrorState, PageHeading, Pagination, Photo, Spinner } from '../components/ui';
export function GalleryPage() {
  usePageTitle('Our school in moments');
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    q = useDebounced(search);
  const { data, loading, error, refresh } = useApi<Page<Album>>(
    `/albums?page=${page}&limit=12&search=${encodeURIComponent(q)}`,
  );
  return (
    <>
      <PageHeading
        eyebrow="THE EVERYDAY EXTRAORDINARY"
        title="A thousand little stories."
        description="The discoveries, the friendships, the “look what I made!” moments. This is life at our school."
      />
      <section className="section">
        <div className="container">
          <div className="gallery-toolbar">
            <span>
              <Images size={18} />
              Our memories, shared with care.
            </span>
            <label className="search-input">
              <Search size={17} />
              <input
                placeholder="Find a memory…"
                aria-label="Search albums"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
          {loading && !data ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} retry={refresh} />
          ) : data?.items.length ? (
            <div className="album-grid">
              {data.items.map((album) => (
                <Link className="album-card" to={`/gallery/${album.id}`} key={album.id}>
                  <div className="album-cover">
                    <Photo image={album.coverImage} />
                    <span className="album-count">
                      <Images size={14} />
                      {album.photoCount || 0} photos
                    </span>
                    <span className="album-arrow">
                      <ArrowUpRight size={24} />
                    </span>
                  </div>
                  <div className="album-card-body">
                    <span>{formatDate(album.eventDate)}</span>
                    <h2>{album.title}</h2>
                    <p>{album.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Our story is still unfolding."
              description="New albums and school memories will appear here once published."
            />
          )}
          {data && (
            <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
          )}
          <p className="gallery-consent-note">
            Photographs are shared by the school with the appropriate permissions. Please contact
            the school office with any questions about an image.
          </p>
        </div>
      </section>
    </>
  );
}
