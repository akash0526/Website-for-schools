import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const envSchema = z.object({
  APP_MODE: z.enum(['demo', 'live']).default('demo'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  SCHOOL_SLUG: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default('evergreen'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional().or(z.literal('')),
  IMAGEKIT_UPLOAD_FOLDER: z
    .string()
    .regex(/^\/[a-zA-Z0-9_/-]+$/)
    .default('/evergreen/uploads'),
  MAX_UPLOAD_MB: z.coerce.number().min(1).max(10).default(5),
});
export type Config = ReturnType<typeof loadConfig>;
export function loadConfig(source: NodeJS.ProcessEnv = process.env) {
  const env = envSchema.parse(source);
  if (env.NODE_ENV === 'production' && env.APP_MODE === 'demo')
    throw new Error(
      'DEMO MODE IS BLOCKED IN PRODUCTION. Set APP_MODE=live and configure Supabase + ImageKit.',
    );
  if (env.APP_MODE === 'live') {
    for (const key of [
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SECRET_KEY',
      'IMAGEKIT_PUBLIC_KEY',
      'IMAGEKIT_PRIVATE_KEY',
      'IMAGEKIT_URL_ENDPOINT',
    ] as const) {
      if (!env[key]) throw new Error(`Live mode requires ${key}. See .env.example.`);
    }
    if (env.IMAGEKIT_UPLOAD_FOLDER === '/evergreen/uploads' && env.SCHOOL_SLUG !== 'evergreen')
      throw new Error('Set a separate IMAGEKIT_UPLOAD_FOLDER for this school.');
  }
  return Object.freeze({
    mode: env.APP_MODE,
    environment: env.NODE_ENV,
    port: env.PORT,
    origins: env.CLIENT_ORIGINS.split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    schoolSlug: env.SCHOOL_SLUG,
    trustProxy: env.TRUST_PROXY,
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
    supabaseSecretKey: env.SUPABASE_SECRET_KEY || '',
    imagekitPublicKey: env.IMAGEKIT_PUBLIC_KEY || '',
    imagekitPrivateKey: env.IMAGEKIT_PRIVATE_KEY || '',
    imagekitEndpoint: (env.IMAGEKIT_URL_ENDPOINT || '').replace(/\/$/, ''),
    imagekitFolder: env.IMAGEKIT_UPLOAD_FOLDER,
    maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
    dataDirectory: fileURLToPath(new URL('../../data/', import.meta.url)),
    clientDirectory: fileURLToPath(new URL('../../../client/dist/', import.meta.url)),
  });
}
