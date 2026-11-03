import type {
  AdminUser,
  Album,
  AlbumSummary,
  Entity,
  MediaAsset,
  SchoolSettings,
} from './models.js';
export type { MediaAsset } from './models.js';

export type Filter<T> = {
  field: keyof T & string;
  op: 'eq' | 'gte' | 'lte' | 'ilike' | 'in';
  value: string | number | boolean | string[];
};
export interface ListQuery<T> {
  filters?: Filter<T>[];
  order?: { field: keyof T & string; ascending: boolean }[];
  page?: number;
  limit?: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export type NewEntity<T extends Entity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export interface Repository<T extends Entity> {
  list(query?: ListQuery<T>): Promise<Page<T>>;
  count(filters?: Filter<T>[]): Promise<number>;
  findById(id: string): Promise<T | null>;
  create(values: NewEntity<T>): Promise<T>;
  update(id: string, values: Partial<NewEntity<T>>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
export interface AlbumRepository extends Repository<Album> {
  listSummaries(query?: ListQuery<Album>): Promise<Page<AlbumSummary>>;
}
export interface SettingsRepository {
  get(): Promise<SchoolSettings>;
  save(values: Partial<NewEntity<SchoolSettings>>): Promise<SchoolSettings>;
}
export interface Repositories {
  settings: SettingsRepository;
  events: Repository<import('./models.js').SchoolEvent>;
  announcements: Repository<import('./models.js').Announcement>;
  programs: Repository<import('./models.js').Program>;
  albums: AlbumRepository;
  photos: Repository<import('./models.js').Photo>;
  inquiries: Repository<import('./models.js').Inquiry>;
}
export interface AuthProvider {
  resolveToken(token: string): Promise<AdminUser | null>;
}
export interface UploadInput {
  buffer: Buffer;
  originalName: string;
}
export interface DirectUploadPlan {
  mode: 'direct';
  uploadUrl: string;
  publicKey: string;
  folder: string;
  token: string;
  expire: number;
  signature: string;
  maxBytes: number;
  allowedMimeTypes: string[];
}
export interface ServerUploadPlan {
  mode: 'server';
  uploadUrl: string;
  maxBytes: number;
  allowedMimeTypes: string[];
}
export type UploadPlan = DirectUploadPlan | ServerUploadPlan;
export interface MediaStorage {
  readonly mode: 'local' | 'imagekit';
  getUploadPlan(): Promise<UploadPlan>;
  verifyUpload(fileId: string): Promise<MediaAsset>;
  upload(input: UploadInput): Promise<MediaAsset>;
  delete(fileId: string): Promise<void>;
}
