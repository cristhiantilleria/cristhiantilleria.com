// Site behaviour, ported from the legacy src/template.html: smooth scroll, page transitions, reveals,
// water typography, cursor tag, magnetic buttons, contact form, booking overlay, image viewer, Lab canvas.
import Lenis from 'lenis';
import { track } from '@vercel/analytics';
import { mountCal } from './cal.js';

window.Lenis = Lenis;
var CONFIG = JSON.parse(document.getElementById('site-config').textContent || '{}');


// old-style links (/#/contact) go to the real page
if (/^#\//.test(location.hash)) location.replace(location.hash.slice(1).replace(/\/$/, '') || '/');

var root = document.documentElement, body = document.body;
var motionPref = matchMedia('(prefers-reduced-motion: reduce)'), reduce = motionPref.matches;   // kept live, see the end of the script
var $ = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

/* ---------- smooth scroll (falls back to native if the library is unavailable) ----------
   Lenis gets its own frame loop. Anything that depends on the scroll position listens to its scroll
   event, which fires inside that loop, so it lands in the same frame as the scroll instead of the next. */
var lenis = null, holds = {};
function smooth(on) {
  if (on && !lenis && window.Lenis) {
    var l = lenis = new Lenis({ lerp: .06, wheelMultiplier: .9 });
    l.on('scroll', function () { update(); });
    if (Object.keys(holds).length) l.stop();
    requestAnimationFrame(function raf(t) { if (lenis !== l) return; l.raf(t); requestAnimationFrame(raf); });
  } else if (!on && lenis) { lenis.destroy(); lenis = null; }
}
// The intro and the overlays each hold the page still; scrolling comes back once nothing holds it.
function hold(why, on) {
  if (on) holds[why] = true; else delete holds[why];
  var held = Object.keys(holds).length > 0;
  root.style.overflow = held ? 'hidden' : '';
  if (lenis) held ? lenis.stop() : lenis.start();
}
hold('intro', true);
function easeInOut(t) { return t < .5 ? 8 * t * t * t * t : 1 - Math.pow(2 - 2 * t, 4) / 2; }   // close to --ease-in-out
function scrollToY(target, instant) {
  if (lenis) lenis.scrollTo(target, { immediate: !!instant, force: true, duration: 2, easing: easeInOut });
  else if (typeof target === 'number') scrollTo({ top: target, behavior: instant || reduce ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ---------- hero name: chars rise one by one ---------- */
function splitName(scope) {
  var ci = 0;
  $$('.name__line', scope).forEach(function (line) {
    if (line.children.length) return;
    var text = line.textContent.trim();
    line.textContent = '';
    Array.from(text).forEach(function (ch) {
      var c = document.createElement('span');
      c.className = 'char';
      c.style.setProperty('--i', ci++);
      c.textContent = ch;
      line.appendChild(c);
    });
  });
}
$$('.guides i').forEach(function (g, n) { g.style.setProperty('--n', n); });

/* ---------- typed / swept mono text ---------- */
// sweep=false: text types in behind a block cursor. sweep=true: a block runs across text that stays visible.
function type(el, sweep) {
  var text = el.dataset.t || (el.dataset.t = el.textContent);
  clearInterval(el._ti);
  el.classList.add('typed');
  if (reduce) { el.textContent = text; return; }
  var n = text.length, i = 0, step = Math.max(1, Math.ceil(n / 34));
  function frame() {
    i = Math.min(n, i + step);
    if (i >= n) { clearInterval(el._ti); el.textContent = text; return; }
    var rest = esc(text.slice(i + 2));
    el.innerHTML = esc(text.slice(0, i)) + '<span class="blk"><b>' + esc(text.slice(i, i + 2)) + '</b></span>' +
      (sweep ? rest : '<span style="visibility:hidden">' + rest + '</span>');
  }
  if (!sweep) el.innerHTML = '<span style="visibility:hidden">' + esc(text) + '</span>';
  el._ti = setInterval(frame, 38);
}
function bindSweep(scope) {
  $$('[data-sweep]', scope).forEach(function (el) {
    if (el._sweep) return;
    el._sweep = true;
    (el.closest('a, button') || el).addEventListener('mouseenter', function () {
      if (el.matches('[data-type]:not(.typed)')) return;
      type(el, true);
    });
  });
}

/* ---------- auto line splitting for the big statement ---------- */
function splitLines(el) {
  // Phones fire resize while the address bar slides; the lines only change with the width or type size.
  var key = el.clientWidth + '/' + getComputedStyle(el).fontSize + '/' + (document.fonts ? document.fonts.status : '');
  if (key === el._split) return;
  el._split = key;
  var text = el.dataset.src || (el.dataset.src = el.textContent.trim().replace(/\s+/g, ' '));
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map(function (w) { return '<span style="display:inline-block">' + esc(w) + '</span>'; }).join(' ');
  var lines = [], top = null;
  $$('span', el).forEach(function (w) {
    if (w.offsetTop !== top) { top = w.offsetTop; lines.push([]); }
    lines[lines.length - 1].push(w.textContent);
  });
  el.innerHTML = lines.map(function (l, n) {
    var t = esc(l.join(' ')).replace(/"/g, '&quot;');
    return '<span class="ln" aria-hidden="true" style="--l:' + n + '"><span>' + t + '</span></span>';
  }).join('');
}

/* ---------- reveal on scroll ---------- */
function show(el) {
  el.classList.add('in');
  ripple(el, .2);
  var typed = $$('[data-type]', el);
  if (el.matches('[data-type]')) typed.unshift(el);
  typed.forEach(function (t, n) { setTimeout(function () { type(t, false); }, n * 140); });
}
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    var wait = +en.target.dataset.wait || 0;
    wait ? setTimeout(show, wait, en.target) : show(en.target);
  });
}, { threshold: .12 });

function arm(scope) {
  $$('[data-lines]', scope).forEach(splitLines);
  $$('[data-reveal]', scope).forEach(function (el) {
    el.classList.remove('in');
    $$('[data-type]', el).forEach(function (t) { clearInterval(t._ti); t.classList.remove('typed'); });
    io.observe(el);
  });
}

/* ---------- views + page transition ----------
   Every page is a real URL whose HTML holds only its own view. Moving between pages fetches the
   next page, lifts its view out and swaps it in behind the transition. */
var views = {}, main = $('main');
$$('.view').forEach(function (v) { views[v.dataset.view] = v; });
var footer = $('.footer'), header = $('.header');
var current = null, busy = false;

function nameOf(path) { return path.replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '') || 'index'; }
function pathOf(name) { return name === 'index' ? '/' : '/' + name; }
function load(name) {
  if (views[name]) return Promise.resolve(views[name]);
  return fetch(pathOf(name), { headers: { Accept: 'text/html' } }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.text();
  }).then(function (html) {
    var v = new DOMParser().parseFromString(html, 'text/html').querySelector('.view');
    if (!v || v.dataset.view !== name) throw new Error('No such view');
    v = document.importNode(v, true);
    v.hidden = true;
    main.appendChild(v);
    views[name] = v;
    initView(v);
    return v;
  });
}
function activate(name) {
  Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
  current = name;
  body.dataset.view = name;
  document.title = views[name].dataset.title;
  $$('[data-nav]').forEach(function (a) {
    a.dataset.nav === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  if (name === 'contact') track('Book a Call', { action: 'Viewed page', page: '/contact' });
}
// Each page change bumps seq, so timers left over from an earlier change can tell they're stale.
var seq = 0;
function enter(name, delay) {
  var run = seq;
  setTimeout(function () { if (run === seq) { arm(views[name]); arm(footer); } }, delay);
}
// Lines are measured and masked in the same task the view is shown, so the statement never paints as plain text.
// Always rebuilt: lines kept from an earlier visit would carry the leave transform and sweep through view.
function splitNow(name) { $$('[data-lines]', views[name]).forEach(function (el) { el._split = null; splitLines(el); }); }
// The browser putting back an old scroll position on Back would fight the transition; the page scrolls itself.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function go(name) {
  if (name === current || busy) return;
  busy = true;
  var run = ++seq;
  function hard(n) { location.href = pathOf(n); }   // unknown page or offline: let the browser handle it
  if (lb.classList.contains('on')) lbToggle(false);
  tag.classList.remove('on');
  if (reduce) {
    load(name).then(function () {
      activate(name); splitNow(name); scrollToY(0, true); enter(name, 0); update(); busy = false;
      var wanted = nameOf(location.pathname);
      if (wanted !== current) go(wanted);
    }, function () { hard(name); });
    return;
  }
  hold('leave', true);                             // the page stays where it was while it leaves
  body.classList.remove('is-entering');
  body.classList.add('is-leaving');
  var leaving = new Promise(function (done) { setTimeout(done, 1100); });
  Promise.all([load(name), leaving]).then(function () {
    var target = nameOf(location.pathname);        // a click or Back during the leave changes where we land
    return target === name ? target : load(target).then(function () { return target; }, function () { hard(target); throw 0; });
  }).then(function (target) {
    activate(target);
    scrollToY(0, true);
    hold('leave', false);
    if (lenis) lenis.resize();
    $$('[data-reveal]', views[target]).concat($$('[data-reveal]', footer)).forEach(function (el) { el.classList.remove('in'); });
    var heroName = $('.name', views[target]);
    if (heroName) { heroName.classList.remove('play'); heroName.style.setProperty('--t-title', '.35s'); void heroName.offsetWidth; heroName.classList.add('play'); setTimeout(function () { kick(heroName._water, .18); }, 600); }
    body.classList.remove('is-leaving');
    splitNow(target);
    body.classList.add('is-entering');
    update();
    enter(target, 550);
    views[target].focus({ preventScroll: true });
    busy = false;                                  // the next click can start leaving straight away
    setTimeout(function () { if (run === seq) body.classList.remove('is-entering'); }, 2100);
  }, function (err) { if (err !== 0) hard(name); });
}
addEventListener('popstate', function () {
  if (lb.classList.contains('on')) lbToggle(false);   // Back closes the viewer and lets go of its scroll hold
  go(nameOf(location.pathname));
});
document.addEventListener('click', function (e) {
  var s = e.target.closest('[data-scroll]');
  if (s) { scrollToY($(s.dataset.scroll)); return; }
  var a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target || a.origin !== location.origin || /\.[a-z0-9]{2,5}$/i.test(a.pathname)) return;   // new tab, other site, file
  if (a.hash && a.pathname === location.pathname && a.search === location.search) return;   // same-page #hash: leave it to the browser / booking overlay
  e.preventDefault();
  var name = nameOf(a.pathname);
  if (name === current && !busy) { scrollToY(0); return; }
  if (name !== nameOf(location.pathname)) history.pushState(null, '', pathOf(name));   // mid-leave, this just changes where it lands
  go(name);
});

