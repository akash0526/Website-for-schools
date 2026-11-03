import { useState } from 'react';
import { ArrowUpRight, ChevronRight, Inbox, Mail, Trash2 } from 'lucide-react';
import type { Inquiry, Page } from '../../types';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { formatDate, initials } from '../../lib/format';
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  Spinner,
  StatusBadge,
} from '../../components/ui';
export function InquiriesPage() {
  const [status, setStatus] = useState(''),
    [page, setPage] = useState(1),
    { data, loading, error, refresh } = useApi<Page<Inquiry>>(
      `/admin/inquiries?page=${page}&limit=15&status=${status}`,
    );
  const [selected, setSelected] = useState<Inquiry | null>(null),
    [deleting, setDeleting] = useState<Inquiry | null>(null),
    [busy, setBusy] = useState(false),
    notify = useToast();
  const update = async (item: Inquiry, next: Inquiry['status']) => {
    setBusy(true);
    try {
      const saved = await api.patch<Inquiry>(`/admin/inquiries/${item.id}`, { status: next });
      setSelected(saved);
      refresh();
      notify('Enquiry status updated.');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const open = (item: Inquiry) => {
    setSelected(item);
    if (item.status === 'new') void update(item, 'read');
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/inquiries/${deleting.id}`);
      setDeleting(null);
      refresh();
      notify('Enquiry permanently deleted.');
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
          <span className="eyebrow">A NEW CHAPTER STARTS WITH HELLO</span>
          <h1>Family enquiries</h1>
          <p>Meet the families who could be part of your school’s next chapter.</p>
        </div>
        <span className="privacy-label">
          <Inbox size={16} />
          Only visible to the school owner
        </span>
      </div>
      <div className="admin-panel">
        <div className="table-toolbar">
          <h2>Conversations with your school</h2>
          <select
            aria-label="Filter enquiries"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All enquiries</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} retry={refresh} />
        ) : data?.items.length ? (
          <div className="inquiry-list">
            {data.items.map((item) => (
              <button
                key={item.id}
                className={`inquiry-row ${item.status === 'new' ? 'unread' : ''}`}
                onClick={() => open(item)}
              >
                <span className="avatar-initials">{initials(item.name)}</span>
                <div>
                  <strong>
                    {item.name}
                    {item.status === 'new' && <span className="new-dot" />}
                  </strong>
                  <span>{item.email}</span>
                </div>
                <span className="inquiry-grade">{item.studentGrade || 'General enquiry'}</span>
                <span className="inquiry-date">{formatDate(item.createdAt)}</span>
                <StatusBadge status={item.status} />
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your next conversation is on its way."
            description="When a family uses the website enquiry form, their message will appear here."
          />
        )}
        {data && (
          <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
        )}
      </div>
      <div className="admin-tip">
        <Mail size={20} />
        <p>
          Reply from your school email. This workspace stores enquiries but does not send email
          notifications automatically.
        </p>
      </div>
      {selected && (
        <Modal
          title="A hello from your school community"
          drawer
          onClose={() => setSelected(null)}
          footer={
            <>
              <button
                className="btn btn-outline"
                disabled={busy}
                onClick={() =>
                  void update(selected, selected.status === 'archived' ? 'read' : 'archived')
                }
              >
                {selected.status === 'archived' ? 'Move back to read' : 'Archive enquiry'}
              </button>
              <a
                className="btn btn-primary"
                href={`mailto:${selected.email}?subject=${encodeURIComponent('A hello from your school')}`}
                onClick={() => {
                  if (selected.status !== 'read') void update(selected, 'read');
                }}
              >
                Reply by email
                <ArrowUpRight size={16} />
              </a>
            </>
          }
        >
          <div className="inquiry-detail">
            <span className="avatar-initials large">{initials(selected.name)}</span>
            <h2>{selected.name}</h2>
            <a href={`mailto:${selected.email}`}>{selected.email}</a>
            <div className="inquiry-detail-meta">
              <div>
                <small>Phone</small>
                <strong>{selected.phone || 'Not provided'}</strong>
              </div>
              <div>
                <small>Year group</small>
                <strong>{selected.studentGrade || 'Let’s talk about it'}</strong>
              </div>
              <div>
                <small>Received</small>
                <strong>{formatDate(selected.createdAt)}</strong>
              </div>
              <div>
                <small>Status</small>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            <span className="eyebrow">THEIR MESSAGE</span>
            <div className="inquiry-message">{selected.message}</div>
            <button
              className="text-link danger-text"
              onClick={() => {
                setSelected(null);
                setDeleting(selected);
              }}
            >
              <Trash2 size={15} />
              Permanently delete this enquiry
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this family’s enquiry?"
          description="Their message and contact details will be permanently removed from this workspace. Archive it instead if you may need it later."
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
