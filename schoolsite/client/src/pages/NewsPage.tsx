import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Megaphone, Pin } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import type { Announcement, Page } from '../types';
import { formatDate } from '../lib/format';
import { EmptyState, ErrorState, PageHeading, Pagination, Spinner } from '../components/ui';
export function NewsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useApi<Page<Announcement>>(
    `/announcements?page=${page}&limit=12`,
  );
  usePageTitle('School notices');
  return (
    <>
      <PageHeading
        eyebrow="FROM THE SCHOOL OFFICE"
        title="Keep a little closer."
        description="The latest news, helpful reminders, and things our school community should know."
      />
      <section className="section">
        <div className="container news-container">
          {loading && !data ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} retry={refresh} />
          ) : data?.items.length ? (
            <div className="news-list">
              {data.items.map((item) => (
                <article className={`news-card ${item.pinned ? 'pinned' : ''}`} key={item.id}>
                  <div className="news-date">
                    <Megaphone size={24} strokeWidth={1.4} />
                    <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                  </div>
                  <div>
                    <span className="news-category">
                      {item.category}
                      {item.pinned && (
                        <span>
                          <Pin size={12} />
                          Pinned notice
                        </span>
                      )}
                    </span>
                    <h2>
                      <Link to={`/news/${item.id}`}>{item.title}</Link>
                    </h2>
                    <p>
                      {item.body.slice(0, 200)}
                      {item.body.length > 200 ? '…' : ''}
                    </p>
                    <Link className="text-link" to={`/news/${item.id}`}>
                      Read the full update
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="All quiet in the school office."
              description="New notices will appear here soon."
            />
          )}
          {data && (
            <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
          )}
        </div>
      </section>
    </>
  );
}
export function NoticePage() {
  const { id } = useParams(),
    { data, loading, error, refresh } = useApi<Announcement>(`/announcements/${id}`);
  usePageTitle(data?.title || 'School notice');
  if (loading) return <Spinner />;
  if (!data) return <ErrorState message={error} retry={refresh} />;
  return (
    <article className="section container notice-detail">
      <Link to="/news" className="back-link">
        <ArrowLeft size={16} />
        All school notices
      </Link>
      <span className="category category-community">{data.category}</span>
      <h1>{data.title}</h1>
      <span className="notice-detail-date">
        From the school office · {formatDate(data.publishedAt || data.createdAt)}
      </span>
      <div className="prose">
        {data.body.split('\n\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="inline-help">
        <Megaphone size={23} />
        <p>
          Need a little more information?{' '}
          <Link to="/contact">
            Get in touch with our school office.
            <ArrowUpRight size={14} />
          </Link>
        </p>
      </div>
    </article>
  );
}
