// Service worker: makes the site installable and keeps it working on a flaky connection.
// Pages are network-first, so a deploy shows up on the next visit; the cache is only the fallback.
// Hashed scripts and fonts never change, so they come from the cache; images refresh in the background.
const CACHE = 'ct-v1';
const CORE = ['/', '/work', '/visuals', '/about', '/contact', '/fonts/inter-tight-latin.woff2', '/fonts/jetbrains-mono-latin.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/^\/(keystatic|api|_vercel\/(insights|speed-insights))/.test(url.pathname)) return;

  const page = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (page) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
        return res;
      }).catch(() => caches.match(url.pathname).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  if (/^\/(_astro|fonts)\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  if (/^\/(_vercel\/image|media)\b/.test(url.pathname) || /\.(png|svg|ico|webp|jpg)$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    })));
  }
});
