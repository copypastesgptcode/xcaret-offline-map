/* Xcaret Map service worker — precache everything for full offline use. */
const CACHE = 'xcaret-map-v16-find-walk';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/arte.js',
  'js/arte-walk.js',
  'css/arte.css',
  'data/arte-detail.geojson',
  'icons/arte-wordmark.png',
  'vendor/leaflet/leaflet.js',
  'vendor/leaflet/leaflet.css',
  'fonts/figtree-400.woff2',
  'fonts/figtree-500.woff2',
  'fonts/figtree-600.woff2',
  'fonts/figtree-700.woff2',
  'data/data.json',
  'data/basemap.geojson',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-180.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('xcaret-map-v') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // only our own assets

  // Keep the page and scripts on the same installed release during an update.
  const asset=req.mode==='navigate' ? new URL('index.html',self.registration.scope).href : req.url;
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const saved=await cache.match(asset);
    return saved || fetch(req);
  }));
});