/* ---------- first load: curtain, then content ---------- */
activate(($('.view:not([hidden])') || $('.view')).dataset.view);
var loader = $('.loader');
function unlock() { hold('intro', false); root.classList.remove('is-loading'); }
loader.addEventListener('animationend', function (e) { if (e.target === loader) { loader.remove(); unlock(); waterGo(); } });
// The intro clock starts only when the loader is really on screen: fonts in and a frame painted.
// On slow phones the page can take seconds to appear, and a clock that started earlier would
// have the curtain lifting before anyone saw it.
var introStarted = false;
function startIntro() {
  if (introStarted) return;
  introStarted = true;
  root.classList.add('is-ready');
  splitNow(current);
  setTimeout(unlock, 4000);
  enter(current, reduce ? 600 : 2500);
  setTimeout(function () { header.classList.add('in'); }, reduce ? 600 : 4700);
  if (reduce) return;
  setTimeout(function () { if (!seq) body.classList.add('is-entering'); }, 2150);
  setTimeout(function () { if (!seq) body.classList.remove('is-entering'); }, 5200);
  if (current === 'index') setTimeout(function () { if (!seq) ripple(views.index.querySelector('.hero'), .18); }, 2850);
}
Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise(function (r) { setTimeout(r, 1500); })])
  .then(function () { requestAnimationFrame(function () { requestAnimationFrame(startIntro); }); });
