import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock3,
  Facebook,
  FlaskConical,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sprout,
  X,
  Youtube,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { Brand, ErrorState, Spinner } from './ui';
const links = [
  { to: '/', label: 'Home' },
  { to: '/our-school', label: 'Our school' },
  { to: '/events', label: 'School life' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Get in touch' },
];
export function PublicLayout() {
  const { settings, loading, error, refresh } = useSchool(),
    { config } = useAuth();
  const [open, setOpen] = useState(false),
    location = useLocation();
  if (loading)
    return (
      <div className="site-boot">
        <Brand />
        <Spinner label="A little world of possibility…" />
      </div>
    );
  if (!settings)
    return (
      <div className="site-boot">
        <Brand />
        <ErrorState message={error || 'School details are not available.'} retry={refresh} />
      </div>
    );
  const s = settings;
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="utility-bar">
        <div className="container">
          <span>
            <Sprout size={13} />
            {s.tagline}
          </span>
          <div>
            <a href={`mailto:${s.email}`}>
              <Mail size={13} />
              {s.email}
            </a>
            <a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}>
              <Phone size={13} />
              {s.phone}
            </a>
          </div>
        </div>
      </div>
      <header className="public-header">
        <div className="container nav-container">
          <Link to="/" aria-label={`${s.name} home`} onClick={() => setOpen(false)}>
            <Brand
              name={s.shortName}
              fullName={
                s.shortName.toLowerCase() === 'evergreen'
                  ? 'International School'
                  : 'Learn · Grow · Belong'
              }
              logo={s.logo}
            />
          </Link>
          <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive || (link.to === '/events' && location.pathname.startsWith('/events'))
                    ? 'active'
                    : ''
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <Link className="btn btn-primary nav-cta" to="/contact#enquire">
              Admissions
              <ArrowUpRight size={17} />
            </Link>
            <button
              className="mobile-menu icon-btn"
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <Link to="/">
                <Brand name={s.shortName} fullName="Learn. Grow. Belong." logo={s.logo} light />
              </Link>
              <p>
                {s.tagline}
                <br />A world of possibility, close to home.
              </p>
              <div className="social-links">
                {s.facebookUrl && (
                  <a href={s.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <Facebook size={18} />
                  </a>
                )}
                {s.instagramUrl && (
                  <a href={s.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram size={18} />
                  </a>
                )}
                {s.youtubeUrl && (
                  <a href={s.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            </div>
            <div className="footer-links">
              <h4>Discover our school</h4>
              <Link to="/our-school">Our story</Link>
              <Link to="/events">Events & school life</Link>
              <Link to="/gallery">Moments gallery</Link>
              <Link to="/news">School notices</Link>
            </div>
            <div className="footer-links">
              <h4>Your next chapter</h4>
              <Link to="/contact#enquire">Admissions enquiries</Link>
              <Link to="/contact">Plan a school visit</Link>
              <Link to="/contact">Contact our team</Link>
              <Link to="/admin">
                School staff login
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="footer-contact">
              <h4>Come say hello</h4>
              <p>
                <MapPin size={17} />
                <span>{s.address}</span>
              </p>
              <a href={`mailto:${s.email}`}>
                <Mail size={16} />
                {s.email}
              </a>
              <a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}>
                <Phone size={16} />
                {s.phone}
              </a>
              <p>
                <Clock3 size={16} />
                <span>{s.officeHours}</span>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {s.name}. All rights reserved.
            </span>
            <span>
              Made for little minds and big possibilities.
              <Sprout size={14} />
            </span>
          </div>
        </div>
      </footer>
      {config?.mode === 'demo' && (
        <Link to="/admin" className="demo-pill">
          <FlaskConical size={14} />
          <span>Demo website</span>
          <span className="demo-pill-action">
            Try the admin
            <ArrowUpRight size={13} />
          </span>
        </Link>
      )}
    </>
  );
}
