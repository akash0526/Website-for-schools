import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDate } from '../lib/format';
import type { Album, Page, Photo as PhotoType } from '../types';
import { EmptyState, ErrorState, Modal, PageHeading, Photo, Spinner } from '../components/ui';
type AlbumDetails = Album & {
  photos: PhotoType[];
  photoTotal: number;
  page: number;
  limit: number;
};
export function AlbumPage() {
  const { id } = useParams(),
    { data, loading, error, refresh } = useApi<AlbumDetails>(`/albums/${id}`);
  const [extra, setExtra] = useState<PhotoType[]>([]),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  usePageTitle(data?.title || 'Photo gallery');
  useEffect(() => {
    setExtra([]);
    setPage(1);
    setSelected(null);
  }, [id]);
  const photos = [...(data?.photos || []), ...extra];
  useEffect(() => {
    if (selected === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSelected((v) => (v === null ? null : (v + 1) % photos.length));
      if (e.key === 'ArrowLeft')
        setSelected((v) => (v === null ? null : (v - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, photos.length]);
  const loadMore = async () => {
    setBusy(true);
    setLoadError('');
    try {
      const next = await api.get<Page<PhotoType>>(`/albums/${id}?page=${page + 1}`);
      setExtra((previous) => [...previous, ...next.items]);
      setPage(page + 1);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Spinner />;
  if (!data) return <ErrorState message={error} retry={refresh} />;
  return (
    <>
      <PageHeading
        eyebrow={`${formatDate(data.eventDate)} · SCHOOL MEMORIES`}
        title={data.title}
        description={data.description}
        back={{ to: '/gallery', label: 'Back to all albums' }}
      />
      <section className="section">
        <div className="container">
          {photos.length ? (
            <div className="photo-masonry">
              {photos.map((photo, index) => (
                <button
                  className="photo-tile"
                  key={photo.id}
                  onClick={() => setSelected(index)}
                  aria-label={`Enlarge photo: ${photo.caption || photo.image.alt || index + 1}`}
                >
                  <Photo image={photo.image} />
                  <span className="photo-expand">
                    <Expand size={20} />
                  </span>
                  {photo.caption && <span className="photo-caption">{photo.caption}</span>}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="The memories are on their way."
              description="Our school team will add photographs to this album soon."
            />
          )}
          {photos.length < data.photoTotal && (
            <div className="center-action">
              <button className="btn btn-outline" disabled={busy} onClick={loadMore}>
                {busy
                  ? 'Loading memories…'
                  : `Load more photos (${data.photoTotal - photos.length})`}
              </button>
            </div>
          )}
          {loadError && <ErrorState message={loadError} retry={loadMore} />}
        </div>
      </section>
      {selected !== null && photos[selected] && (
        <Modal title={data.title} wide onClose={() => setSelected(null)}>
          <div className="lightbox">
            <img
              src={photos[selected].image.url}
              alt={photos[selected].image.alt || photos[selected].caption}
            />
            <div className="lightbox-controls">
              <button
                className="icon-btn"
                aria-label="Previous photo"
                onClick={() => setSelected((selected - 1 + photos.length) % photos.length)}
              >
                <ChevronLeft />
              </button>
              <span>
                {selected + 1} / {photos.length}
              </span>
              <button
                className="icon-btn"
                aria-label="Next photo"
                onClick={() => setSelected((selected + 1) % photos.length)}
              >
                <ChevronRight />
              </button>
            </div>
            <p>{photos[selected].caption || photos[selected].image.alt}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
