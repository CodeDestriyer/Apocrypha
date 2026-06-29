// Minimal SW: required for PWA install prompt eligibility.
// Strategy: network-first for navigations (so users get fresh HTML referencing the
// latest hashed JS/CSS). Cached /index.html serves only as offline fallback.
// Never cache hashed JS/CSS chunks — they're immutable and content-addressed.

const CACHE = 'varkanis-shell-v3';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigations: network-first, fall back to cached shell when offline,
  // and refresh the cached shell on every successful fetch so the offline
  // fallback also moves forward over time.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
  }
});
