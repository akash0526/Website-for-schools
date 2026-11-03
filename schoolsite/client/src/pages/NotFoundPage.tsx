import { Link } from 'react-router-dom';
import { ArrowLeft, Sprout } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <section className="not-found container">
      <Sprout size={65} strokeWidth={1} />
      <span className="eyebrow">A LITTLE DETOUR · 404</span>
      <h1>
        This path doesn’t
        <br />
        lead to a classroom.
      </h1>
      <p>The page may have moved, but there’s still plenty to discover.</p>
      <Link className="btn btn-primary" to="/">
        <ArrowLeft size={17} />
        Back to our school
      </Link>
    </section>
  );
}
