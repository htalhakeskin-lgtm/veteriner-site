/**
 * ═══════════════════════════════════════════════════════════════
 *  SERVICE WORKER
 * ═══════════════════════════════════════════════════════════════
 *
 * Amac: siteyi telefona eklenebilir yapmak ve baglanti koptugunda
 * anlamli bir sayfa gostermek. AGRESIF ONBELLEK YOK.
 *
 * Neden: randevu saatleri, bildirimler ve panel verileri surekli
 * degisiyor. Naif bir "cache-first" strateji, klinige bayat bir
 * takvim gosterir ve dolu bir saati bos sanmalarina yol acabilirdi.
 *
 * Strateji:
 *   /api/*        -> hic dokunma (her zaman agdan, onbelleklenmez)
 *   gezinme       -> once ag, calismazsa cevrimdisi sayfasi
 *   statik varlik -> once onbellek (hash'li dosyalar zaten degismez)
 */

const SURUM = 'vet-v1';
const STATIK = `${SURUM}-statik`;
const CEVRIMDISI = '/cevrimdisi.html';

const ON_YUKLE = ['/', CEVRIMDISI, '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIK)
      // addAll tek bir dosya bile inmezse tamamen basarisiz olur;
      // kurulumun bu yuzden patlamamasi icin tek tek ekliyoruz.
      .then((cache) => Promise.allSettled(ON_YUKLE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((adlar) =>
        Promise.all(
          adlar
            .filter((ad) => !ad.startsWith(SURUM))
            .map((ad) => caches.delete(ad)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const istek = event.request;

  // Yalnizca GET. POST/PATCH onbelleklenemez ve edilmemeli.
  if (istek.method !== 'GET') return;

  const url = new URL(istek.url);

  // Farkli bir sunucuya giden istekler (Unsplash, Google Fonts) bize ait degil.
  if (url.origin !== self.location.origin) return;

  // API kesinlikle onbelleklenmez: randevu musaitligi, bildirimler ve
  // panel verileri anlik olmali.
  if (url.pathname.startsWith('/api/')) return;

  // Sayfa gezintileri: once ag. Cevrimdisiysa anlamli bir sayfa goster.
  if (istek.mode === 'navigate') {
    event.respondWith(
      fetch(istek).catch(() =>
        caches.match(CEVRIMDISI).then((r) => r ?? Response.error()),
      ),
    );
    return;
  }

  // Statik varliklar: once onbellek, yoksa agdan alip sakla.
  event.respondWith(
    caches.match(istek).then((onbellekli) => {
      if (onbellekli) return onbellekli;
      return fetch(istek).then((yanit) => {
        // Yalnizca basarili ve ayni origin'li yanitlari sakla.
        if (yanit.ok && yanit.type === 'basic') {
          const kopya = yanit.clone();
          void caches.open(STATIK).then((c) => c.put(istek, kopya));
        }
        return yanit;
      });
    }),
  );
});
