import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  LoaderCircle,
  SearchX,
  Sprout,
  X,
} from 'lucide-react';
import type { Media } from '../types';

export function Brand({
  name = 'evergreen',
  fullName = 'International School',
  logo,
  light = false,
}: {
  name?: string;
  fullName?: string;
  logo?: Media | null;
  light?: boolean;
}) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      {logo ? (
        <img className="brand-custom" src={logo.url} alt={logo.alt || name} />
      ) : (
        <span className="brand-mark">
          <Sprout strokeWidth={1.7} size={31} />
        </span>
      )}
      <span className="brand-type">
        <strong>{name}</strong>
        <small>{fullName}</small>
      </span>
    </span>
  );
}
export function Photo({
  image,
  className = '',
  eager = false,
}: {
  image: Media | null | undefined;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image?.url]);
  return (
    <div className={`photo ${className}`}>
      {image && !failed ? (
        <img
          src={image.url}
          alt={image.alt || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo-placeholder">
          <ImageOff size={32} strokeWidth={1.2} />
          <span>A moment worth sharing</span>
        </div>
      )}
    </div>
  );
}
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state error-state">
      <AlertCircle size={30} />
      <h3>Let’s try that again.</h3>
      <p>{message}</p>
      {retry && (
        <button className="btn btn-outline" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'Something good is on its way.',
  description = 'Check back soon for updates from our school.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <SearchX size={34} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">
          <span />
          {eyebrow}
        </span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  back,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  back?: { to: string; label: string };
}) {
  return (
    <header className="page-heading">
      <div className="container">
        {back && (
          <Link className="back-link" to={back.to}>
            <ArrowLeft size={16} />
            {back.label}
          </Link>
        )}
        <span className="eyebrow">
          <span />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {status === 'published' ? 'Published' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {total} results · Page {page} of {pages}
      </span>
      <div>
        <button
          className="icon-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="icon-btn"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
let modalLocks = 0;
let previousOverflow = '';
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  drawer = false,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  drawer?: boolean;
  footer?: ReactNode;
}) {
  const id = useId(),
    panel = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    if (modalLocks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const timer = setTimeout(
      () =>
        panel.current
          ?.querySelector<HTMLElement>('input, button, select, textarea, [tabindex="0"]')
          ?.focus(),
      30,
    );
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const focusable = panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        );
        if (!focusable?.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', keydown);
      if (--modalLocks === 0) document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div
      className={`modal-overlay ${drawer ? 'drawer-overlay' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? 'modal-wide' : ''} ${drawer ? 'drawer' : ''}`}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <header className="modal-header">
          <h2 id={id}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={21} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
export function ConfirmDialog({
  title,
  description,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <>
          <button className="btn btn-outline" disabled={busy} onClick={onClose}>
            Keep it
          </button>
          <button className="btn btn-danger" disabled={busy} onClick={onConfirm}>
            {busy ? <LoaderCircle className="spin" size={17} /> : null}Delete permanently
          </button>
        </>
      }
    >
      <div className="confirm-content">
        <span className="danger-icon">
          <AlertCircle size={26} />
        </span>
        <p>{description}</p>
      </div>
    </Modal>
  );
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