setTimeout(startIntro, 3200);          // in case frames are not being produced (background tab)

/* ---------- New York clock ---------- */
var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
function tick() { var t = fmt.format(new Date()); $$('.clock').forEach(function (c) { c.textContent = t; }); }
tick(); setInterval(tick, 1000);

/* ---------- footer headline: sliced into strips that stretch ---------- */
var touch = $('.touch'), AMP = [2.4, -.55, 1.5, -.6, 1.1, 2.8], strips = [];
(function () {
  var t = esc(touch.dataset.text);
  var html = '<span class="touch__size" aria-hidden="true">' + t + '</span>';
  AMP.forEach(function (_, n) {
    var a = n === 0 ? -30 : n * 100 / AMP.length, b = n === AMP.length - 1 ? -30 : (AMP.length - 1 - n) * 100 / AMP.length;
    html += '<span class="touch__strip" aria-hidden="true" style="clip-path:inset(' + a + '% -5% ' + b + '% -5%);transform-origin:50% ' + ((n + .5) * 100 / AMP.length) + '%">' + t + '</span>';
  });
  touch.innerHTML = html;
  strips = $$('.touch__strip', touch);
})();
var sliceScroll = 0, sliceHover = 0, sliceKey = '', swellT0 = 0, swelling = false;
function slice() {
  var t = Math.max(sliceScroll, sliceHover), key = t < .002 ? '' : t.toFixed(4);
  if (key === sliceKey) return;                  // nothing moved: leave the strips alone
  sliceKey = key;
  strips.forEach(function (s, n) { s.style.transform = key && 'scaleY(' + Math.max(.05, 1 + t * AMP[n]).toFixed(3) + ')'; });
}
touch.addEventListener('mouseenter', function () {
  if (reduce) return;
  var now = performance.now(), p = swelling ? (now - swellT0) / 1100 : 1;
  // coming back in while it is still settling picks the swell up at the same height instead of starting a second loop
  swellT0 = now - (p < 1 ? Math.min(p, 1 - p) * 1100 : 0);
  if (swelling) return;
  swelling = true;
  requestAnimationFrame(function swell(now) {
    var p = Math.min(1, Math.max(0, (now - swellT0) / 1100));
    sliceHover = Math.sin(p * Math.PI) * .18;
    slice();
    if (p < 1) requestAnimationFrame(swell); else swelling = false;
  });
});

/* ---------- scroll-driven: dark switch, footer stretch ---------- */
var darks = $$('[data-dark]'), queued = false;
function update() {
  queued = false;
  var vh = innerHeight, mid = vh * .6;
  body.classList.toggle('is-dark', darks.some(function (d) {
    if (!d.offsetParent) return false;
    var r = d.getBoundingClientRect();
    return r.top < mid && r.bottom > mid;
  }));
  var remaining = root.scrollHeight - (scrollY + vh);
  var t = Math.min(1, Math.max(0, remaining / (vh * .8)));
  sliceScroll = reduce || !touch.offsetParent ? 0 : t * t * .7;
  slice();
  var w = touch._water;
  if (!w) return;
  // the swell only runs while the headline is on screen; off screen it kept the water loop going for nothing
  var r = touch.getBoundingClientRect();
  w.floor = r.bottom > 0 && r.top < vh ? sliceScroll * size(w) * .16 : 0;
  if (w.floor > .5) startWater();
}
function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
addEventListener('scroll', function () { if (!lenis) queue(); }, { passive: true });   // with Lenis, its scroll event calls update()
addEventListener('resize', function () {
  queue();
  clearTimeout(splitLines._t);
  splitLines._t = setTimeout(function () { $$('[data-lines]', views[current]).forEach(splitLines); }, 200);
});
update();
smooth(!reduce);
// The intro stops waiting for fonts after 1.5s; lines measured in the fallback face are measured again once the real one is in.
if (document.fonts) document.fonts.ready.then(function () { if (current) $$('[data-lines]', views[current]).forEach(splitLines); });

/* ---------- water typography ----------
   Big type sits behind one SVG displacement filter per headline. Three things feed it:
   1. a whole-headline swell (on reveal, and on the footer while scrolling),
   2. a lens that follows the pointer and gets stronger the faster you move,
   3. drops: rings that spread from where the pointer has been, and a big splash on click/tap. */
var waters = [], waterOn = false, waterLast = 0, SLOTS = 6;   // slot 0 = lens, 1..5 = drops
// Nothing moves behind the curtain: kicks asked for before it has gone are kept and played once it lifts.
var waterReady = false;
function waterGo() {
  if (waterReady) return;
  waterReady = true;
  waters.forEach(function (w) { var s = w.pend; w.pend = 0; if (s) kick(w, s); });
  update();
}
var wsvg = null, ringMap, swells;

// Displacement maps are drawn once on tiny canvases: red pushes pixels sideways, green up and down,
// mid-grey means "leave it alone".
function drawMap(W, H, fn) {
  var c = document.createElement('canvas');
  c.width = W; c.height = H;
  var ctx = c.getContext('2d'), im = ctx.createImageData(W, H), d = im.data;
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var v = fn(x / W, y / H), i = (y * W + x) * 4;
    d[i] = 128 + 127 * v[0]; d[i + 1] = 128 + 127 * v[1]; d[i + 2] = 128; d[i + 3] = 255 * v[2];
  }
  ctx.putImageData(im, 0, 0);
  return c.toDataURL();
}
function swellMap(seed) {
  var TAU = 6.2832;
  return drawMap(48, 96, function (x, y) {
    var u = x * TAU, v = y * TAU;
    return [Math.sin(v * 3 + seed + Math.sin(u + seed) * 1.2) * (.6 + .4 * Math.sin(v + u * 2 + seed)), .8 * Math.sin(u * 2 + v * 2.5 + seed * 2), 1];
  });
}
// Built the first time a headline needs it, so reduced motion never pays for it.
function waterMaps() {
  if (wsvg) return;
  wsvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wsvg.setAttribute('aria-hidden', 'true');
  wsvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  body.appendChild(wsvg);
  // concentric ripple pushing pixels outward/inward along the radius, fading to nothing at the rim
  ringMap = drawMap(128, 128, function (x, y) {
    var dx = x * 2 - 1, dy = y * 2 - 1, r = Math.hypot(dx, dy);
    if (r >= 1) return [0, 0, 0];
    var wave = Math.sin(r * 9.42) * Math.pow(r, .6), k = r || 1;
    return [dx / k * wave, dy / k * wave, Math.min(1, (1 - r) * 3.5)];
  });
  swells = [swellMap(.4), swellMap(2.1), swellMap(3.9)];
}
// Filter attributes are only written when they change: every write makes the browser re-run the filter.
function attr(el, k, v) { if (el['_' + k] !== v) { el['_' + k] = v; el.setAttribute(k, v); } }

