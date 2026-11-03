export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export type PublishStatus = 'draft' | 'published';
export interface MediaAsset {
  url: string;
  thumbnailUrl?: string;
  provider: 'imagekit' | 'local' | 'external';
  fileId?: string;
  width?: number;
  height?: number;
  alt: string;
}
export interface SchoolSettings extends Entity {
  name: string;
  shortName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: MediaAsset | null;
  aboutTitle: string;
  aboutText: string;
  mission: string;
  aboutImage: MediaAsset | null;
  logo: MediaAsset | null;
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
  category: 'Academic' | 'Community' | 'Sports' | 'Arts' | 'Celebration';
  startsAt: string;
  endsAt: string | null;
  location: string;
  coverImage: MediaAsset | null;
  featured: boolean;
  status: PublishStatus;
}
export interface Announcement extends Entity {
  title: string;
  body: string;
  category: 'Notice' | 'Admissions' | 'Academic' | 'General';
  pinned: boolean;
  status: PublishStatus;
  publishedAt: string | null;
}
export interface Program extends Entity {
  title: string;
  ageRange: string;
  description: string;
  icon: 'sprout' | 'book' | 'compass';
  sortOrder: number;
  status: PublishStatus;
}
export interface Album extends Entity {
  title: string;
  description: string;
  eventDate: string;
  coverImage: MediaAsset | null;
  status: PublishStatus;
}
export interface AlbumSummary extends Album {
  photoCount: number;
}
export interface Photo extends Entity {
  albumId: string;
  caption: string;
  image: MediaAsset;
  sortOrder: number;
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
  email: string;
  name: string;
  role: 'owner' | 'editor';
}
export interface Database {
  settings: SchoolSettings;
  events: SchoolEvent[];
  announcements: Announcement[];
  programs: Program[];
  albums: Album[];
  photos: Photo[];
  inquiries: Inquiry[];
}
export type CollectionName = Exclude<keyof Database, 'settings'>;
