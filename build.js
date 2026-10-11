// Builds the site: src/template.html + content/*.json -> dist/index.html
// Run with `node build.js`. No dependencies.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'dist');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(3, '0');
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const site = JSON.parse(read('content/site.json'));
const projectDir = path.join(root, 'content/projects');
const projects = fs.readdirSync(projectDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => Object.assign({ slug: slugify(f.replace(/\.json$/, '')) }, JSON.parse(fs.readFileSync(path.join(projectDir, f), 'utf8'))))
  .filter((p) => p.title && p.published !== false)
  .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || a.title.localeCompare(b.title));

const letter = (i) => String.fromCharCode(65 + (i % 26));
// A project without a cover image falls back to one of the three abstract placeholders.
const art = (p, i) => p.cover
  ? `<div class="art art--img" style="background-image:url('${esc(encodeURI(p.cover))}')"></div>`
  : `<div class="art art-${(i % 3) + 1}"></div>`;

const cards = projects.map((p, i) => `        <a class="work${i === 0 ? ' work--wide' : ''}" href="/work/${p.slug}" data-reveal data-cursor="View project">
          <div class="media">${art(p, i)}</div>
          <span class="work__cap"><span class="bullet">${letter(i)}</span><b>${esc(p.title)}</b><span class="mono">${esc(p.type)}</span></span>
        </a>`).join('\n');

const cases = projects.map((p, i) => {
  const next = projects[(i + 1) % projects.length];
  const kicker = ['Project ' + letter(i), p.type, p.year].filter(Boolean).map(esc).join(' — ');
  const facts = [['Role', p.role], ['Year', p.year], ['Type', p.type]].filter((f) => f[1])
    .map((f, n) => `<div class="fade" style="--d:${n * 120}"><dt class="mono">${f[0]}</dt><dd>${esc(f[1])}</dd></div>`).join('');
  return `    <div class="view" data-view="work/${p.slug}" data-title="${esc(p.title)} — Cristhian Tilleria" tabindex="-1" hidden>
      <section class="page case grid">
        <p class="page__kicker mono" data-reveal><span data-type>${kicker}</span></p>
        <h1 class="h2 case__title" data-reveal data-wait="350"><span class="sq" data-text="${esc(p.title)}"><span>${esc(p.title)}</span></span></h1>
        <div class="case__cover" data-reveal><div class="media">${art(p, i)}</div></div>
        ${p.summary ? `<p class="case__lead fade" data-reveal>${esc(p.summary)}</p>` : ''}
        ${p.body ? `<div class="case__body fade" data-reveal>${p.body}</div>` : ''}
        ${facts ? `<dl class="facts" data-reveal>${facts}</dl>` : ''}
        <div class="cta-row fade" data-reveal>
          ${p.link ? `<a class="btn mono" href="${esc(p.link)}" target="_blank" rel="noopener" data-magnetic><span data-sweep>Visit the live site</span><span class="btn__arrow" aria-hidden="true"></span></a>` : ''}
          <a class="btn mono" href="/contact" data-magnetic><span data-sweep>Want something like this?</span><span class="btn__arrow" aria-hidden="true"></span></a>
          ${next && next !== p ? `<a class="link mono" href="/work/${next.slug}" data-sweep>Next: ${esc(next.title)}</a>` : ''}
          <a class="link mono" href="/" data-sweep>All work</a>
        </div>
      </section>
    </div>`;
}).join('\n');

const services = (site.services || []).map((s, i) => `          <li><a class="svc fade" href="/contact" style="--d:${i * 90}"><span class="bullet">${i + 1}</span><span class="svc__t">${esc(s.title)}</span><span class="svc__d">${esc(s.description)}</span><span class="svc__a" aria-hidden="true">↗</span></a></li>`).join('\n');

const steps = (site.steps || []).map((s, i) => `          <li class="step${i === 0 ? ' step--hot' : ''}" style="--s:${i}"><span class="mono">${esc(s.tag)}</span><span class="step__n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></li>`).join('\n');

const tickerOnce = (site.ticker || []).map((t) => `<span>${esc(t)}</span>`).join('');
const social = (s) => `<li><a class="ext" href="${esc(s.url || '#')}"${s.url && s.url !== '#' ? ' target="_blank" rel="noopener"' : ''} data-sweep>${esc(s.label)}</a></li>`;
const socials = site.socials || [];
const half = Math.ceil(socials.length / 2);

const visualsData = JSON.parse(read('content/visuals.json'));
const visualItems = (visualsData.items || []).filter((v) => v.image);
const visuals = visualItems.map((v, i) => `          <figure class="visual fade" data-reveal style="--d:${(i % 3) * 120}">
            <img src="${esc(encodeURI(v.image))}" alt="${esc(v.title || '')}" loading="lazy">
            <figcaption><span class="bullet">${i + 1}</span><b>${esc(v.title || '')}</b><span class="mono">${esc(v.kind || '')}</span></figcaption>
          </figure>`).join('\n');

