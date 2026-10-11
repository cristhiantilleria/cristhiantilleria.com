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

const cards = projects.map((p, i) => `        <a class="work${i === 0 ? ' work--wide' : ''}" href="#/work/${p.slug}" data-reveal data-cursor="View project">
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
          <a class="btn mono" href="#/contact" data-magnetic><span data-sweep>Want something like this?</span><span class="btn__arrow" aria-hidden="true"></span></a>
          ${next && next !== p ? `<a class="link mono" href="#/work/${next.slug}" data-sweep>Next: ${esc(next.title)}</a>` : ''}
          <a class="link mono" href="#/" data-sweep>All work</a>
        </div>
      </section>
    </div>`;
}).join('\n');

const services = (site.services || []).map((s, i) => `          <li><a class="svc fade" href="#/contact" style="--d:${i * 90}"><span class="bullet">${i + 1}</span><span class="svc__t">${esc(s.title)}</span><span class="svc__d">${esc(s.description)}</span><span class="svc__a" aria-hidden="true">↗</span></a></li>`).join('\n');

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

const slots = {
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

let html = read('src/template.html');
html = html.replace('/*@config*/{}', () => slots.config);
html = html.replace(/<!--@([a-z-]+)-->/g, (m, name) => {
  if (!(name in slots)) throw new Error('Unknown slot in template: ' + name);
  return slots[name];
});

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
if (fs.existsSync(path.join(root, 'media'))) fs.cpSync(path.join(root, 'media'), path.join(out, 'media'), { recursive: true });
console.log(`Built dist/index.html with ${projects.length} project(s).`);
