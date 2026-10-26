import type { APIRoute } from 'astro';
import { getSite } from '../lib/content';

export const GET: APIRoute = async () => {
  const site = await getSite();
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
};
