import type { ResourceConfig } from './ResourceManager';
import { imageField, statusField, type FieldConfig } from './form-types';
const categories = ['Academic', 'Community', 'Sports', 'Arts', 'Celebration'];
const eventFields: FieldConfig[] = [
  {
    name: 'title',
    label: 'Event title',
    type: 'text',
    required: true,
    full: true,
    max: 140,
    placeholder: 'Give this school moment a name',
  },
  { name: 'category', label: 'Category', type: 'select', options: categories },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    required: true,
    max: 200,
    placeholder: 'School auditorium',
  },
  { name: 'startsAt', label: 'Starts', type: 'datetime', required: true },
  { name: 'endsAt', label: 'Ends (optional)', type: 'datetime' },
  {
    name: 'description',
    label: 'Tell families about the event',
    type: 'textarea',
    required: true,
    rows: 7,
    max: 12000,
    placeholder: 'What’s happening? Who’s invited? What should families bring?',
  },
  imageField(
    'coverImage',
    'Event cover image',
    'A landscape image works best. Leave empty for a gentle placeholder.',
  ),
  {
    name: 'featured',
    label: 'Feature this event',
    type: 'checkbox',
    help: 'Mark your special events with a star in the admin list.',
  },
  statusField,
];
const start = new Date();
start.setDate(start.getDate() + 7);
start.setHours(9, 0, 0, 0);
const end = new Date(start);
end.setHours(12);
export const eventResource: ResourceConfig = {
  path: 'events',
  title: 'School events',
  singular: 'Event',
  description: 'Plan the moments that bring your school community together.',
  kind: 'events',
  fields: eventFields,
  defaults: {
    title: '',
    category: 'Academic',
    location: '',
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    description: '',
    coverImage: null,
    featured: false,
    status: 'draft',
  },
};
export const announcementResource: ResourceConfig = {
  path: 'announcements',
  title: 'School notices',
  singular: 'Notice',
  description: 'Keep families in the loop with news and helpful reminders.',
  kind: 'announcements',
  fields: [
    { name: 'title', label: 'Notice title', type: 'text', required: true, full: true, max: 160 },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: ['Notice', 'Admissions', 'Academic', 'General'],
    },
    statusField,
    {
      name: 'body',
      label: 'Your update',
      type: 'textarea',
      required: true,
      rows: 9,
      max: 12000,
      help: 'Separate paragraphs with a blank line. Text is displayed safely as plain text.',
    },
    {
      name: 'pinned',
      label: 'Pin this notice',
      type: 'checkbox',
      help: 'Pinned notices appear first on the website.',
    },
  ],
  defaults: { title: '', category: 'Notice', body: '', pinned: false, status: 'draft' },
};
export const programResource: ResourceConfig = {
  path: 'programs',
  title: 'Learning programs',
  singular: 'Program',
  description: 'Show families how their child can grow, one chapter at a time.',
  kind: 'programs',
  fields: [
    { name: 'title', label: 'Program name', type: 'text', required: true, full: true, max: 100 },
    {
      name: 'ageRange',
      label: 'Ages & school stage',
      type: 'text',
      required: true,
      max: 60,
      placeholder: 'Ages 3–5 · Early years',
    },
    {
      name: 'icon',
      label: 'Program symbol',
      type: 'select',
      options: ['sprout', 'book', 'compass'],
    },
    {
      name: 'description',
      label: 'A short introduction',
      type: 'textarea',
      required: true,
      max: 1500,
      rows: 4,
    },
    {
      name: 'sortOrder',
      label: 'Display order',
      type: 'number',
      min: 0,
      max: 999,
      help: 'Smaller numbers appear first.',
    },
    statusField,
  ],
  defaults: {
    title: '',
    ageRange: '',
    description: '',
    icon: 'sprout',
    sortOrder: 1,
    status: 'draft',
  },
};
export const albumFields: FieldConfig[] = [
  { name: 'title', label: 'Album title', type: 'text', required: true, full: true, max: 140 },
  { name: 'eventDate', label: 'Date of these memories', type: 'date', required: true },
  statusField,
  { name: 'description', label: 'A little about this album', type: 'textarea', max: 2000, rows: 3 },
  imageField(
    'coverImage',
    'Album cover (optional)',
    'If left empty, the first uploaded photo becomes the cover.',
  ),
];