function addWater(el) {
  waterMaps();
  var id = 'water-' + waters.length, n, merge = '';
  var h = '<filter id="' + id + '" x="-10%" y="-35%" width="120%" height="170%" color-interpolation-filters="sRGB">' +
    '<feFlood flood-color="rgb(128,128,128)" result="n"/>' +
    '<feImage href="' + swells[waters.length % swells.length] + '" preserveAspectRatio="none" result="g"/>' +
    '<feComponentTransfer in="g" result="gg"><feFuncA type="linear" slope="0"/></feComponentTransfer>';
  for (n = 0; n < SLOTS; n++) {
    h += '<feImage href="' + ringMap + '" preserveAspectRatio="none" x="0" y="0" width="1" height="1" result="r' + n + '"/>' +
      '<feComponentTransfer in="r' + n + '" result="q' + n + '"><feFuncA type="linear" slope="0"/></feComponentTransfer>';
    merge += '<feMergeNode in="q' + n + '"/>';
  }
  h += '<feMerge result="m"><feMergeNode in="n"/><feMergeNode in="gg"/>' + merge + '</feMerge>' +
    '<feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/>' +
    '<feGaussianBlur stdDeviation=".5"/></filter>';   // displacement samples the nearest pixel and tears the edges; this smooths them back
  wsvg.insertAdjacentHTML('beforeend', h);
  var f = wsvg.lastElementChild, imgs = $$('feImage', f), fa = $$('feFuncA', f);
  var w = {
    el: el, id: id, disp: $('feDisplacementMap', f), swellA: fa[0], imgs: imgs.slice(1), fa: fa.slice(1),
    drops: [], next: 1, e: 0, pend: 0, floor: 0, lens: 0, px: 0, py: 0, lx: null, ly: 0, fs: 0, on: false, t: waters.length * 1.7
  };
  for (n = 0; n < SLOTS; n++) w.drops.push({ life: 0 });
  waters.push(w);
  el._water = w;

  function at(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  el.addEventListener('pointerenter', function () { kick(w, .04); });
  el.addEventListener('pointermove', function (e) {
    if (reduce || !waterReady) return;
    var p = at(e), fs = size(w);
    w.px = p[0]; w.py = p[1];
    w.lens = Math.min(.8, w.lens + .04 + Math.hypot(e.movementX, e.movementY) * .02);
    // leave a spreading ring behind every stretch of pointer travel
    if (w.lx === null || Math.hypot(p[0] - w.lx, p[1] - w.ly) > fs * .3) {
      drop(w, p[0], p[1], fs * .12, fs * 1.05, 1500, .45);
      w.lx = p[0]; w.ly = p[1];
    }
    startWater();
  });
  el.addEventListener('pointerleave', function () { w.lx = null; });
  el.addEventListener('pointerdown', function (e) {
    if (reduce || !waterReady) return;
    var p = at(e), fs = size(w);
    drop(w, p[0], p[1], fs * .2, fs * 3, 2600, .85);
    kick(w, .05);
  });
  return w;
}
function size(w) { return w.fs || (w.fs = parseFloat(getComputedStyle(w.el).fontSize)); }
function drop(w, x, y, r0, r1, life, power) {
  var d = w.drops[w.next];
  w.next = w.next % (SLOTS - 1) + 1;
  d.x = x; d.y = y; d.r0 = r0; d.r1 = r1; d.life = life; d.age = 0; d.power = power;
  startWater();
}
function place(w, n, x, y, R, strength) {
  var im = w.imgs[n];
  attr(im, 'x', (x - R).toFixed(1)); attr(im, 'y', (y - R).toFixed(1));
  attr(im, 'width', (R * 2).toFixed(1)); attr(im, 'height', (R * 2).toFixed(1));
  attr(w.fa[n], 'slope', strength.toFixed(3));
}
// flat water: filter off, every input back to zero so the next start has no leftovers
function still(w) {
  if (w.on) { w.el.style.filter = ''; w.on = false; }
  attr(w.disp, 'scale', '0');
  w.e = w.lens = 0; w.lx = null;
  w.drops.forEach(function (d) { d.life = 0; });
  attr(w.swellA, 'slope', '0');
  w.fa.forEach(function (f) { attr(f, 'slope', '0'); });
}
// whole-headline swell; strength is relative to font size so every headline moves in proportion
function kick(w, strength) {
  if (reduce || !w) return;
  if (!waterReady) { w.pend = Math.max(w.pend, strength); return; }
  var fs = size(w);
  w.e = Math.min(fs * .3, w.e + fs * strength);
  startWater();
}
function startWater() { if (!waterOn && !reduce && waterReady) { waterOn = true; waterLast = performance.now(); requestAnimationFrame(flow); } }
function flow(now) {
  if (reduce) { waters.forEach(still); waterOn = false; return; }
  var active = false, ms = Math.max(0, Math.min(100, now - waterLast)), dt = ms / 16.7;
  waterLast = now;
  waters.forEach(function (w) {
    var amp = Math.max(w.e, w.floor), fs = size(w);
    w.e *= Math.pow(.965, dt);
    w.lens *= Math.pow(.94, dt);
    w.t += .05 * dt;
    var swell = Math.min(1, amp / (fs * .3)) * (.72 + .28 * Math.sin(w.t)), lens = w.lens > .02 ? w.lens * .8 : 0, peak = Math.max(swell, lens);
    w.drops.forEach(function (d, n) {
      if (!d.life) return;
      d.age += ms;
      var p = d.age / d.life;
      if (p >= 1) { d.life = 0; attr(w.fa[n], 'slope', '0'); return; }
      var k = d.power * Math.pow(1 - p, 1.4);
      peak = Math.max(peak, k);
      place(w, n, d.x, d.y, d.r0 + (d.r1 - d.r0) * (1 - Math.pow(1 - p, 3)), k);
    });
    // Largest push in px (the map sits within ±.5 of grey). Under a few px it only roughens the edges,
    // so the scale itself eases to 0 over that last stretch and the filter comes off once it is under a third of a px.
    var push = fs * .15 * peak, fade = Math.min(1, push / 3);
    if (push * fade < .3) { still(w); return; }
    active = true;
    attr(w.swellA, 'slope', swell.toFixed(3));
    if (lens) place(w, 0, w.px, w.py, fs * .5, lens); else attr(w.fa[0], 'slope', '0');
    attr(w.disp, 'scale', (fs * .3 * fade).toFixed(1));
    if (!w.on) { w.el.style.filter = 'url(#' + w.id + ')'; w.on = true; }
  });
  waterOn = active;
  if (active) requestAnimationFrame(flow);
}
function bindWater(scope) { if (!reduce) $$('.name, .h2, .touch', scope).forEach(function (el) { if (!el._water) addWater(el); }); }
bindWater(document);
addEventListener('resize', function () { waters.forEach(function (w) { w.fs = 0; }); });
function ripple(scope, strength) {
  $$('.name, .h2', scope).concat(scope._water ? [scope] : []).forEach(function (el) { kick(el._water, strength); });
}

/* ---------- pointer micro-interactions ---------- */
// The tag eases after the pointer once per frame; a CSS transition restarted on every mousemove stutters.
var tag = $('.cursor-tag'), tagX = 0, tagY = 0, tagTX = 0, tagTY = 0, tagLast = 0, tagRun = false;
function tagAt(x, y) { tag.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; }
function tagFollow(now) {
  var dt = Math.max(0, Math.min(50, now - tagLast)) / 16.7, k = 1 - Math.pow(.7, dt);
  tagLast = now;
  tagX += (tagTX - tagX) * k; tagY += (tagTY - tagY) * k;
  var done = Math.abs(tagTX - tagX) < .1 && Math.abs(tagTY - tagY) < .1;
  if (done) { tagX = tagTX; tagY = tagTY; }
  tagAt(tagX, tagY);
  tagRun = !done;
  if (tagRun) requestAnimationFrame(tagFollow);
}
addEventListener('mousemove', function (e) {
  var h = !busy && e.target.closest && e.target.closest('[data-cursor]'), shown = tag.classList.contains('on');   // no tag while a page is leaving
  if (h && tag.textContent !== h.dataset.cursor) tag.textContent = h.dataset.cursor;
  if (h) {
    tagTX = e.clientX + 16; tagTY = e.clientY + 18;
    if (!shown || reduce) { tagX = tagTX; tagY = tagTY; tagAt(tagX, tagY); }   // appear where the pointer is, not sliding in from the corner
    else if (!tagRun) { tagRun = true; tagLast = performance.now(); requestAnimationFrame(tagFollow); }
  }
  if (!!h !== shown) tag.classList.toggle('on', !!h);
}, { passive: true });
function bindMagnetic(scope) {
  $$('[data-magnetic]', scope).forEach(function (m) {
    if (m._magnetic) return;
    m._magnetic = true;
    m.addEventListener('mousemove', function (e) {
      if (reduce) return;
      // measure from where the button rests, not where it has been pulled to, or it chases its own offset
      var r = m.getBoundingClientRect(), t = new DOMMatrixReadOnly(getComputedStyle(m).transform);
      var cx = r.left + r.width / 2 - t.m41, cy = r.top + r.height / 2 - t.m42;
      m.style.transform = 'translate(' + ((e.clientX - cx) * .22).toFixed(1) + 'px,' + ((e.clientY - cy) * .35).toFixed(1) + 'px)';
    });
    m.addEventListener('mouseleave', function () { m.style.transform = ''; });
  });
}

/* ---------- contact ---------- */
function bindContact(scope) {
  var form = $('.form', scope);
  if (!form || form._bound) return;
  form._bound = true;
  var status = $('[data-status]', scope), label = $('[data-copy-label]', scope);
  $('[data-email]', scope).textContent = CONFIG.email;
  $('[data-copy]', scope).addEventListener('click', function () {
    function done(msg) { label.dataset.t = msg; type(label, false); }
    if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.email).then(function () { done('Copied to clipboard'); }, function () { done('Copy failed — select it below'); });
    else done('Copy failed — select it below');
  });
  // The form posts to FormSubmit, which emails it to CONFIG.email. If that fails, fall back to the visitor's email app.
  var sending = false, button = $('button[type="submit"]', form);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var d = new FormData(form), name = (d.get('name') || '').trim(), email = (d.get('email') || '').trim();
    function say(msg) { status.dataset.t = msg; type(status, false); }
    if (!name) { say('Please add your name'); form.elements.name.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { say('Please add a valid email'); form.elements.email.focus(); return; }
    if (d.get('_honey')) return;                                   // bots fill the hidden field
    var subject = 'Project enquiry — ' + name;
    function viaEmailApp() {
      var text = 'Hi Cristhian,\n\nName: ' + name + '\nEmail: ' + email + '\nNeed: ' + d.get('need') + '\nBudget: ' + d.get('budget') + '\n\n' + (d.get('message') || '');
      location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    }
    sending = true; button.disabled = true;
    say('Sending…');
    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.email), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: name, email: email, need: d.get('need'), budget: d.get('budget'), message: d.get('message') || '', _subject: subject, _replyto: email, _template: 'table', _captcha: 'false' })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (String(j.success) !== 'true') throw new Error(j.message || 'Not sent');
      say('Sent — thank you. I will be in touch soon.');
      form.reset();
    }).catch(function (err) {
      if (/activat/i.test(err.message)) say('Almost set up — the site owner needs to confirm this form once by email');
      else { say('Could not send here — opening your email app instead'); viaEmailApp(); }
    }).then(function () { sending = false; button.disabled = false; });
  });
}

