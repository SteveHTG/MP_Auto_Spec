const CACHE_NAME = 'mp-spec-matcher-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache the live catalog/crosswalk data -- the whole point of
  // fetching it from GitHub at runtime is that it always reflects
  // whatever's currently committed to MP_GEAR_BUILDER. Let these go
  // straight to the network every time.
  if (url.includes('raw.githubusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App shell: cache-first so the tool still loads (minus live catalog
  // data) when offline or on a flaky connection.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
