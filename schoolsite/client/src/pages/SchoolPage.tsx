import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Heart, Quote, Sprout } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import type { Page, Program } from '../types';
import { PageHeading, Photo, SectionHeading } from '../components/ui';
import { ProgramCards } from '../components/ProgramCards';
export function SchoolPage() {
  const { settings: s } = useSchool(),
    { data } = useApi<Page<Program>>('/programs');
  usePageTitle('Our school');
  if (!s) return null;
  return (
    <>
      <PageHeading
        eyebrow="ROOTED IN KINDNESS. GROWING WITH PURPOSE."
        title={s.aboutTitle}
        description={s.tagline}
      />
      <section className="section">
        <div className="container story-grid school-story">
          <Photo image={s.aboutImage} className="story-photo" eager />
          <div>
            <span className="eyebrow">
              <span />
              THIS IS OUR STORY
            </span>
            <h2>
              Every child has
              <br />
              something wonderful.
            </h2>
            <div className="prose">
              {s.aboutText.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link to="/contact" className="text-link">
              Come get to know us
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="mission-section">
        <div className="container">
          <Quote size={40} strokeWidth={1.1} />
          <span className="eyebrow">OUR PURPOSE</span>
          <h2>{s.mission}</h2>
          <span className="mission-signature">
            <Sprout size={20} />
            The {s.shortName} community
          </span>
        </div>
      </section>
      {data?.items.length ? (
        <section className="section school-programs">
          <div className="container">
            <SectionHeading
              eyebrow="GROWING, EVERY STEP OF THE WAY"
              title="A place for every chapter."
              description="Thoughtful learning experiences that meet children where they are—and inspire where they could go."
            />
            <ProgramCards programs={data.items} />
          </div>
        </section>
      ) : null}
      <section className="section values-section">
        <div className="container values-grid">
          <div>
            <span className="eyebrow">
              <span />
              WHAT MATTERS HERE
            </span>
            <h2>
              Small things.
              <br />
              Strong foundations.
            </h2>
            <p>The values we live by, not just the ones on our walls.</p>
          </div>
          <div className="values-list">
            {[
              {
                icon: Heart,
                title: 'Kindness, always.',
                text: 'We listen, include, and look out for one another. Every child deserves to feel that they belong.',
              },
              {
                icon: Sprout,
                title: 'Curiosity comes first.',
                text: 'Questions are welcome. Mistakes are part of learning. Discovery is how confidence grows.',
              },
              {
                icon: Check,
                title: 'Better, together.',
                text: 'Families and educators are partners. We celebrate each child’s journey as a community.',
              },
            ].map((v) => (
              <div className="value-row" key={v.title}>
                <v.icon size={26} strokeWidth={1.4} />
                <div>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
