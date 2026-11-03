import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import type { SchoolEvent } from '../types';
import { formatDate, formatTime } from '../lib/format';
import { Photo } from './ui';
export function EventCard({ event }: { event: SchoolEvent }) {
  const date = new Date(event.startsAt),
    past = date.getTime() < Date.now();
  return (
    <article className="event-card">
      <Link
        className="event-image-link"
        to={`/events/${event.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Photo image={event.coverImage} />
        <div className="event-date">
          <strong>{date.getDate().toString().padStart(2, '0')}</strong>
          <span>{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
        </div>
        {past && <span className="past-label">Past event</span>}
      </Link>
      <div className="event-card-body">
        <span className={`category category-${event.category.toLowerCase()}`}>
          {event.category}
        </span>
        <h3>
          <Link to={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        <div className="event-meta">
          <span>
            <Clock3 size={14} />
            {formatTime(event.startsAt)}
          </span>
          <span>
            <MapPin size={14} />
            {event.location}
          </span>
        </div>
        <Link
          className="event-card-link"
          to={`/events/${event.slug}`}
          aria-label={`View ${event.title}, ${formatDate(event.startsAt)}`}
        >
          Explore event
          <ArrowUpRight size={19} />
        </Link>
      </div>
    </article>
  );
}
