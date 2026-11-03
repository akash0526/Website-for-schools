import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: '.preview/test-results',
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command:
      'APP_MODE=demo NODE_ENV=test PORT=3101 WEB_PORT=5174 CLIENT_ORIGINS=http://localhost:5174 npm run dev',
    url: 'http://localhost:5174/api/health',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