/* ---------- clicks on buttons, recorded with the label and where on the page they sit ---------- */
function buttonPlace(el) {
  if (el.closest('.header')) return 'header';
  if (el.closest('.footer')) return 'footer';
  if (el.closest('.hero')) return 'hero';
  if (el.closest('.contact__aside')) return 'contact';
  if (el.closest('form')) return 'form';
  return 'page';
}
document.addEventListener('click', function (e) {
  if (e.button || !e.target.closest) return;
  var el = e.target.closest('a.btn, button.btn, a.pill, a.touch, button[data-copy]');
  if (!el || el.closest('.book, .lb')) return;                     // viewer and calendar chrome, not a call to action
  var named = el.querySelector('[data-copy-label]');
  // textContent keeps the authored words. innerText would follow the uppercase button style.
  var label = (named ? named.textContent : (el.getAttribute('aria-label') || el.textContent) || '').replace(/\s+/g, ' ').trim();
  if (!label) return;
  track('Button Click', { label: label, page: location.pathname, place: buttonPlace(el) });
}, true);

/* ---------- booking overlay: one dialog, built once and appended to <body>; the calendar loads on first open ---------- */
(function () {
  var url = CONFIG.bookingUrl;
  if (!url) return;                                              // no calendar set up: the buttons stay normal links
  var box = document.createElement('div'), opener = null, loaded = false, timer = 0, isOpen = false;
  box.className = 'book'; box.setAttribute('data-lenis-prevent', ''); box.setAttribute('role', 'dialog');   // a stopped Lenis would otherwise swallow wheel scrolling inside the calendar
  box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'book-title');
  box.innerHTML = '<div class="book__bar"><h2 id="book-title">Book a 30-minute call</h2>' +
    '<button class="btn mono" type="button"><span data-sweep>Close</span><span class="btn__arrow" aria-hidden="true"></span></button></div>' +
    '<div class="book__body"><p class="book__load mono">Loading calendar…</p>' +
    '<p class="book__load mono" hidden>Calendar didn\'t load. <a class="link" target="_blank" rel="noopener" data-sweep>Open it on cal.com</a></p>' +
    '<div class="book__cal"></div></div>';
  body.appendChild(box);
  var cal = $('.book__cal', box), loading = $('.book__load', box), fallback = $('.book__load[hidden]', box), shut = $('button', box);
  var covered = [$('.header'), $('main'), $('footer')];
  $('a', fallback).href = url;
  function mount() {
    mountCal(cal, url, function () { loaded = true; clearTimeout(timer); loading.hidden = fallback.hidden = true; });
  }
  function open() {
    if (isOpen) return;
    isOpen = true; opener = document.activeElement;
    track('Book a Call', { action: 'Opened calendar', page: location.pathname });
    if (!timer) {
      mount();
      timer = setTimeout(function () { if (!loaded) { loading.hidden = true; fallback.hidden = false; } }, 15000);
    }
    if (location.hash !== '#book') history.replaceState(null, '', location.pathname + location.search + '#book');
    hold('book', true);
    covered.forEach(function (el) { if (el) el.inert = true; });
    box.classList.add('on');
    shut.focus({ preventScroll: true });
  }
  function close(keepUrl) {
    if (!isOpen) return;
    isOpen = false;
    box.classList.remove('on');
    covered.forEach(function (el) { if (el) el.inert = false; });
    hold('book', false);
    if (!keepUrl) history.replaceState(null, '', location.pathname + location.search.replace(/([?&])book=1&?/, '$1').replace(/[?&]$/, ''));
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  }
  shut.addEventListener('click', function () { close(); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button, a[href], iframe', box).filter(function (el) { return !el.closest('[hidden]'); });
    var i = f.indexOf(document.activeElement), n = e.shiftKey ? i - 1 : i + 1;
    if (i < 0 || n < 0 || n >= f.length) { e.preventDefault(); f[n < 0 ? f.length - 1 : 0].focus(); }
  });
  document.addEventListener('focusin', function (e) { if (isOpen && !box.contains(e.target)) shut.focus(); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-book-open]') || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation(); open();
  }, true);
  function sync() { location.hash === '#book' || /[?&]book=1(&|$)/.test(location.search) ? open() : close(true); }
  addEventListener('popstate', sync); addEventListener('hashchange', sync);
  bindSweep(box);
  // A /contact#book link opens the calendar once the intro has unlocked the page, not behind the curtain.
  if (!root.classList.contains('is-loading')) sync();
  else new MutationObserver(function (m, o) { if (!root.classList.contains('is-loading')) { o.disconnect(); sync(); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------- cover videos play only while they are on screen ---------- */
var videoIO = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (en.isIntersecting && !reduce) { var p = en.target.play(); if (p) p.catch(function () {}); } else en.target.pause();
  });
}, { threshold: .25 });
function bindVideos(scope) { $$('video[data-autoplay]', scope).forEach(function (v) { if (!v._seen) { v._seen = true; videoIO.observe(v); } }); }

