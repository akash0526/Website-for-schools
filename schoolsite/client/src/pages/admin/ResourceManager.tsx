import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  EyeOff,
  Globe,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Sprout,
  Star,
  Trash2,
} from 'lucide-react';
import type { Entity, Media, Page, Status } from '../../types';
import { api } from '../../lib/api';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
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
import type { FieldConfig, Values } from './form-types';
import { ResourceEditor } from './ResourceEditor';
export type ContentRecord = Entity & { title: string; status: Status; [key: string]: unknown };
export interface ResourceConfig {
  path: string;
  title: string;
  singular: string;
  description: string;
  kind: 'events' | 'announcements' | 'programs';
  fields: FieldConfig[];
  defaults: Values;
}
export function ResourceManager({ config }: { config: ResourceConfig }) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState(params.get('status') || ''),
    [page, setPage] = useState(1),
    q = useDebounced(search);
  const { data, loading, error, refresh } = useApi<Page<ContentRecord>>(
    `/admin/${config.path}?page=${page}&limit=15&status=${status}&search=${encodeURIComponent(q)}`,
  );
  const [editing, setEditing] = useState<ContentRecord | 'new' | null>(null),
    [deleting, setDeleting] = useState<ContentRecord | null>(null),
    [busy, setBusy] = useState(false);
  const notify = useToast();
  const save = async (values: Values) => {
    if (editing === 'new') await api.post(`/admin/${config.path}`, values);
    else if (editing) await api.patch(`/admin/${config.path}/${editing.id}`, values);
    setEditing(null);
    refresh();
    notify(
      `${config.singular} saved. ${values.status === 'published' ? 'It’s live on your website.' : 'Your draft is safe and sound.'}`,
    );
  };
  const toggle = async (item: ContentRecord, field = 'status') => {
    setBusy(true);
    const value =
      field === 'status' ? (item.status === 'published' ? 'draft' : 'published') : !item[field];
    try {
      await api.patch(`/admin/${config.path}/${item.id}`, { [field]: value });
      refresh();
      notify(
        field === 'status'
          ? value === 'published'
            ? 'Published to your school website.'
            : 'Moved to drafts. The public can no longer see it.'
          : 'Updated.',
      );
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/${config.path}/${deleting.id}`);
      setDeleting(null);
      refresh();
      notify(`${config.singular} deleted.`);
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const Icon =
    config.kind === 'events' ? CalendarDays : config.kind === 'announcements' ? Megaphone : Sprout;
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">YOUR SCHOOL, YOUR STORY</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={18} />
          Add {config.singular.toLowerCase()}
        </button>
      </div>
      <div className="admin-panel">
        <div className="table-toolbar">
          <label className="search-input">
            <Search size={17} />
            <input
              placeholder={`Search ${config.title.toLowerCase()}…`}
              aria-label={`Search ${config.title.toLowerCase()}`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Filter by visibility"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All visibility</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} retry={refresh} />
        ) : data?.items.length ? (
          <div className="table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>{config.singular}</th>
                  <th>
                    {config.kind === 'events'
                      ? 'Date & time'
                      : config.kind === 'programs'
                        ? 'Age group'
                        : 'Category'}
                  </th>
                  <th>Visibility</th>
                  <th>
                    {config.kind === 'events'
                      ? 'Featured'
                      : config.kind === 'announcements'
                        ? 'Pinned'
                        : 'Order'}
                  </th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-title-cell">
                        {config.kind === 'events' && (
                          <Photo
                            image={item.coverImage as Media | null}
                            className="table-thumbnail"
                          />
                        )}
                        <div>
                          <strong>{item.title}</strong>
                          <span>
                            {config.kind === 'events'
                              ? String(item.category)
                              : config.kind === 'programs'
                                ? String(item.description).slice(0, 60) + '…'
                                : String(item.body).slice(0, 65) + '…'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {config.kind === 'events'
                        ? formatDate(String(item.startsAt))
                        : config.kind === 'programs'
                          ? String(item.ageRange)
                          : String(item.category)}
                    </td>
                    <td>
                      <button
                        className="status-toggle"
                        disabled={busy}
                        onClick={() => void toggle(item)}
                        title={
                          item.status === 'published' ? 'Unpublish to draft' : 'Publish to website'
                        }
                      >
                        <StatusBadge status={item.status} />
                        {item.status === 'published' ? <EyeOff size={13} /> : <Globe size={13} />}
                      </button>
                    </td>
                    <td>
                      {config.kind === 'programs' ? (
                        <span className="order-number">{String(item.sortOrder)}</span>
                      ) : (
                        <button
                          className={`icon-btn ${item[config.kind === 'events' ? 'featured' : 'pinned'] ? 'is-starred' : ''}`}
                          disabled={busy}
                          aria-label={
                            config.kind === 'events'
                              ? 'Toggle featured event'
                              : 'Toggle pinned notice'
                          }
                          onClick={() =>
                            void toggle(item, config.kind === 'events' ? 'featured' : 'pinned')
                          }
                        >
                          <Star
                            size={17}
                            fill={
                              item[config.kind === 'events' ? 'featured' : 'pinned']
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {config.kind === 'events' && item.status === 'published' && (
                          <Link
                            className="icon-btn"
                            to={`/events/${item.slug}`}
                            target="_blank"
                            aria-label={`View ${item.title}`}
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                        )}
                        <button
                          className="icon-btn"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-btn danger-text"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={`Your first ${config.singular.toLowerCase()} starts here.`}
            description="Create a draft, add the details, and publish whenever you’re ready."
            action={
              <button className="btn btn-primary" onClick={() => setEditing('new')}>
                <Plus size={17} />
                Add {config.singular.toLowerCase()}
              </button>
            }
          />
        )}
        {data && (
          <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
        )}
      </div>
      <div className="admin-tip">
        <Icon size={19} />
        <p>
          <strong>A little tip:</strong> Drafts are just for you. Use the visibility control when
          you’re ready to share with your school community.
        </p>
      </div>
      {editing && (
        <ResourceEditor
          title={
            editing === 'new'
              ? `Add ${config.singular.toLowerCase()}`
              : `Edit ${config.singular.toLowerCase()}`
          }
          fields={config.fields}
          initial={editing === 'new' ? config.defaults : editing}
          description={
            config.kind === 'events'
              ? `Dates use your device’s time zone (${Intl.DateTimeFormat().resolvedOptions().timeZone}) and are stored securely in UTC.`
              : 'Keep it clear, keep it kind, and make it yours. You can save a draft and come back later.'
          }
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete this ${config.singular.toLowerCase()}?`}
          description={`“${deleting.title}” will be permanently removed${deleting.status === 'published' ? ' from your public website' : ''}. Uploaded image files are retained in your media library. This cannot be undone.`}
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
