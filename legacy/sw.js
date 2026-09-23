/* Service Worker for Offline Caching */
const CACHE_NAME = 'vet-clinic-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/randevu.html',
  '/hizmetler.html',
  '/ekibimiz.html',
  '/hakkimizda.html',
  '/blog.html',
  '/iletisim.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/js/config.js',
  '/js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