/* ---------- image viewer for project galleries ---------- */
var lb = $('.lb'), lbImg = $('.lb__stage img'), lbSet = [], lbAt = 0, lbFrom = null;
function lbShow(n) {
  lbAt = (n + lbSet.length) % lbSet.length;
  var el = lbSet[lbAt], small = $('img', el), full = el.dataset.full;
  lbImg.src = small.getAttribute('src');          // already loaded, so it shows at once
  lbImg.alt = small.alt;
  if (full && full !== lbImg.getAttribute('src')) {
    var hi = new Image();
    hi.src = full;
    // decoded off the main thread before the swap, so the big image doesn't hitch the zoom
    (hi.decode ? hi.decode() : new Promise(function (ok) { hi.onload = ok; })).then(function () {
      if (lbSet[lbAt] === el && lb.classList.contains('on')) lbImg.src = full;
    }, function () {});
  }
  var name = $('figcaption b', el), kind = $('figcaption .mono', el);
  if (name) $('.lb__title').textContent = name.textContent + (kind && kind.textContent ? ' — ' + kind.textContent : '');
  $('.lb__count').textContent = ('0' + (lbAt + 1)).slice(-2) + ' / ' + ('0' + lbSet.length).slice(-2);
}
// Transform that makes the viewer image sit exactly over a tile on the page.
function lbOver(tile) {
  var r = tile.getBoundingClientRect(), s = $('.lb__stage').getBoundingClientRect();
  var w = Math.min(s.width, s.height * r.width / r.height);
  return 'translate(' + (r.left + r.width / 2 - s.left - s.width / 2).toFixed(1) + 'px,' + (r.top + r.height / 2 - s.top - s.height / 2).toFixed(1) + 'px) scale(' + (r.width / w).toFixed(4) + ')';
}
// Where the piece on screen now lives on the page: the tile it was opened from, or (in a gallery,
// after prev/next) the shot it belongs to. Only if that spot is in view; otherwise it just fades.
function lbHome() {
  var el = lbSet[lbAt], t = lbFrom && lbFrom._source === el ? lbFrom : el && el.classList.contains('shot') ? $('img', el) : null;
  if (!t || !t.isConnected) return null;
  var r = t.getBoundingClientRect();
  return r.width && r.bottom > 0 && r.top < innerHeight ? t : null;
}
function lbToggle(open, from) {
  var home;
  if (open) {
    lbFrom = from || null;
    if (lbFrom && !reduce) {                      // grow out of the clicked tile
      lbImg.style.transition = 'none';
      lbImg.style.transform = lbOver(lbFrom);
      void lbImg.offsetWidth;
      lbImg.style.transition = 'transform .9s var(--ease-out)';
      lbImg.style.transform = '';
    }
  } else if (!reduce && (home = lbHome())) {
    lbImg.style.transition = 'transform .6s var(--ease-in-out)';   // shrink back into its tile
    lbImg.style.transform = lbOver(home);
  }
  lb.classList.toggle('on', open);
  lb.setAttribute('aria-hidden', String(!open));
  hold('lb', open);
  if (open) $('[data-lb="close"]', lb).focus();
  else setTimeout(function () { if (!lb.classList.contains('on')) { lbImg.removeAttribute('src'); lbImg.style.transition = 'none'; lbImg.style.transform = ''; } }, 650);
}
document.addEventListener('click', function (e) {
  var shot = e.target.closest('.shot');
  if (shot) {
    lbSet = $$('.shot', shot.closest('.gallery'));
    $('.lb__title').textContent = shot.closest('.view').dataset.title.split(' — ')[0];
    lbShow(lbSet.indexOf(shot));
    lbToggle(true, $('img', shot));
    return;
  }
  var act = e.target.closest('[data-lb]');
  if (!act) return;
  if (act.dataset.lb === 'close') lbToggle(false); else lbShow(lbAt + (act.dataset.lb === 'next' ? 1 : -1));
});
addEventListener('keydown', function (e) {
  if (!lb.classList.contains('on')) return;
  if (e.key === 'Escape') lbToggle(false);
  if (e.key === 'ArrowRight') lbShow(lbAt + 1);
  if (e.key === 'ArrowLeft') lbShow(lbAt - 1);
});

