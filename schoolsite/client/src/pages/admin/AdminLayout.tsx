import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  FlaskConical,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings2,
  ShieldCheck,
  Sprout,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { useToast } from '../../context/ToastContext';
import { initials } from '../../lib/format';
import { Brand, Spinner } from '../../components/ui';
export function AdminLayout({ ownerOnly = false }: { ownerOnly?: boolean }) {
  const { user, ready, logout, config } = useAuth(),
    { settings } = useSchool(),
    location = useLocation(),
    notify = useToast();
  const [open, setOpen] = useState(false);
  if (!ready)
    return (
      <div className="site-boot">
        <Brand />
        <Spinner label="Checking your school access…" />
      </div>
    );
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (ownerOnly && user.role !== 'owner')
    return (
      <div className="access-denied">
        <ShieldCheck size={42} />
        <h1>A little extra permission is needed.</h1>
        <p>
          Only the school owner can access this area. Your editor account can still manage events,
          photos, notices, and programs.
        </p>
        <Link to="/admin" className="btn btn-primary">
          Back to overview
        </Link>
      </div>
    );
  const links = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/events', label: 'School events', icon: CalendarDays },
    { to: '/admin/announcements', label: 'School notices', icon: Megaphone },
    { to: '/admin/gallery', label: 'Photo gallery', icon: Images },
    { to: '/admin/programs', label: 'Learning programs', icon: Sprout },
    ...(user.role === 'owner'
      ? [
          { to: '/admin/inquiries', label: 'Family enquiries', icon: Inbox },
          { to: '/admin/settings', label: 'Website settings', icon: Settings2 },
        ]
      : []),
  ];
  const signOut = async () => {
    try {
      await logout();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };
  return (
    <div className="admin-shell">
      <a href="#admin-content" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <Link className="sidebar-brand" to="/admin" onClick={() => setOpen(false)}>
          <Brand
            name={settings?.shortName || 'evergreen'}
            fullName="School workspace"
            logo={settings?.logo}
            light
          />
          <span className="sidebar-brand-dot" />
        </Link>
        <div className="workspace-label">YOUR SCHOOL WORKSPACE</div>
        <nav aria-label="Administrator navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              onClick={() => setOpen(false)}
            >
              <link.icon size={19} strokeWidth={1.7} />
              <span>{link.label}</span>
              <ChevronRight className="sidebar-chevron" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <Sprout size={27} strokeWidth={1.3} />
            <strong>A little help to grow.</strong>
            <p>Your website, without the overwhelm.</p>
            <Link to="/" target="_blank">
              See your school website
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="sidebar-user">
            <span className="avatar-initials">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.role === 'owner' ? 'School owner' : 'Content editor'}</span>
            </div>
            <button aria-label="Sign out" title="Sign out" onClick={() => void signOut()}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-btn admin-mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="breadcrumb-school">School workspace</span>
            <ChevronRight size={14} />
            <strong>
              {links.find((link) => link.to === location.pathname)?.label ||
                (location.pathname.startsWith('/admin/gallery/')
                  ? 'Album photos'
                  : 'Your workspace')}
            </strong>
          </div>
          <div>
            {config?.mode === 'demo' && (
              <span className="demo-badge">
                <FlaskConical size={13} />
                Demo mode
              </span>
            )}
            <Link to="/" target="_blank" className="topbar-website">
              View website
              <ArrowUpRight size={15} />
            </Link>
            <span className="topbar-avatar">{initials(user.name)}</span>
          </div>
        </header>
        {config?.mode === 'demo' && (
          <div className="demo-workspace-banner">
            <FlaskConical size={14} />
            <span>
              A safe space to try things. This is a fictional school; changes are saved in this demo
              workspace.
            </span>
          </div>
        )}
        <main id="admin-content" className="admin-content">
          <Outlet />
        </main>
        <footer className="admin-footer">
          <span>Made for schools. Built for belonging.</span>
          <span>
            <ShieldCheck size={13} />
            Your school’s content, in your hands.
          </span>
        </footer>
      </div>
    </div>
  );
}
