/* Statische PWA-Caches; keine Spielstände und keine Nutzerdaten auf dem Server. */
const CACHE = 'uff-static-v2-controls-1';
const SHELL = ['./', './index.html', './game.js', './manifest.webmanifest', './icon.svg'];
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const ALLOWED_CDN = new Set(['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com']);
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'PREFETCH_THREE') return;
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(THREE_URL); if (cached) return;
    try { const response = await fetch(THREE_URL, { mode: 'no-cors' }); await cache.put(THREE_URL, response); } catch (e) { /* offline prefetch optional */ }
  }));
});
self.addEventListener('fetch', (event) => {
  const request = event.request; if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !ALLOWED_CDN.has(url.hostname)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok || response.type === 'opaque') { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {}); }
    return response;
  })));
});
