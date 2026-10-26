// Content in src/content is managed by Keystatic (see keystatic.config.ts) and read with its reader.
// Declaring the folder here only stops Astro from auto-generating a legacy collection for it.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  projects: defineCollection({ loader: glob({ pattern: '*.mdx', base: './src/content/projects' }) }),
};
