// Reads the Keystatic content in src/content at build time and shapes it for the pages.
import fs from 'node:fs';
import path from 'node:path';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export const pad = (n: number, len = 3) => String(n).padStart(len, '0');
export const letter = (i: number) => String.fromCharCode(65 + (i % 26));

// On Vercel, images are resized and re-encoded on the fly; locally the originals are used.
const SIZES = [640, 1080, 1600, 2400];
export const img = (src: string | null | undefined, w: number) =>
  !process.env.VERCEL || !src || /\.(gif|svg)$/i.test(src)
    ? encodeURI(src || '')
    : `/_vercel/image?url=${encodeURIComponent(src)}&w=${SIZES.find((s) => s >= w) || 2400}&q=75`;

export async function getSite() {
  const site = await reader.singletons.site.readOrThrow();
  return { ...site, url: String(site.url || '').replace(/\/$/, '') };
}

export async function getVisuals() {
  const v = await reader.singletons.visuals.readOrThrow();
  return { intro: v.intro, items: v.items.filter((i) => i.image) };
}

export type Project = Awaited<ReturnType<typeof getProjects>>[number];

export async function getProjects() {
  const entries = await reader.collections.projects.all();
  const projects = await Promise.all(
    entries.map(async ({ slug, entry }) => {
      const { body, ...data } = entry;
      return {
        ...data,
        slug,
        gallery: data.gallery.filter(Boolean) as string[],
        hasBody: (await body()).trim().length > 0,
        initials: data.title.split(/\s+|(?=[A-Z])/).filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase(),
      };
    })
  );
  return projects
    .filter((p) => p.title && p.published !== false)
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || a.title.localeCompare(b.title));
}

// Compiled MDX bodies, keyed by slug, for the optional extra case study text.
const bodies = import.meta.glob<{ default: any }>('../content/projects/*.mdx', { eager: true });
export const bodyOf = (slug: string) => bodies[`../content/projects/${slug}.mdx`]?.default;

// A JPG made for sharing (public/media/share/<page>.jpg) wins over the page image; some apps cannot show WebP.
export const shareOf = (name: string, fallback?: string | null) => {
  const f = `/media/share/${name.replace(/\//g, '-')}.jpg`;
  return fs.existsSync(path.join(process.cwd(), 'public', f)) ? f : fallback || '';
};

export const short = (s?: string | null) => {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > 160 ? s.slice(0, 157).replace(/\s+\S*$/, '') + '…' : s;
};

const NYC = { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' };

type Site = Awaited<ReturnType<typeof getSite>>;

// Structured data shared by every page, plus the page's own WebPage (and CreativeWork on project pages).
export function graph(site: Site, opts: { url: string; title: string; image?: string; project?: Project; firstCover?: string }) {
  const origin = site.url;
  const abs = (p?: string | null) => (p ? origin + encodeURI(p) : undefined);
  const sameAs = site.socials.map((s) => s.url).filter((u): u is string => /^https?:/.test(u || ''));
  const g: Record<string, unknown>[] = [
    { '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: 'Cristhian Tilleria', inLanguage: 'en-US', publisher: { '@id': origin + '/#person' } },
    { '@type': 'Person', '@id': origin + '/#person', name: 'Cristhian Tilleria', url: origin + '/', jobTitle: 'Freelance Web Developer & Designer',
      description: site.description, image: abs(site.portrait), email: site.email ? 'mailto:' + site.email : undefined, address: NYC,
      sameAs: sameAs.length ? sameAs : undefined, knowsAbout: [...site.services.map((s) => s.title), 'Web design', 'Frontend development', 'Shopify', 'Brand identity'] },
    { '@type': 'ProfessionalService', '@id': origin + '/#business', name: 'Cristhian Tilleria — Web Development & Design', url: origin + '/',
      description: site.description, image: abs(shareOf('index', opts.firstCover)), email: site.email || undefined, founder: { '@id': origin + '/#person' },
      address: NYC, geo: { '@type': 'GeoCoordinates', latitude: 40.7128, longitude: -74.006 },
      areaServed: [{ '@type': 'City', name: 'New York' }, { '@type': 'Country', name: 'United States' }],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: site.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.description, areaServed: 'New York, NY' } })) } },
  ];
  const p = opts.project;
  if (p) g.push({ '@type': 'CreativeWork', '@id': opts.url + '#work', name: p.title, url: opts.url, description: p.summary, genre: p.type,
    dateCreated: p.year || undefined, image: opts.image || undefined, creator: { '@id': origin + '/#person' } });
  g.push({ '@type': 'WebPage', '@id': opts.url + '#page', url: opts.url, name: opts.title, isPartOf: { '@id': origin + '/#website' }, about: { '@id': origin + '/#person' } });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
}
