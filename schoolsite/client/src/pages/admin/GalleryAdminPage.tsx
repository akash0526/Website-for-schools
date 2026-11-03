import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  EyeOff,
  Globe,
  ImagePlus,
  Images,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { api, uploadImage } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Album, Page, Photo as PhotoType } from '../../types';
import { formatDate } from '../../lib/format';
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Photo,
  Spinner,
  StatusBadge,
} from '../../components/ui';
import { albumFields } from './resources';
import { ResourceEditor } from './ResourceEditor';
import { serializeFields } from './FormFields';
import type { Values } from './form-types';
export function GalleryAdminPage() {
  const [page, setPage] = useState(1),
    { data, loading, error, refresh } = useApi<Page<Album>>(`/admin/albums?page=${page}&limit=12`);
  const [editing, setEditing] = useState<Album | 'new' | null>(null),
    [deleting, setDeleting] = useState<Album | null>(null),
    [busy, setBusy] = useState(false),
    notify = useToast();
  const save = async (values: Values) => {
    if (editing === 'new') await api.post('/admin/albums', values);
    else if (editing) await api.patch(`/admin/albums/${editing.id}`, values);
    setEditing(null);
    refresh();
    notify('Album saved. Add a few memories when you’re ready.');
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/albums/${deleting.id}`);
      setDeleting(null);
      refresh();
      notify('Album and its photo entries deleted.');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (album: Album) => {
    setBusy(true);
    try {
      await api.patch(`/admin/albums/${album.id}`, {
        status: album.status === 'published' ? 'draft' : 'published',
      });
      refresh();
      notify(album.status === 'published' ? 'Album moved to drafts.' : 'Your album is live.');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">THE EVERYDAY EXTRAORDINARY</span>
          <h1>Photo gallery</h1>
          <p>Collect the little moments that tell your school’s big story.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={18} />
          Create an album
        </button>
      </div>
      <div className="admin-tip gallery-tip">
        <Images size={21} />
        <p>
          <strong>Memories, shared responsibly.</strong> Upload only photos you have permission to
          publish. Avoid names, addresses, or other identifying details in captions.
        </p>
      </div>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} retry={refresh} />
      ) : data?.items.length ? (
        <div className="admin-album-grid">
          {data.items.map((album) => (
            <article className="admin-album-card" key={album.id}>
              <Link to={`/admin/gallery/${album.id}`} className="admin-album-cover">
                <Photo image={album.coverImage} />
                <span>
                  <ImagePlus size={20} />
                  Manage photos
                </span>
              </Link>
              <div className="admin-album-body">
                <div>
                  <span className="album-meta">
                    {formatDate(album.eventDate)} · {album.photoCount || 0} photos
                  </span>
                  <StatusBadge status={album.status} />
                </div>
                <Link to={`/admin/gallery/${album.id}`}>
                  <h2>{album.title}</h2>
                </Link>
                <p>{album.description}</p>
                <div className="admin-album-actions">
                  <button className="text-link" disabled={busy} onClick={() => void toggle(album)}>
                    {album.status === 'published' ? <EyeOff size={15} /> : <Globe size={15} />}
                    {album.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <div>
                    {album.status === 'published' && (
                      <Link
                        className="icon-btn"
                        to={`/gallery/${album.id}`}
                        target="_blank"
                        aria-label={`View ${album.title}`}
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    )}
                    <button
                      className="icon-btn"
                      onClick={() => setEditing(album)}
                      aria-label={`Edit ${album.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn danger-text"
                      onClick={() => setDeleting(album)}
                      aria-label={`Delete ${album.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Every memory starts somewhere."
          description="Create an album for a school event, a classroom project, or just a lovely ordinary day."
          action={
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={17} />
              Create your first album
            </button>
          }
        />
      )}
      {data && <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />}
      {editing && (
        <ResourceEditor
          title={editing === 'new' ? 'Create a photo album' : 'Edit album'}
          fields={albumFields}
          initial={
            editing === 'new'
              ? {
                  title: '',
                  description: '',
                  eventDate: new Date().toISOString().slice(0, 10),
                  coverImage: null,
                  status: 'draft',
                }
              : editing
          }
          onClose={() => setEditing(null)}
          onSave={save}
          description="Create the album first, then open it to upload photos. Keep it as a draft until everything is ready."
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this album?"
          description={`“${deleting.title}” and all its photo entries will be permanently removed from the website. Original files remain in image storage. This cannot be undone.`}
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
export function AlbumAdminPage() {
  const { id } = useParams(),
    albumApi = useApi<Album>(`/admin/albums/${id}`),
    photosApi = useApi<Page<PhotoType>>(`/admin/albums/${id}/photos`);
  const [page, setPage] = useState(1),
    [uploading, setUploading] = useState(false),
    [progress, setProgress] = useState({ done: 0, total: 0 }),
    [editing, setEditing] = useState<PhotoType | null>(null),
    [deleting, setDeleting] = useState<PhotoType | null>(null),
    [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    notify = useToast(),
    { config } = useAuth();
  const pagedPhotos = useApi<Page<PhotoType>>(
    page === 1 ? null : `/admin/albums/${id}/photos?page=${page}`,
  );
  const photos = page === 1 ? photosApi.data : pagedPhotos.data,
    loading = page === 1 ? photosApi.loading : pagedPhotos.loading;
  const refresh = () => {
    photosApi.refresh();
    pagedPhotos.refresh();
    albumApi.refresh();
  };
  const upload = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    const chosen = Array.from(files);
    if (chosen.length > 10) {
      notify('Choose up to 10 photos at a time.', 'error');
      return;
    }
    setUploading(true);
    setProgress({ done: 0, total: chosen.length });
    let successes = 0;
    const failures: string[] = [];
    for (let i = 0; i < chosen.length; i++) {
      try {
        const image = await uploadImage(chosen[i]);
        await api.post('/admin/photos', {
          albumId: id,
          image,
          caption: image.alt || '',
          sortOrder: (photosApi.data?.total || 0) + i,
        });
        successes++;
      } catch (e) {
        failures.push(`${chosen[i].name}: ${(e as Error).message}`);
      }
      setProgress({ done: i + 1, total: chosen.length });
    }
    setUploading(false);
    if (input.current) input.current.value = '';
    refresh();
    if (successes)
      notify(`${successes} ${successes === 1 ? 'memory' : 'memories'} added to your album.`);
    if (failures.length)
      notify(
        `${failures.length} upload${failures.length === 1 ? '' : 's'} failed. ${failures[0]}`,
        'error',
      );
  };
  const save = async (values: Values) => {
    if (!editing) return;
    await api.patch(`/admin/photos/${editing.id}`, values);
    setEditing(null);
    refresh();
    notify('Photo details saved.');
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/photos/${deleting.id}`);
      setDeleting(null);
      refresh();
      notify('Photo removed from this album.');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const toggle = async () => {
    if (!albumApi.data) return;
    setBusy(true);
    try {
      await api.patch(`/admin/albums/${id}`, {
        status: albumApi.data.status === 'published' ? 'draft' : 'published',
      });
      refresh();
      notify('Album visibility updated.');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  if (albumApi.loading) return <Spinner />;
  if (!albumApi.data) return <ErrorState message={albumApi.error} retry={albumApi.refresh} />;
  const album = albumApi.data;
  return (
    <div className="admin-page">
      <Link to="/admin/gallery" className="back-link">
        <ArrowLeft size={16} />
        All photo albums
      </Link>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">{formatDate(album.eventDate)}</span>
          <h1>{album.title}</h1>
          <p>{album.description || 'A collection of little moments, all in one place.'}</p>
        </div>
        <div className="heading-actions">
          <StatusBadge status={album.status} />
          <button className="btn btn-outline" disabled={busy} onClick={() => void toggle()}>
            {album.status === 'published' ? <EyeOff size={16} /> : <Globe size={16} />}
            {album.status === 'published' ? 'Unpublish album' : 'Publish album'}
          </button>
        </div>
      </div>
      {album.status === 'draft' && (
        <div className="admin-tip">
          <EyeOff size={19} />
          <p>
            This album is a draft. Upload and arrange your photos, then publish the album when
            you’re ready for families to see it.
          </p>
        </div>
      )}
      <div
        className={`gallery-upload-zone ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
      >
        <span className="upload-zone-icon">
          {uploading ? (
            <LoaderCircle size={29} className="spin" />
          ) : (
            <UploadCloud size={31} strokeWidth={1.4} />
          )}
        </span>
        <div>
          <h2>
            {uploading
              ? `Adding your memories… ${progress.done} of ${progress.total}`
              : 'A few moments worth keeping.'}
          </h2>
          <p>
            {uploading
              ? 'Please keep this window open until the upload finishes.'
              : `Drop photos here, or choose up to 10 at a time. JPEG, PNG, or WebP · ${Math.round((config?.uploads.maxBytes || 5242880) / 1024 / 1024)} MB each.`}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={17} />
          {uploading ? 'Uploading…' : 'Choose photos'}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void upload(e.target.files)}
        />
        {uploading && (
          <progress max={progress.total} value={progress.done} aria-label="Photo upload progress" />
        )}
      </div>
      {loading && !photos ? (
        <Spinner />
      ) : photos?.items.length ? (
        <div className="admin-photo-grid">
          {photos.items.map((photo) => (
            <article className="admin-photo-card" key={photo.id}>
              <Photo image={photo.image} />
              <div>
                <p>{photo.caption || 'A school moment'}</p>
                <div>
                  <button className="text-link" onClick={() => setEditing(photo)}>
                    <Pencil size={14} />
                    Edit details
                  </button>
                  <button
                    className="icon-btn danger-text"
                    aria-label={`Delete photo ${photo.caption || ''}`}
                    onClick={() => setDeleting(photo)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Ready for your first memory."
          description="Upload a few photographs to bring this album to life."
        />
      )}
      {photos && (
        <Pagination page={page} total={photos.total} limit={photos.limit} onChange={setPage} />
      )}
      {editing && (
        <ResourceEditor
          title="A little more about this photo"
          fields={[
            {
              name: 'caption',
              label: 'Photo caption',
              type: 'text',
              full: true,
              max: 250,
              help: 'Keep captions friendly and avoid identifying children.',
            },
            { name: 'sortOrder', label: 'Display order', type: 'number', min: 0, max: 9999 },
            { name: 'image', label: 'Photograph', type: 'image', full: true },
          ]}
          initial={serializeFields(
            [
              { name: 'caption', label: '', type: 'text' },
              { name: 'sortOrder', label: '', type: 'number' },
              { name: 'image', label: '', type: 'image' },
            ],
            editing,
          )}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Remove this photo?"
          description="This photo will be removed from the album and public gallery. Its original file is retained in image storage."
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
