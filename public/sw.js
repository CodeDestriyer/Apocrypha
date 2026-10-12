// App-shell SW: the installed PWA starts from cache instead of waiting on the
// network. The shell (index.html + the entry JS/CSS it references) is
// precached per build; a new deploy ships a new sw.js, which installs the new
// shell and main.jsx reloads onto it (controllerchange).

// __BUILD_ID__ is stamped with a unique id at build time (see vite.config.js),
// so every deploy ships a byte-different sw.js. That's what makes the installed
// PWA's update check pick up the new worker and refresh to the latest build.
const CACHE = 'varkanis-shell-__BUILD_ID__';
// Google Fonts URLs are versioned by Google, so this one survives deploys. The
// stylesheet <link> is crossorigin so its response isn't opaque and a failed
// fetch never gets cached.
const FONTS = 'varkanis-fonts';
const SHELL = ['/manifest.webmanifest', '/varkanis-logo-192.png', '/varkanis-logo-512.png'];

async function precache() {
  const c = await caches.open(CACHE);
  const res = await fetch('/index.html', { cache: 'no-cache' });
  if (!res.ok) throw new Error('index.html ' + res.status);
  const html = await res.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  await c.addAll([...SHELL, ...new Set(assets)]);
  // Last, so a cached index.html never points at assets that failed to cache.
  await c.put('/index.html', res);
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(req, cacheName) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const clone = res.clone();
    caches.open(cacheName).then((c) => c.put(req, clone)).catch(() => {});
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // The SPA lives at / (hash-routed). Other pages (privacy, tos…) and /api go
  // to the network untouched.
  if (req.mode === 'navigate') {
    if (url.pathname !== '/' && url.pathname !== '/index.html') return;
    e.respondWith(
      caches.match('/index.html').then((hit) => hit || fetch(req))
    );
    return;
  }

  // Hashed, immutable build output.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(req, CACHE));
  }
});
