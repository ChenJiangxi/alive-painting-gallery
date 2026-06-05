import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow the public hostname behind nginx — without this, vite returns 403.
    allowedHosts: ['gallery.jessylab.cc'],
  },
});
