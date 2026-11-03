export type Status = 'draft' | 'published';
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface Media {
  url: string;
  thumbnailUrl?: string;
  provider: 'imagekit' | 'local' | 'external';
  fileId?: string;
  width?: number;
  height?: number;
  alt: string;
}
export interface Settings extends Entity {
  name: string;
  shortName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: Media | null;
  aboutTitle: string;
  aboutText: string;
  mission: string;
  aboutImage: Media | null;
  logo: Media | null;
  establishedYear: number;
  studentCount: number;
  teacherCount: number;
  email: string;
  phone: string;
  address: string;
  officeHours: string;
  admissionsOpen: boolean;
  admissionsText: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
}
export interface SchoolEvent extends Entity {
  title: string;
  slug: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  coverImage: Media | null;
  featured: boolean;
  status: Status;
}
export interface Announcement extends Entity {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  status: Status;
  publishedAt: string | null;
}
export interface Program extends Entity {
  title: string;
  ageRange: string;
  description: string;
  icon: 'sprout' | 'book' | 'compass';
  sortOrder: number;
  status: Status;
}
export interface Album extends Entity {
  title: string;
  description: string;
  eventDate: string;
  coverImage: Media | null;
  status: Status;
  photoCount?: number;
}
export interface Photo extends Entity {
  albumId: string;
  caption: string;
  image: Media;
  sortOrder: number;
  albumTitle?: string;
}
export interface Inquiry extends Entity {
  name: string;
  email: string;
  phone: string;
  studentGrade: string;
  message: string;
  status: 'new' | 'read' | 'archived';
}
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor';
}
export interface AppConfig {
  mode: 'demo' | 'live';
  schoolSlug: string;
  auth: { provider: 'demo' | 'supabase'; url?: string; publishableKey?: string };
  uploads: { maxBytes: number; allowedMimeTypes: string[] };
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface HomeData {
  settings: Settings;
  events: SchoolEvent[];
  announcements: Announcement[];
  programs: Program[];
  albums: Album[];
  gallery: Photo[];
}
export interface Dashboard {
  upcoming: number;
  drafts: number;
  photos: number;
  albums: number;
  inquiries: number;
  events: SchoolEvent[];
  recentInquiries: Inquiry[];
}
export type UploadPlan =
  | { mode: 'server'; uploadUrl: string; maxBytes: number; allowedMimeTypes: string[] }
  | {
      mode: 'direct';
      uploadUrl: string;
      publicKey: string;
      folder: string;
      token: string;
      expire: number;
      signature: string;
      maxBytes: number;
      allowedMimeTypes: string[];
    };