const portrait = site.portrait
  ? `        <figure class="portrait" data-reveal data-wait="500">
          <div class="media"><img src="${esc(encodeURI(site.portrait))}" alt="Portrait of Cristhian Tilleria" width="1024" height="1024"></div>
          <figcaption class="mono"><span>Cristhian Tilleria</span><span>New York</span></figcaption>
        </figure>`
  : '';

const slots = {
  portrait,
  'portrait-class': site.portrait ? ' has-portrait' : '',
  'visual-count': pad(visualItems.length),
  'visuals-intro': esc(visualsData.intro),
  visuals,
  config: JSON.stringify({ email: site.email || '', bookingUrl: site.bookingUrl || '' }),
  'project-count': pad(projects.length),
  projects: cards,
  'service-count': pad((site.services || []).length),
  services,
  'step-count': pad((site.steps || []).length),
  steps,
  ticker: '          ' + tickerOnce + tickerOnce,
  intro: esc(site.intro),
  statement: esc(site.statement),
  status: esc(site.status),
  'socials-hero': socials.slice(0, 3).map((s) => '            ' + social(s)).join('\n'),
  'socials-footer': `    <ul class="footer__col footer__col--a mono">${socials.slice(0, half).map(social).join('')}</ul>\n    <ul class="footer__col footer__col--b mono">${socials.slice(half).map(social).join('')}</ul>`,
  cases,
};

const origin = String(site.url || '').replace(/\/$/, '');
const firstCover = (projects.find((p) => p.cover) || {}).cover || site.portrait || '';

slots.cases = cases + `
    <div class="view" data-view="404" data-title="Page not found — Cristhian Tilleria" tabindex="-1" hidden>
      <section class="page grid">
        <p class="page__kicker mono" data-reveal><span data-type>Error 404 — Wrong stop</span></p>
        <h1 class="h2 visuals__title" data-reveal data-wait="350"><span class="sq" data-text="404"><span>404</span></span></h1>
        <p class="case__lead fade" data-reveal>This page doesn't exist, or it moved.</p>
        <div class="cta-row fade" data-reveal><a class="btn mono" href="/" data-magnetic><span data-sweep>Back to the work</span><span class="btn__arrow" aria-hidden="true"></span></a></div>
      </section>
    </div>`;

// Fill every slot except the two that differ per page.
let shell = read('src/template.html');
shell = shell.replace('/*@config*/{}', () => slots.config);
shell = shell.replace(/<!--@([a-z-]+)-->/g, (m, name) => {
  if (name === 'head' || name === 'view') return m;
  if (!(name in slots)) throw new Error('Unknown slot in template: ' + name);
  return slots[name];
});

// Split <main> into one chunk per view, then write one real page per view.
const mainMatch = shell.match(/<main>([\s\S]*?)\n  <\/main>/);
const chunks = mainMatch[1].split(/(?=\n    <div class="view" data-view=")/).filter((c) => c.includes('class="view"'));
const short = (s) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 160 ? s.slice(0, 157).replace(/\s+\S*$/, '') + '…' : s; };
const meta = {
  index: { description: site.description, image: firstCover },
  about: { description: site.statement, image: site.portrait || firstCover },
  contact: { description: 'Tell me about your project and book a discovery call with Cristhian Tilleria, freelance frontend developer and web designer in New York.', image: firstCover },
  visuals: { description: visualsData.intro, image: (visualItems[0] || {}).image || firstCover },
  404: { description: 'Page not found.', image: '' },
};
projects.forEach((p) => { meta['work/' + p.slug] = { description: p.summary, image: p.cover || firstCover }; });

fs.rmSync(out, { recursive: true, force: true });
const pages = [];
chunks.forEach((chunk) => {
  const name = chunk.match(/data-view="([^"]+)"/)[1];
  const title = chunk.match(/data-title="([^"]*)"/)[1];
  const m = meta[name] || {};
  const url = origin + (name === 'index' ? '/' : '/' + name);
  const image = m.image ? origin + encodeURI(m.image) : '';
  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${esc(short(m.description))}">`,
    name === '404' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Cristhian Tilleria">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${esc(short(m.description))}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
  ].filter(Boolean).join('\n');
  const view = chunk.replace(/(<div class="view"[^>]*?) hidden>/, '$1>');
  const html = shell
    .replace(mainMatch[0], () => '<main>' + view + '\n  </main>')
    .replace('<!--@head-->', () => head)
    .replace('<!--@view-->', () => name);
  const file = name === 'index' ? 'index.html' : name === '404' ? '404.html' : name + '/index.html';
  fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
  fs.writeFileSync(path.join(out, file), html);
  if (name !== '404') pages.push(url);
});

fs.writeFileSync(path.join(out, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
if (fs.existsSync(path.join(root, 'media'))) fs.cpSync(path.join(root, 'media'), path.join(out, 'media'), { recursive: true });
console.log(`Built ${pages.length} page(s) + 404, with ${projects.length} project(s).`);
