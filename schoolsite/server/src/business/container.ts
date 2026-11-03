import { join } from 'node:path';
import type { AuthProvider, MediaStorage, Repositories } from '../domain/ports.js';
import type { Config } from '../config/env.js';
import { DemoStore } from '../data/demo/store.js';
import { createDemoRepositories } from '../data/demo/repository.js';
import { createSupabaseRepositories } from '../data/supabase/index.js';
import { createDatabaseClient } from '../data/supabase/client.js';
import { DemoAuthProvider, SupabaseAuthProvider } from '../auth/index.js';
import { LocalStorage } from '../providers/local-storage.js';
import { ImageKitStorage } from '../providers/imagekit-storage.js';
import { SchoolServices } from './index.js';

export interface Container {
  config: Config;
  repositories: Repositories;
  storage: MediaStorage;
  auth: AuthProvider;
  services: SchoolServices;
  demoAuth?: DemoAuthProvider;
}
export function createDemoContainer(config: Config, persistent = true): Container {
  if (config.mode !== 'demo' || config.environment === 'production')
    throw new Error('Demo container is not available in live/production mode.');
  const store = new DemoStore(persistent ? join(config.dataDirectory, 'demo.json') : undefined);
  const repositories = createDemoRepositories(store),
    storage = new LocalStorage(config),
    demoAuth = new DemoAuthProvider();
  return {
    config,
    repositories,
    storage,
    auth: demoAuth,
    demoAuth,
    services: new SchoolServices(repositories, storage),
  };
}
export function createContainer(config: Config): Container {
  if (config.mode === 'demo') return createDemoContainer(config, config.environment !== 'test');
  const repositories = createSupabaseRepositories(config),
    storage = new ImageKitStorage(config);
  const auth = new SupabaseAuthProvider(createDatabaseClient(config));
  return {
    config,
    repositories,
    storage,
    auth,
    services: new SchoolServices(repositories, storage),
  };
}
