import { createClient } from '@supabase/supabase-js';
import type { Config } from '../../config/env.js';
export function createDatabaseClient(config: Config) {
  return createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
