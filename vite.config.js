import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, /api requests go to the Express server,
    // so the browser only ever talks to one origin (no CORS problems).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
