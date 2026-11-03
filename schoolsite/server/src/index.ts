import { loadConfig } from './config/env.js';
import { createContainer } from './business/container.js';
import { createApp } from './app.js';
try {
  const config = loadConfig(),
    container = createContainer(config);
  const server = createApp(container).listen(config.port, '0.0.0.0', () => {
    console.log(`SchoolSite API listening on 0.0.0.0:${config.port} (${config.mode} mode)`);
    if (config.mode === 'demo')
      console.log('DEMO: fictional school content. Production use requires APP_MODE=live.');
  });
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Startup failed');
  process.exit(1);
}
