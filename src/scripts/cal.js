// Cal.com inline embed, themed to the paper/ink palette. Loads embed.js on first call.
const THEME = {
  'cal-bg': '#f4f2ec', 'cal-bg-muted': '#ebe8e0', 'cal-bg-subtle': '#ebe8e0', 'cal-bg-emphasis': '#dcdcd8',
  'cal-border': '#d6d5d0', 'cal-border-subtle': '#d6d5d0',
  'cal-text': '#0a0a0a', 'cal-text-emphasis': '#0a0a0a', 'cal-text-subtle': '#7d7b75', 'cal-text-muted': '#7d7b75',
  'cal-brand': '#0a0a0a', 'cal-brand-text': '#f4f2ec'
};

export function mountCal(el, url, onReady) {
  (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }, d = C.document; C.Cal = C.Cal || function () { var c = C.Cal, ar = arguments; if (!c.loaded) { c.ns = {}; c.q = c.q || []; d.head.appendChild(d.createElement('script')).src = A; c.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }, ns = ar[1]; api.q = api.q || []; if (typeof ns === 'string') { c.ns[ns] = c.ns[ns] || api; p(c.ns[ns], ar); p(c, ['initNamespace', ns]); } else p(c, ar); return; } p(c, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
  var Cal = window.Cal;
  var layout = matchMedia('(max-width: 700px)').matches ? 'column_view' : 'month_view';
  Cal('init', 'book', { origin: 'https://app.cal.com' });
  Cal.ns.book('inline', { elementOrSelector: el, calLink: new URL(url, location.href).pathname.replace(/^\/+|\/+$/g, ''), config: { layout: layout, theme: 'light' } });
  Cal.ns.book('ui', { theme: 'light', hideEventTypeDetails: false, layout: layout, cssVarsPerTheme: { light: THEME }, styles: { branding: { brandColor: '#0a0a0a' } } });
  Cal.ns.book('on', { action: 'linkReady', callback: onReady });
}
