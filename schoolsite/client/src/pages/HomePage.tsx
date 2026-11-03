import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Heart,
  Megaphone,
  MoveUpRight,
  Quote,
  Sparkles,
  Sprout,
  Sun,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { HomeData } from '../types';
import { number, formatDate } from '../lib/format';
import { EmptyState, ErrorState, Photo, SectionHeading, Spinner, TextLink } from '../components/ui';
import { EventCard } from '../components/EventCard';
import { ProgramCards } from '../components/ProgramCards';
export function HomePage() {
  const { data, loading, error, refresh } = useApi<HomeData>('/home');
  if (loading && !data) return <Spinner label="Opening the school gates…" />;
  if (!data) return <ErrorState message={error} retry={refresh} />;
  const { settings: s, events, announcements, programs, gallery } = data;
  const years = new Date().getFullYear() - s.establishedYear;
  return (
    <>
      {s.admissionsOpen && (
        <div className="admissions-strip">
          <div className="container">
            <span>
              <span className="live-dot" />A new chapter starts here. Admissions are open.
            </span>
            <Link to="/contact#enquire">
              Come grow with us
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-kicker">
              <Sun size={16} />A LITTLE CURIOSITY. A LIFETIME OF POSSIBILITY.
            </span>
            <h1>
              {s.heroTitle.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? 'hero-accent' : ''}>
                  {line}
                </span>
              ))}
            </h1>
            <p>{s.heroSubtitle}</p>
            <div className="hero-actions">
              <Link to="/our-school" className="btn btn-primary btn-lg">
                Discover our school
                <ArrowUpRight size={19} />
              </Link>
              <Link to="/contact" className="hero-secondary">
                Let’s meet
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-community">
              <div className="avatar-stack">
                {[s.aboutImage, s.heroImage].filter(Boolean).map((image, i) => (
                  <img key={i} src={image!.url} alt="" />
                ))}
                <span>
                  <Heart size={15} fill="currentColor" />
                </span>
              </div>
              <div>
                <strong>Every child. Every possibility.</strong>
                <span>A community where you truly belong.</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-shape" />
            <Photo image={s.heroImage} className="hero-photo" eager />
            <div className="hero-sun">
              <Sun size={35} strokeWidth={1.25} />
              <span>
                GOOD THINGS
                <br />
                GROW HERE
              </span>
            </div>
            <div className="years-card">
              <span className="years-icon">
                <Sprout size={32} strokeWidth={1.4} />
              </span>
              <div>
                <strong>
                  {years}
                  <span>+</span>
                </strong>
                <p>
                  years of growing
                  <br />
                  bright futures
                </p>
              </div>
            </div>
            <span className="hero-caption">
              <span />
              Little moments. Lifelong foundations.
            </span>
          </div>
        </div>
        <div className="hero-bottom-doodle" aria-hidden="true">
          <Sparkles size={42} strokeWidth={1} />
        </div>
      </section>
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stats-intro">
            <span className="eyebrow">BIG HEARTS. BRIGHT MINDS.</span>
            <p>
              Room to learn.
              <br />
              Space to become.
            </p>
          </div>
          <div className="stat">
            <strong>
              {number(s.studentCount)}
              <span>+</span>
            </strong>
            <span>curious young minds</span>
          </div>
          <div className="stat">
            <strong>
              {s.teacherCount}
              <span>+</span>
            </strong>
            <span>caring educators</span>
          </div>
          <div className="stat">
            <strong>
              {years}
              <span>+</span>
            </strong>
            <span>years of making a difference</span>
          </div>
        </div>
      </section>
      <section className="section events-section">
        <div className="container">
          <SectionHeading
            eyebrow="MARK YOUR CALENDAR"
            title="Good things are happening."
            description="Learning, laughing, and making memories. There’s always something to look forward to."
            action={<TextLink to="/events">All school events</TextLink>}
          />
          {events.length ? (
            <div className="event-grid">
              {events.slice(0, 3).map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The next adventure is on its way."
              description="Our team is planning something special. Check back for upcoming events."
            />
          )}
        </div>
      </section>
      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-visual">
            <Photo image={s.aboutImage} className="story-photo" />
            <div className="story-quote">
              <Quote size={26} strokeWidth={1.5} />
              <p>
                Children don’t just need to be taught.
                <br />
                <strong>They need to be seen.</strong>
              </p>
              <span>THE WAY WE GROW</span>
            </div>
            <span className="story-spark" aria-hidden="true">
              <Sparkles size={54} strokeWidth={1.1} />
            </span>
          </div>
          <div className="story-content">
            <span className="eyebrow">
              <span />
              WELCOME TO OUR SCHOOL
            </span>
            <h2>{s.aboutTitle}</h2>
            <p>{s.aboutText.split('\n\n')[0]}</p>
            <ul className="check-list">
              <li>
                <span>
                  <Check size={15} />
                </span>
                Curiosity-led learning, every day
              </li>
              <li>
                <span>
                  <Check size={15} />
                </span>
                Kind hearts and confident minds
              </li>
              <li>
                <span>
                  <Check size={15} />
                </span>
                A community that grows together
              </li>
            </ul>
            <TextLink to="/our-school">Get to know us</TextLink>
          </div>
        </div>
      </section>
      {programs.length > 0 && (
        <section className="section programs-section">
          <div className="container">
            <SectionHeading
              eyebrow="A JOURNEY, NOT JUST A DESTINATION"
              title="Learning for every chapter."
              description="From their first big question to their next big step, we’re here for all of it."
              action={
                <span className="handwritten">
                  Find their place.
                  <MoveUpRight size={26} strokeWidth={1.2} />
                </span>
              }
            />
            <ProgramCards programs={programs} />
          </div>
        </section>
      )}
      {gallery.length > 0 && (
        <section className="section gallery-home-section">
          <div className="container">
            <SectionHeading
              eyebrow="LIFE AT OUR SCHOOL"
              title="Little moments. Lasting memories."
              description="A glimpse into our everyday extraordinary."
              action={<TextLink to="/gallery">Explore the gallery</TextLink>}
            />
            <div className="home-gallery">
              {gallery.slice(0, 4).map((photo, i) => (
                <Link
                  to={`/gallery/${photo.albumId}`}
                  className={`home-gallery-item gallery-item-${i}`}
                  key={photo.id}
                >
                  <Photo image={photo.image} />
                  <div className="gallery-hover">
                    <span>{photo.caption || photo.albumTitle}</span>
                    <ArrowUpRight size={22} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {announcements.length > 0 && (
        <section className="section notice-section">
          <div className="container notice-grid">
            <div>
              <span className="eyebrow">
                <span />
                FROM THE SCHOOL OFFICE
              </span>
              <h2>
                A little update.
                <br />A lot to know.
              </h2>
              <TextLink to="/news">All school notices</TextLink>
            </div>
            <div className="notice-list">
              {announcements.map((item) => (
                <Link to={`/news/${item.id}`} className="notice-row" key={item.id}>
                  <span className="notice-icon">
                    {item.pinned ? <Megaphone size={21} /> : <BookOpen size={21} />}
                  </span>
                  <div>
                    <span className="notice-meta">
                      {item.category}
                      <span>·</span>
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                    <h3>{item.title}</h3>
                  </div>
                  <ArrowUpRight size={20} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="join-section">
        <div className="container">
          <div className="join-banner">
            <div className="join-decoration" aria-hidden="true">
              <Sprout size={170} strokeWidth={0.8} />
            </div>
            <div>
              <span className="eyebrow">THEIR NEXT CHAPTER STARTS HERE</span>
              <h2>
                Imagine what
                <br />
                they could become.
              </h2>
              <p>
                Come for a visit. Leave with a feeling.
                <br />
                We’d love to show you what makes our school special.
              </p>
            </div>
            <div className="join-actions">
              <span className="join-note">
                <CalendarDays size={17} />
                {s.admissionsOpen ? 'Let’s find a time to meet' : 'Our door is always open'}
              </span>
              <Link to="/contact#enquire" className="btn btn-primary btn-lg">
                Start a conversation
                <ArrowUpRight size={19} />
              </Link>
              <span>No pressure. Just possibilities.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
