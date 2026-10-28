// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';

// Keystatic's admin UI (React) and API are server routes, so they only exist under `astro dev`.
// `astro build` stays fully static: content is read from src/content at build time.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://www.cristhiantilleria.com',
  output: 'static',
  // Astro 7 defaults this to 'jsx', which drops spaces between inline elements.
  // Keep the previous HTML whitespace rules so the existing layout does not collapse.
  compressHTML: true,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  integrations: [mdx(), ...(isDev ? [react(), keystatic()] : [])],
  // Vite's dependency scan cannot resolve the `astro:env/server` virtual module inside Keystatic's API
  // route; left out of pre-bundling, Astro resolves it normally.
  vite: { optimizeDeps: { exclude: ['@keystatic/astro/api'] } },
});
