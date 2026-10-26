import type { APIRoute } from 'astro';
import { getSite, getProjects } from '../lib/content';

export const GET: APIRoute = async () => {
  const site = await getSite();
  const projects = await getProjects();
  const pages = ['/', '/work', ...projects.map((p) => `/work/${p.slug}`), '/about', '/contact', '/visuals'];
  const day = new Date().toISOString().slice(0, 10);
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${day}</lastmod></url>`).join('\n') + '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
