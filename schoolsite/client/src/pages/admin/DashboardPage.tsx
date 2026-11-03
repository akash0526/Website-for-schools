import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  ImagePlus,
  Images,
  Inbox,
  Megaphone,
  PencilLine,
  Plus,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import type { Dashboard } from '../../types';
import { formatDate, formatTime, initials } from '../../lib/format';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../components/ui';
export function DashboardPage() {
  const { user, config } = useAuth(),
    { data, loading, error, refresh } = useApi<Dashboard>('/admin/dashboard');
  if (loading && !data) return <Spinner label="Getting your school day ready…" />;
  if (!data) return <ErrorState message={error} retry={refresh} />;
  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">
            {formatDate(new Date().toISOString(), { weekday: 'long' }).toUpperCase()}
          </span>
          <h1>
            Welcome back, {user?.name.split(' ')[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p>Here’s what’s growing in your school today.</p>
        </div>
        <Link to="/" target="_blank" className="btn btn-outline">
          View website
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">A LITTLE UPDATE GOES A LONG WAY</span>
          <h2>
            Keep your community
            <br />
            part of the story.
          </h2>
          <p>
            A new event, a classroom moment, a helpful notice.
            <br />
            Your school website is ready for its next chapter.
          </p>
          <Link to="/admin/events" className="btn btn-light">
            Add a school event
            <Plus size={17} />
          </Link>
        </div>
        <div className="dashboard-art" aria-hidden="true">
          <div className="art-orbit" />
          <Sprout size={125} strokeWidth={0.9} />
          <span className="art-spark one">✦</span>
          <span className="art-spark two">✦</span>
          <span className="art-note">Good things grow here.</span>
        </div>
      </div>
      <div className="metric-grid">
        {[
          {
            label: 'Upcoming events',
            value: data.upcoming,
            icon: CalendarDays,
            to: '/admin/events',
            note: 'Moments to look forward to',
          },
          {
            label: 'School memories',
            value: data.photos,
            icon: Images,
            to: '/admin/gallery',
            note: `${data.albums} published albums`,
          },
          {
            label: 'Event drafts',
            value: data.drafts,
            icon: PencilLine,
            to: '/admin/events?status=draft',
            note: 'Ready when you are',
          },
          ...(user?.role === 'owner'
            ? [
                {
                  label: 'New enquiries',
                  value: data.inquiries,
                  icon: Inbox,
                  to: '/admin/inquiries',
                  note: 'A new chapter for a family',
                },
              ]
            : []),
        ].map((metric) => (
          <Link className="metric-card" to={metric.to} key={metric.label}>
            <div>
              <span className="metric-icon">
                <metric.icon size={21} strokeWidth={1.6} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <strong>{metric.value}</strong>
            <h3>{metric.label}</h3>
            <p>{metric.note}</p>
          </Link>
        ))}
      </div>
      <div className="dashboard-two-col">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>
              <CalendarDays size={18} />
              Coming up at school
            </h2>
            <Link to="/admin/events">
              All events
              <ArrowRight size={15} />
            </Link>
          </div>
          {data.events.length ? (
            <div className="dashboard-event-list">
              {data.events.map((event) => (
                <Link to="/admin/events" className="dashboard-event" key={event.id}>
                  <div className="mini-date">
                    <strong>{new Date(event.startsAt).getDate()}</strong>
                    <span>
                      {new Date(event.startsAt).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <strong>{event.title}</strong>
                    <span>
                      <Clock3 size={12} />
                      {formatTime(event.startsAt)} · {event.location}
                    </span>
                  </div>
                  <StatusBadge status={event.status} />
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="A clear calendar, for now."
              description="Add your next school event to see it here."
            />
          )}
        </section>
        <section className="admin-panel quick-actions-panel">
          <div className="panel-heading">
            <h2>Make a little update</h2>
            <Sprout size={19} />
          </div>
          <div className="quick-actions">
            {[
              {
                to: '/admin/gallery',
                icon: ImagePlus,
                title: 'Share a school moment',
                text: 'Upload photos to an album',
              },
              {
                to: '/admin/announcements',
                icon: Megaphone,
                title: 'Keep families in the loop',
                text: 'Write a notice or update',
              },
              ...(user?.role === 'owner'
                ? [
                    {
                      to: '/admin/settings',
                      icon: PencilLine,
                      title: 'Make your homepage fresh',
                      text: 'Edit words, images, and details',
                    },
                  ]
                : []),
            ].map((action) => (
              <Link to={action.to} key={action.to}>
                <span>
                  <action.icon size={21} strokeWidth={1.5} />
                </span>
                <div>
                  <strong>{action.title}</strong>
                  <small>{action.text}</small>
                </div>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      {user?.role === 'owner' && (
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>
              <Inbox size={18} />
              Recent conversations
            </h2>
            <Link to="/admin/inquiries">
              All enquiries
              <ArrowRight size={15} />
            </Link>
          </div>
          {data.recentInquiries.length ? (
            <div className="recent-inquiries">
              {data.recentInquiries.map((item) => (
                <Link to="/admin/inquiries" key={item.id}>
                  <span className="avatar-initials">{initials(item.name)}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.studentGrade || 'General enquiry'} · {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your next conversation is on its way."
              description="Website enquiries will appear here."
            />
          )}
        </section>
      )}
      {config?.mode === 'demo' && (
        <div className="admin-tip">
          <Sprout size={21} />
          <p>
            <strong>Your playground, not a live school.</strong> Try adding an event, uploading an
            image, or editing the homepage. Demo changes stay in this workspace. Connect Supabase
            and ImageKit using the setup guide before selling a live copy.
          </p>
        </div>
      )}
    </div>
  );
}
