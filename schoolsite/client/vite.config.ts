import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.WEB_PORT || 5173),
    strictPort: true,
    allowedHosts: ['.e2b.app', 'localhost'],
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.API_PORT || 3001}`,
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (req) =>
            req.setHeader('origin', `http://localhost:${process.env.WEB_PORT || 5173}`),
          );
        },
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.API_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  build: { sourcemap: false },
});
