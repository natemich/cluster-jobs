// Cluster Jobs service worker.
// App shell: cache-first (so the icon opens instantly, and offline).
// status.json: network-first (always try for fresh data, fall back to last seen).
const SHELL = 'jobs-shell-v1';
const DATA = 'jobs-data-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.endsWith('status.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(r => { caches.open(DATA).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      caches.open(SHELL).then(c => c.put(e.request, r.clone()));
      return r;
    }))
  );
});
