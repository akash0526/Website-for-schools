import { BookOpen, Compass, Sprout, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Program } from '../types';
const icons = { sprout: Sprout, book: BookOpen, compass: Compass };
export function ProgramCards({ programs }: { programs: Program[] }) {
  return (
    <div className="program-grid">
      {programs.map((program, index) => {
        const Icon = icons[program.icon] || Sprout;
        return (
          <article className="program-card" key={program.id}>
            <div className="program-top">
              <span className="program-icon">
                <Icon size={29} strokeWidth={1.4} />
              </span>
              <span className="program-number">0{index + 1}</span>
            </div>
            <span className="program-age">{program.ageRange}</span>
            <h3>{program.title}</h3>
            <p>{program.description}</p>
            <Link
              to={`/contact?program=${encodeURIComponent(program.title)}#enquire`}
              className="program-link"
            >
              Find their starting point
              <ArrowUpRight size={18} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
