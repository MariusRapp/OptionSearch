// Service Worker für OptionSearch — aus kit/sw-template.js (Dashboard-Kit 1.0.0).
//
// Nur die App-Hülle (index.html, Manifest, Icons) öffnet offline; Daten kommen NIE aus dem Cache:
//   gleiche Herkunft, im Scope dieser App ..... Netz zuerst, die Kopie nur ohne Netz
//   Datenpfade (BYPASS), ?key=…, Range-Requests ... nur Netz, nie gecacht (lizenzierte Daten!)
//   versionierte CDN-Dateien (jsdelivr …) ...... Cache zuerst (URL trägt die Version)
//   alles andere fremd (Worker, Hugging Face, localhost:8137, KI) ... nur Netz, nicht abgefangen
//
// Mehrere Apps teilen sich die Herkunft mariusrapp.github.io: nur Caches mit dem eigenen
// Präfix "kit-optionsearch-" anfassen, nie fremde löschen.

const APP = 'optionsearch';
const VERSION = '2026-11-19.1';    // bei jeder Änderung der Hülle erhöhen
const PREFIX = `kit-${APP}-`;
const CACHE = PREFIX + VERSION;

// relativ zu dieser Datei; ein fehlender Eintrag bricht die Installation nicht ab
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

// Pfade gleicher Herkunft, die immer frisch vom Netz kommen (serve_local.py liefert Daten unter /data/)
const BYPASS = [/\/data\//, /\/opt\//, /\/ai(\/|$)/, /\.json$/i, /\.parquet$/i, /\.duckdb$/i, /\.csv$/i];

const CDN = new Set(['unpkg.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com']);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (CDN.has(url.hostname)) event.respondWith(cacheFirst(req));
    return;
  }
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;   // andere App auf dieser Herkunft
  if (url.pathname.endsWith('/sw.js') || url.searchParams.has('key') || BYPASS.some(re => re.test(url.pathname))) return;
  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./');
      if (shell) return shell;
    }
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}
