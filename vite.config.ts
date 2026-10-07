/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { precomprimir } from './scripts/precomprimir.ts';

export default defineConfig({
  plugins: [react(), precomprimir()],
  // No GitHub Pages o app fica em /cidade-missao/; localmente, na raiz.
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (/node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'react' : /node_modules\/(d3-|@googlemaps)/.test(id) ? 'mapa' : undefined),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