/* ---------- visuals: an endless canvas you can drag in any direction ---------- */
function bindCanvas(scope) {
  var vz = $('.vz', scope);
  if (!vz || vz._bound) return;
  vz._bound = true;
  var stage = $('.vz__canvas', vz), src = $$('.vz__src .visual', vz);
  if (!src.length) return;
  var cols = [], PW = 0, CW = 0, G = 0, ox = 0, oy = 0, vx = 0, vy = 0, wx = 0, wy = 0, drift = 0, drag = null, travelled = 0, touched = 0;
  var lastT = 0, running = false, seen = false, dirty = false, relayout = 0, laid = '';
  // One feel for every way of moving it: a fling coasts and slows like the page scroll settles,
  // wheel steps are eased in rather than jumped, and the idle drift fades in and out.
  var FRICTION = .94, WHEEL = .16, DRIFT = .28, KEY = 26;
  function mod(a, n) { return ((a % n) + n) % n; }
  function rnd(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }   // repeatable scatter

  // Columns of tiles repeat the pieces; each column is tall enough to wrap without a visible gap.
  function layout() {
    var vw = vz.clientWidth, vh = vz.clientHeight;
    // small pieces with wide, uneven gaps so the canvas feels open
    CW = vw < 761 ? vw * .34 : Math.max(130, Math.min(230, vw * .12));
    G = vw < 761 ? vw * .14 : Math.max(90, vw * .085);
    if (!vw || !vh) return;                       // the view is hidden; the ResizeObserver lays out once it shows
    laid = vw + 'x' + vh;
    var n = Math.ceil((vw + CW + G) / (CW + G)) + 1;
    PW = n * (CW + G);
    stage.textContent = '';
    cols = [];
    var cap = 0;                                   // tiles are the image alone
    for (var c = 0; c < n; c++) {
      var col = { x: c * (CW + G), off: rnd(c, 99) * vh, items: [], h: 0 }, y = 0, k = c * 5, tallest = 0;
      while (y < vh + tallest + G || col.items.length < 3) {
        var s = src[k++ % src.length], h = CW * (s._ratio || 1.5) + cap;
        var el = s.cloneNode(true);
        el._source = s;
        el.style.width = CW + 'px';
        var im = $('img', el);
        im.loading = 'eager';
        im.addEventListener('load', measured);
        stage.appendChild(el);
        col.items.push({ el: el, y: y, h: h, jx: (rnd(c, k) - .5) * G * .6 });
        tallest = Math.max(tallest, h);
        y += h + G * (.7 + rnd(k, c) * .9);
      }
      col.h = y;
      cols.push(col);
    }
    draw();
  }
  // Real image proportions arrive as images load; lay out again once if any differ from the guess.
  function measured(e) {
    var im = e.target, s = im.parentNode._source, r = im.naturalHeight / im.naturalWidth;
    if (!r || (s._ratio && Math.abs(s._ratio - r) < .02)) return;
    var guessed = s._ratio || 1.5;
    s._ratio = r;
    if (Math.abs(guessed - r) > .02) { clearTimeout(relayout); relayout = setTimeout(layout, 120); }
  }
  function draw() {
    cols.forEach(function (col) {
      var x = mod(col.x + ox + CW + G, PW) - CW - G;
      col.items.forEach(function (it) {
        var y = mod(it.y + oy + col.off + it.h, col.h) - it.h;
        it.el.style.transform = 'translate3d(' + (x + it.jx).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
    });
  }
  // The frame loop only runs while the canvas is on screen, and under reduced motion only while something moves.
  function wake() { if (!running && seen) { running = true; lastT = 0; requestAnimationFrame(tick); } }
  vz._wake = wake;
  function tick(now) {
    if (!seen) { running = false; return; }
    var dt = lastT ? Math.min(50, Math.max(0, now - lastT)) / 16.7 : 1, moved = dirty;
    lastT = now; dirty = false;
    if (!drag) {
      if (Math.abs(wx) > .1 || Math.abs(wy) > .1) {
        var k = 1 - Math.pow(1 - WHEEL, dt);
        ox += wx * k; oy += wy * k; wx -= wx * k; wy -= wy * k; moved = true;
      } else wx = wy = 0;
      if (Math.abs(vx) > .05 || Math.abs(vy) > .05) {
        var f = Math.pow(FRICTION, dt);
        ox += vx * dt; oy += vy * dt; vx *= f; vy *= f; moved = true;
      } else vx = vy = 0;
    }
    var idle = !reduce && !drag && !moved && now - touched > 2600 && !lb.classList.contains('on');
    drift += ((idle ? DRIFT : 0) - drift) * (1 - Math.pow(.97, dt));   // slow idle drift, eased in and out
    if (drift > .004) { oy -= drift * dt; moved = true; } else drift = 0;
    if (moved) draw();
    if (reduce && !moved && !drag) { running = false; return; }
    requestAnimationFrame(tick);
  }
  function stir() { touched = performance.now(); drift = 0; wake(); }
  vz.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    drag = { x: e.clientX, y: e.clientY, ox: ox, oy: oy, px: e.clientX, py: e.clientY, t: e.timeStamp, vx: 0, vy: 0 };
    travelled = 0; vx = vy = wx = wy = 0; stir();
    vz.setPointerCapture(e.pointerId);
    vz.classList.add('is-drag');
  });
  vz.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.px, dy = e.clientY - drag.py, k = 16.7 / Math.max(1, e.timeStamp - drag.t);
    ox = drag.ox + e.clientX - drag.x; oy = drag.oy + e.clientY - drag.y;
    // velocity in px per 60Hz frame, smoothed, so the fling is the same on any pointer rate
    drag.vx = drag.vx * .25 + dx * k * .75; drag.vy = drag.vy * .25 + dy * k * .75;
    travelled += Math.abs(dx) + Math.abs(dy);
    drag.px = e.clientX; drag.py = e.clientY; drag.t = e.timeStamp;
    dirty = true; stir();                         // drawn on the next frame, once, however many events arrive
  });
  function release(e) {
    if (!drag) return;
    var d = drag, held = e.timeStamp - d.t > 80;  // stopped before letting go: no fling
    drag = null;
    vz.classList.remove('is-drag');
    vx = reduce || held ? 0 : Math.max(-80, Math.min(80, d.vx));
    vy = reduce || held ? 0 : Math.max(-80, Math.min(80, d.vy));
    stir();
    if (travelled > 6 || e.type !== 'pointerup') return;
    vx = vy = 0;
    var hit = document.elementFromPoint(e.clientX, e.clientY), tile = hit && hit.closest('.vz__canvas .visual');
    if (!tile) return;
    lbSet = src;                                   // open the piece: it grows out of its tile and its details appear
    lbShow(src.indexOf(tile._source));
    lbToggle(true, tile);
  }
  vz.addEventListener('pointerup', release);
  vz.addEventListener('pointercancel', release);
  vz.addEventListener('wheel', function (e) {
    e.preventDefault();
    var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vz.clientHeight : 1;
    vx = vy = 0;
    if (reduce) { ox -= e.deltaX * unit; oy -= e.deltaY * unit; dirty = true; }
    else { wx -= e.deltaX * unit; wy -= e.deltaY * unit; }
    stir();
  }, { passive: false });
  addEventListener('keydown', function (e) {
    if (!seen || lb.classList.contains('on')) return;
    var k = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!k) return;
    e.preventDefault();
    if (reduce) { ox += k[0] * KEY / (1 - FRICTION); oy += k[1] * KEY / (1 - FRICTION); dirty = true; }   // same distance, no glide
    else { vx = k[0] * KEY; vy = k[1] * KEY; }
    stir();
  });
  // size changes (and the view being shown) re-lay out from here, instead of reading the size every frame
  new ResizeObserver(function () { if (vz.clientWidth && laid !== vz.clientWidth + 'x' + vz.clientHeight) layout(); }).observe(vz);
  new IntersectionObserver(function (en) { seen = en[en.length - 1].isIntersecting; if (seen) { touched = performance.now(); wake(); } }).observe(vz);
  layout();
}

/* ---------- wire up whatever is on the page now; fetched views call this again ---------- */
function initView(scope) { splitName(scope); bindSweep(scope); bindWater(scope); bindMagnetic(scope); bindContact(scope); bindVideos(scope); bindCanvas(scope); }
initView(document);

/* ---------- reduced motion can be switched on or off while the page is open ---------- */
if (motionPref.addEventListener) motionPref.addEventListener('change', function (e) {
  reduce = e.matches;
  smooth(!reduce);                               // Lenis off (or back on); the water loop tears itself down on its next frame
  if (reduce) $$('[data-magnetic]').forEach(function (m) { m.style.transform = ''; });
  else bindWater(document);
  $$('video[data-autoplay]').forEach(function (v) { if (v._seen) { videoIO.unobserve(v); videoIO.observe(v); } });   // re-check: pause or resume
  $$('.vz').forEach(function (v) { if (v._wake) v._wake(); });
  update();
});
