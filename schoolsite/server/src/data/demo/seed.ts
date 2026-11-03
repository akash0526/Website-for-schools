import { randomUUID } from 'node:crypto';
import type { Database, Entity, MediaAsset } from '../../domain/models.js';
const image = (file: string, alt: string): MediaAsset => ({
  url: `/images/${file}.jpg`,
  provider: 'external',
  alt,
});
const base = (): Entity => ({
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const day = (offset: number, hour = 9) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const date = (offset: number) => day(offset).slice(0, 10);
export function createSeedDatabase(): Database {
  const year = new Date().getFullYear();
  const albumIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  return {
    settings: {
      ...base(),
      id: 'main',
      name: 'Evergreen International School',
      shortName: 'evergreen',
      tagline: 'Rooted in kindness. Growing with purpose.',
      heroTitle: 'Big dreams.\nBright futures.\nA place to belong.',
      heroSubtitle:
        'A joyful place to learn, discover, and grow. We nurture every child’s curiosity and help them become the best version of themselves.',
      heroImage: image(
        'classroom',
        'A teacher sharing a story with a group of engaged young learners',
      ),
      aboutTitle: 'More than a school.\nA place to grow.',
      aboutText:
        'Childhood is full of firsts. First questions, first friendships, and those wonderful “I did it!” moments. At Evergreen, we make room for all of them.\n\nOur classrooms are places of possibility, where caring educators bring learning to life and every child is known, valued, and encouraged. From their first day to their next big step, we grow together.',
      mission:
        'To nurture confident, compassionate, and curious young people who are ready to make a positive difference in the world.',
      aboutImage: image(
        'early-years',
        'Children and their teacher enjoying a story together in a welcoming classroom',
      ),
      logo: null,
      establishedYear: year - 25,
      studentCount: 1200,
      teacherCount: 65,
      email: 'hello@evergreen.example',
      phone: '+977 71 555 0123',
      address: '12 Campus Lane, Bhairahawa\nLumbini Province, Nepal',
      officeHours: 'Sunday–Friday · 8:00 AM–4:00 PM',
      admissionsOpen: true,
      admissionsText: `We’re welcoming curious minds for the ${year + 1} academic year. Visit our campus, meet our educators, and discover whether Evergreen feels like home. Our admissions team will guide you through every step.`,
      facebookUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
    },
    events: [
      {
        ...base(),
        title: 'Young Scientists, Big Discoveries',
        slug: `science-fair-${year}`,
        description:
          'Step into a world of wonderful questions and brilliant ideas.\n\nOur annual Science Fair brings our young inventors together to share experiments, creative projects, and discoveries. Families are warmly invited to explore the exhibits, meet our teachers, and celebrate the joy of learning.\n\nOpen to all students, families, and prospective visitors. Please check in at the main reception when you arrive.',
        category: 'Academic',
        startsAt: day(7),
        endsAt: day(7, 14),
        location: 'School Discovery Hall',
        coverImage: image('science', 'Young students conducting a colorful science experiment'),
        featured: true,
        status: 'published',
      },
      {
        ...base(),
        title: 'Come See Where They’ll Grow',
        slug: `open-house-${year}`,
        description:
          'Your invitation to get to know Evergreen.\n\nJoin our school leaders and student ambassadors for a relaxed campus tour. Peek into our classrooms, learn about our approach to education, and enjoy a cup of tea with our team.\n\nBring your questions—and bring the children! We would love to meet your family. Contact the school office if you need any accessibility arrangements.',
        category: 'Community',
        startsAt: day(14, 10),
        endsAt: day(14, 13),
        location: 'Evergreen Main Campus',
        coverImage: image('early-years', 'A welcoming early-years classroom'),
        featured: true,
        status: 'published',
      },
      {
        ...base(),
        title: 'Small Steps. Big Team Spirit.',
        slug: `sports-day-${year}`,
        description:
          'A day for moving, cheering, and celebrating together.\n\nOur annual Sports Day is filled with friendly races, team challenges, and plenty of encouragement. Every child has a chance to take part and shine.\nPlease wear your house colors, bring a water bottle and sun hat, and get ready for a wonderful day outdoors. Families are welcome in the spectator area.',
        category: 'Sports',
        startsAt: day(21, 8),
        endsAt: day(21, 15),
        location: 'School Sports Ground',
        coverImage: image('sports', 'Children running and playing together outdoors'),
        featured: true,
        status: 'published',
      },
      {
        ...base(),
        title: 'A World of Color & Creativity',
        slug: `art-exhibition-${year}`,
        description:
          'Come and see the world through our students’ eyes. Our student art exhibition celebrates imagination in every form, from painting and sculpture to collaborative installations. Drop in during school office hours to explore the gallery.',
        category: 'Arts',
        startsAt: day(30),
        endsAt: day(32, 15),
        location: 'Creative Arts Studio',
        coverImage: image('classroom', 'Children learning creatively with their teacher'),
        featured: false,
        status: 'published',
      },
      {
        ...base(),
        title: 'Celebrating How Far We’ve Come',
        slug: `learning-celebration-${year}`,
        description:
          'Our students shared their favorite learning moments with families and teachers. Thank you to everyone who made this celebration so special. This is an archived event, kept here as part of our school’s story.',
        category: 'Celebration',
        startsAt: day(-12),
        endsAt: day(-12, 13),
        location: 'School Auditorium',
        coverImage: image('teacher', 'An educator leading an engaging mathematics lesson'),
        featured: false,
        status: 'published',
      },
      {
        ...base(),
        title: 'Parent & Teacher Coffee Morning',
        slug: 'parent-coffee-morning',
        description:
          'An informal morning for families and educators to connect. This draft is visible only in the admin panel until it is published.',
        category: 'Community',
        startsAt: day(10),
        endsAt: day(10, 11),
        location: 'School Library',
        coverImage: null,
        featured: false,
        status: 'draft',
      },
    ],
    announcements: [
      {
        ...base(),
        title: `A new chapter begins. Admissions for ${year + 1} are now open.`,
        body: 'We’re excited to welcome new families into the Evergreen community. Our admissions team is available during school office hours to answer your questions and arrange a personal campus tour.\n\nUse the enquiry form on our Contact page to introduce your family. Please include the year group your child is interested in, and we’ll help you with the next steps. Submitting an enquiry does not reserve a place.',
        category: 'Admissions',
        pinned: true,
        status: 'published',
        publishedAt: day(-2),
      },
      {
        ...base(),
        title: 'Little questions. Big possibilities. Our Science Fair is coming.',
        body: 'Families are invited to this year’s Science Fair in the School Discovery Hall. Explore student-led experiments and celebrate our young scientists. Full details are available on the Events page.',
        category: 'Academic',
        pinned: false,
        status: 'published',
        publishedAt: day(-4),
      },
      {
        ...base(),
        title: 'A gentle reminder: every child belongs here.',
        body: 'Our school community is built on kindness, respect, and looking out for one another. If your child needs extra support, please speak with their class teacher. We are always happy to work together.',
        category: 'Notice',
        pinned: false,
        status: 'published',
        publishedAt: day(-7),
      },
      {
        ...base(),
        title: 'Upcoming library refresh',
        body: 'This draft notice is not visible on the public website.',
        category: 'General',
        pinned: false,
        status: 'draft',
        publishedAt: null,
      },
    ],
    programs: [
      {
        ...base(),
        title: 'Little Explorers',
        ageRange: 'Ages 3–5 · Early years',
        description:
          'Big discoveries start with little steps. Play, stories, and hands-on learning build a joyful foundation.',
        icon: 'sprout',
        sortOrder: 1,
        status: 'published',
      },
      {
        ...base(),
        title: 'Growing Minds',
        ageRange: 'Ages 6–11 · Primary school',
        description:
          'Curiosity meets confidence as children explore, build friendships, and discover what they love.',
        icon: 'book',
        sortOrder: 2,
        status: 'published',
      },
      {
        ...base(),
        title: 'Future Shapers',
        ageRange: 'Ages 12–16 · Secondary school',
        description:
          'Deeper thinking, wider horizons, and the courage to find their voice and make their mark.',
        icon: 'compass',
        sortOrder: 3,
        status: 'published',
      },
    ],
    albums: [
      {
        ...base(),
        id: albumIds[0],
        title: 'Curious minds at work',
        description: 'Wonderful questions and hands-on discoveries in our science lab.',
        eventDate: date(-8),
        coverImage: image('science', 'Young learners exploring science'),
        status: 'published',
      },
      {
        ...base(),
        id: albumIds[1],
        title: 'Our little explorers',
        description: 'Learning through stories, play, and being together.',
        eventDate: date(-15),
        coverImage: image('early-years', 'Early-years children listening to a story'),
        status: 'published',
      },
      {
        ...base(),
        id: albumIds[2],
        title: 'Room to run. Space to grow.',
        description: 'Fresh air, friendly teamwork, and a little healthy competition.',
        eventDate: date(-22),
        coverImage: image('sports', 'Children enjoying the outdoors together'),
        status: 'published',
      },
      {
        ...base(),
        id: albumIds[3],
        title: 'Everyday extraordinary',
        description: 'The small moments that make our school special.',
        eventDate: date(-28),
        coverImage: image('classroom', 'A teacher and children learning together'),
        status: 'published',
      },
    ],
    photos: [
      {
        ...base(),
        albumId: albumIds[0],
        caption: 'A little curiosity goes a long way.',
        image: image('science', 'A student carefully adding liquid to a flask'),
        sortOrder: 1,
      },
      {
        ...base(),
        albumId: albumIds[0],
        caption: 'Discovering science together.',
        image: image('science-lab', 'Students using laboratory equipment'),
        sortOrder: 2,
      },
      {
        ...base(),
        albumId: albumIds[1],
        caption: 'Our favorite time of the day: story time.',
        image: image('early-years', 'A classroom of young children enjoying a story'),
        sortOrder: 1,
      },
      {
        ...base(),
        albumId: albumIds[1],
        caption: 'Learning starts with listening.',
        image: image('classroom', 'A teacher reading with young learners'),
        sortOrder: 2,
      },
      {
        ...base(),
        albumId: albumIds[2],
        caption: 'Better together.',
        image: image('sports', 'Children running together'),
        sortOrder: 1,
      },
      {
        ...base(),
        albumId: albumIds[2],
        caption: 'A little fresh air and a lot of fun.',
        image: image('outdoors', 'Children playing on a green field'),
        sortOrder: 2,
      },
      {
        ...base(),
        albumId: albumIds[3],
        caption: 'Making math make sense.',
        image: image('math', 'A teacher explaining mathematics at the chalkboard'),
        sortOrder: 1,
      },
      {
        ...base(),
        albumId: albumIds[3],
        caption: 'Every question matters.',
        image: image('teacher', 'An educator in front of a mathematics board'),
        sortOrder: 2,
      },
    ],
    inquiries: [
      {
        ...base(),
        name: 'Sample Family',
        email: 'family@example.com',
        phone: '',
        studentGrade: 'Early years',
        message:
          'Hello! We would love to visit the school and learn more about your early-years program. This is a fictional demo enquiry.',
        status: 'new',
      },
      {
        ...base(),
        name: 'Demo Parent',
        email: 'parent@example.com',
        phone: '',
        studentGrade: 'Grade 4',
        message:
          'Could you tell us more about the admissions process for Grade 4? This enquiry is sample content.',
        status: 'read',
      },
    ],
  };
}
