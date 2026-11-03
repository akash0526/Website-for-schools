import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock3, Download, MapPin, Share2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../context/ToastContext';
import type { SchoolEvent } from '../types';
import { downloadCalendar, formatDate, formatTime } from '../lib/format';
import { ErrorState, Photo, Spinner } from '../components/ui';
export function EventDetailPage() {
  const { slug } = useParams(),
    { data: event, loading, error, refresh } = useApi<SchoolEvent>(`/events/${slug}`),
    notify = useToast();
  usePageTitle(event?.title || 'School event');
  if (loading) return <Spinner />;
  if (!event) return <ErrorState message={error} retry={refresh} />;
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Event link copied. Share the good things.');
    } catch {
      notify('Copy the event link from your browser’s address bar.', 'error');
    }
  };
  return (
    <article className="event-detail container section">
      <Link to="/events" className="back-link">
        ← Back to all events
      </Link>
      <div className="detail-title">
        <span className={`category category-${event.category.toLowerCase()}`}>
          {event.category}
        </span>
        <h1>{event.title}</h1>
        <p>Another chapter in our school story. We’d love you to be part of it.</p>
      </div>
      <div className="event-detail-grid">
        <Photo image={event.coverImage} className="detail-cover" eager />
        <aside className="event-info-card">
          <span className="eyebrow">THE DETAILS</span>
          <h2>
            Make a little room
            <br />
            on your calendar.
          </h2>
          <div className="event-info-row">
            <CalendarDays size={21} />
            <div>
              <strong>{formatDate(event.startsAt, { weekday: 'long' })}</strong>
              {event.endsAt && event.endsAt.slice(0, 10) !== event.startsAt.slice(0, 10) && (
                <span>to {formatDate(event.endsAt)}</span>
              )}
            </div>
          </div>
          <div className="event-info-row">
            <Clock3 size={21} />
            <div>
              <strong>
                {formatTime(event.startsAt)}
                {event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}
              </strong>
              <span>{Intl.DateTimeFormat().resolvedOptions().timeZone} · your local time</span>
            </div>
          </div>
          <div className="event-info-row">
            <MapPin size={21} />
            <div>
              <strong>{event.location}</strong>
              <span>Please check in at reception.</span>
            </div>
          </div>
          <button className="btn btn-primary full-width" onClick={() => downloadCalendar(event)}>
            <Download size={17} />
            Add to my calendar
          </button>
          <button className="btn btn-outline full-width" onClick={share}>
            <Share2 size={16} />
            Share this event
          </button>
        </aside>
      </div>
      <div className="event-description">
        <span className="eyebrow">A LITTLE MORE ABOUT THE DAY</span>
        <h2>Good things to know.</h2>
        <div className="prose">
          {event.description.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="inline-help">
          <CalendarDays size={22} />
          <p>
            Have a question about this event?{' '}
            <Link to="/contact">
              Our school office is happy to help.
              <ArrowUpRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}
