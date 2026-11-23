import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api is proxied to the dashboard server, so the session cookie stays same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: { '/api': { target: process.env.VITE_API_TARGET || 'http://localhost:5100', changeOrigin: false } },
  },
});
