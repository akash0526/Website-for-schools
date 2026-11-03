import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1, 'This field is required');
const httpsUrl = z
  .string()
  .url()
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use a secure HTTPS URL');
export const mediaSchema = z
  .object({
    url: z
      .string()
      .max(2048)
      .refine(
        (v) => /^https:\/\//.test(v) || /^\/(images|uploads)\/[a-zA-Z0-9._/-]+$/.test(v),
        'Invalid image URL',
      ),
    thumbnailUrl: z.string().max(2048).optional(),
    provider: z.enum(['imagekit', 'local', 'external']),
    fileId: z.string().max(200).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: text(250).default(''),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.provider === 'imagekit' && !v.fileId)
      ctx.addIssue({ code: 'custom', message: 'ImageKit file ID is required' });
  });
export const statusSchema = z.enum(['draft', 'published']);
export const eventSchema = z
  .object({
    title: required(140),
    description: required(12000),
    category: z.enum(['Academic', 'Community', 'Sports', 'Arts', 'Celebration']),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).nullable().default(null),
    location: required(200),
    coverImage: mediaSchema.nullable().default(null),
    featured: z.boolean().default(false),
    status: statusSchema.default('draft'),
  })
  .strict()
  .refine((v) => !v.endsAt || new Date(v.endsAt) >= new Date(v.startsAt), {
    message: 'The end must be after the start',
    path: ['endsAt'],
  });
export const announcementSchema = z
  .object({
    title: required(160),
    body: required(12000),
    category: z.enum(['Notice', 'Admissions', 'Academic', 'General']),
    pinned: z.boolean().default(false),
    status: statusSchema.default('draft'),
  })
  .strict();
export const programSchema = z
  .object({
    title: required(100),
    ageRange: required(60),
    description: required(1500),
    icon: z.enum(['sprout', 'book', 'compass']),
    sortOrder: z.number().int().min(0).max(999).default(0),
    status: statusSchema.default('draft'),
  })
  .strict();
export const albumSchema = z
  .object({
    title: required(140),
    description: text(2000).default(''),
    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
    coverImage: mediaSchema.nullable().default(null),
    status: statusSchema.default('draft'),
  })
  .strict();
export const photoSchema = z
  .object({
    albumId: z.string().uuid(),
    caption: text(250).default(''),
    image: mediaSchema,
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .strict();
export const settingsSchema = z
  .object({
    name: required(120),
    shortName: required(35),
    tagline: required(160),
    heroTitle: required(180),
    heroSubtitle: required(600),
    heroImage: mediaSchema.nullable(),
    aboutTitle: required(160),
    aboutText: required(5000),
    mission: required(1500),
    aboutImage: mediaSchema.nullable(),
    logo: mediaSchema.nullable(),
    establishedYear: z.number().int().min(1800).max(new Date().getFullYear()),
    studentCount: z.number().int().min(0).max(100000),
    teacherCount: z.number().int().min(0).max(10000),
    email: z.string().email().max(254),
    phone: required(50),
    address: required(350),
    officeHours: required(160),
    admissionsOpen: z.boolean(),
    admissionsText: required(1500),
    facebookUrl: z.union([httpsUrl, z.literal('')]),
    instagramUrl: z.union([httpsUrl, z.literal('')]),
    youtubeUrl: z.union([httpsUrl, z.literal('')]),
  })
  .strict();
export const inquirySchema = z
  .object({
    name: required(100),
    email: z.string().trim().email().max(254),
    phone: text(40).default(''),
    studentGrade: text(60).default(''),
    message: required(3000),
    website: z.string().max(0, 'Invalid submission').optional(),
  })
  .strict();
export const inquiryUpdateSchema = z
  .object({ status: z.enum(['new', 'read', 'archived']) })
  .strict();
export const loginSchema = z
  .object({ email: z.string().email().max(254), password: z.string().min(1).max(128) })
  .strict();
export const idSchema = z.string().uuid('Invalid record ID');
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function editableFields(value: object): Record<string, unknown> {
  const result = { ...value } as Record<string, unknown>;
  for (const field of ['id', 'createdAt', 'updatedAt', 'slug', 'publishedAt']) delete result[field];
  return result;
}
