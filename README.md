# 🐾 Veteriner Klinik Platformu

Veteriner kliniklerine satılabilen, **white-label** (her klinik için kişiselleştirilebilen)
randevu ve klinik yönetim platformu.

Tanıtım sitesi, online randevu sistemi, müşteri paneli ve tam kapsamlı yönetim paneli —
hepsi tek projede.

---

## 🌐 Canlı demo

**https://veteriner-site-web.vercel.app** — Vercel Hobby (ücretsiz) planda, örnek/tanıtım
amaçlı. Ticari kullanım değildir.

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Yönetici | `admin@demo.com` | `admin123` |
| Müşteri | `musteri@demo.com` | `123456` |

**Mimari:** iki ayrı Vercel projesi — `veteriner-site-web` (React Router SSR, bkz.
`apps/web/api/ssr.ts`) ve `veteriner-site-api` (NestJS, bkz. `apps/api/api/index.ts`).
Web projesi `/api/*` ve `/uploads/*` isteklerini `apps/web/vercel.json` üzerinden API
projesine proxy'ler — böylece tarayıcı tek bir origin görür ve çerezler (oturum) sorunsuz
çalışır. Veritabanı [Neon](https://neon.tech) (Vercel Marketplace entegrasyonu, ücretsiz plan).

### Yeniden yayınlama

```bash
cd apps/api && npx vercel deploy --prod --yes   # backend
cd apps/web && npx vercel deploy --prod --yes   # frontend
```

Her iki klasör de `vercel link` ile ilgili projeye bağlı (`.vercel/project.json`, git'te yok).
Bağlantı koptuysa: `npx vercel link --yes --project veteriner-site-api` (ve `-web`).

### Veritabanını sıfırlama

```bash
cd apps/api
npx vercel env pull .env.vercel.production --environment=production --yes
DB_URL=$(grep '^DATABASE_URL_UNPOOLED=' .env.vercel.production | sed -E 's/^DATABASE_URL_UNPOOLED=//; s/^"//; s/"$//')
DATABASE_URL="$DB_URL" npx prisma db seed
```

`DATABASE_URL_UNPOOLED` kullanılır (migration/seed gibi tek seferlik işler için); normal
istekler `DATABASE_URL`'in **pooled** (PgBouncer uyumlu) bağlantısını kullanır — serverless
fonksiyonların her soğuk başlangıçta yeni bağlantı açması yüzünden bu ayrım önemlidir.

### Bilinen sınırlar (bu dağıtıma özel)

| Konu | Durum |
|------|-------|
| Medya yükleme (`/panel` → görsel yükleme) | **Çalışmıyor.** Vercel serverless fonksiyonlarında dosya sistemi `/tmp` dışında salt okunur ve `/tmp` çağrılar arası paylaşılmaz. Kalıcı depolama için Vercel Blob/S3 gibi bir servis eklenmeli (kapsam dışı tutuldu) |
| Zamanlanmış görevler (`apps/api/src/jobs/reminders.job.ts`) | **Çalışmıyor.** `@nestjs/schedule`'ın cron kayıtları sürekli çalışan bir süreç gerektirir; serverless fonksiyon yalnızca istek anında ayağa kalkar. Vercel Cron Jobs ile değiştirilebilir (Hobby planda günde 1 çalıştırmayla sınırlı) |
| Ana sayfada ~4px yatay taşma (390px genişlikte) | Hero bölümündeki dekoratif arka plan efekti (`home.tsx`) yalnızca **üretim derlemesinde** oluşuyor, yerel geliştirmede yok. Görsel olarak fark edilmiyor, kaydırma çubuğu pratikte sürüklenemiyor |

---

## Hızlı başlangıç

**Gerekenler:** Node 20+, Docker Desktop

```bash
git clone <repo> && cd veteriner-site
npm install

cp apps/api/.env.example apps/api/.env   # sırları doldur (aşağıda)
npm run db:up                            # PostgreSQL + Adminer
npm run db:migrate                       # tabloları oluştur
npm run db:seed                          # demo verisi yükle
npm run dev                              # api :3000 + web :5173
```

Tarayıcıda **http://localhost:5173**

| Adres | Ne var |
|-------|--------|
| http://localhost:5173 | Site |
| http://localhost:5173/panel | Yönetim paneli |
| http://localhost:3000/api/docs | API dokümantasyonu (Swagger) |
| http://localhost:8080 | Veritabanı arayüzü (Adminer) |

### Demo hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Yönetici | `admin@demo.com` | `admin123` |
| Müşteri | `musteri@demo.com` | `123456` |

> Giriş sayfasında bu hesaplara tek tıkla dolduran kısayollar var.
> **Gerçek kuruluma geçerken bu bloğu `apps/web/app/routes/auth/login.tsx` içinden kaldırın.**

---

## Yeni bir kliniğe kurulum

Kod değiştirmenize gerek yok. Tek yapmanız gereken:

1. `npm run db:seed` ile demo veriyi yükleyin
2. **Yönetim paneli → Ayarlar**'dan klinik adı, telefon, adres, çalışma saatleri ve
   temayı girin
3. **Personel** sayfasından hekimleri ve çalışma takvimlerini ayarlayın
4. **Hizmetler** sayfasından verdiğiniz hizmetleri ve sürelerini düzenleyin

Bunların hepsi veritabanında tutulur ve tüm ziyaretçilere anında yansır.

> **Not:** Eski `legacy/` klasöründeki `config.js` yaklaşımı terk edildi. Artık klinik
> bilgileri kodda değil, veritabanındaki `SiteSetting` kaydında.

---

## Proje yapısı

```
veteriner-site/
├── apps/
│   ├── api/                    NestJS 11 + Prisma 6 + PostgreSQL 17
│   │   ├── prisma/
│   │   │   ├── schema.prisma   20 model
│   │   │   ├── migrations/
│   │   │   └── seed.ts         zengin demo verisi
│   │   └── src/
│   │       ├── common/         guard, filtre, dekoratör
│   │       ├── modules/        auth, users, pets, services, staff,
│   │       │                   availability, appointments, blog,
│   │       │                   testimonials, contact, notifications,
│   │       │                   media, dashboard, settings
│   │       └── jobs/           cron görevleri
│   └── web/                    Vite + React 19 + React Router v7
│       └── app/
│           ├── routes/
│           │   ├── _public/    tanıtım sayfaları (prerender edilir)
│           │   ├── randevu/    randevu sihirbazı
│           │   ├── auth/       giriş, kayıt, şifre
│           │   ├── hesap/      müşteri paneli
│           │   └── panel/      yönetim paneli
│           ├── components/     ui, layout, sections
│           └── lib/            api, auth, tema, biçimleme, SEO
├── legacy/                     eski prototip (referans, silinebilir)
├── tasarim-onizleme.html       onaylanan tasarımın tek dosyalık önizlemesi
├── proje-plani.md              ürün planı
├── backend-plani.md            mimari, veritabanı ve API planı
└── docker-compose.yml
```

---

## Komutlar

```bash
# Geliştirme
npm run dev              # api + web birlikte
npm run dev:api
npm run dev:web

# Veritabanı
npm run db:up            # Docker'da PostgreSQL başlat
npm run db:down          # durdur (veri korunur)
npm run db:migrate       # yeni migration uygula
npm run db:seed          # demo verisini yeniden yükle
npm run db:studio        # görsel veritabanı tarayıcısı

# Test
npm test                 # birim testleri (müsaitlik motoru)
npm run test:e2e         # uçtan uca API testleri

# Derleme
npm run build            # api derleme + web prerender
```

---

## Ortam değişkenleri

`apps/api/.env` — şablon: `apps/api/.env.example`

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantısı |
| `JWT_ACCESS_SECRET` | **En az 32 karakter.** Üretimde mutlaka yeni üretin |
| `JWT_REFRESH_SECRET` | Yukarıdakinden **farklı** olmalı |
| `WEB_ORIGIN` | Frontend adresi — CORS sadece buna izin verir |
| `COOKIE_SECURE` | HTTPS altında `true` yapın |
| `DEMO_MODE` | `true` iken e-posta/SMS/WhatsApp **gönderilmez** |
| `THROTTLE_ENABLED` | Hız sınırı. Sadece testlerde `false` |

Sır üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **`DEMO_MODE=true` bilinçli bir varsayılandır.** Kliniklere sunum yaparken
> yanlışlıkla gerçek mesaj gitmesini ve maliyet oluşmasını engeller. Mesajlar
> yine de veritabanına yazılır, böylece akış uçtan uca denenebilir.

---

## Mimari kararlar

Ayrıntılı gerekçeler `backend-plani.md` içinde. Özet:

**Randevu çakışma koruması — PostgreSQL exclusion constraint.**
İlk tasarımdaki `@@unique([staffId, startAt])` yetersizdi: yalnızca *aynı başlangıç
saatini* yakalıyordu. 09:00–10:30 arası bir cerrahi ile 09:30'daki muayene farklı
`startAt` taşıdığı için geçiyordu — ama hekim aynı anda iki yerde olamaz.
Yerine `btree_gist` + `tstzrange` ile çakışan **aralıkları** engelleyen bir kısıt
kullanılıyor. Aralık yarı açık (`[)`), böylece ardışık randevular birbirini engellemiyor.

**Zaman kolonları `timestamptz`.**
`timestamp without time zone` kullanılırken Prisma yerel bir `Date`'i UTC'ye çevirip
saat dilimi bilgisini atıyordu: seed yerel 09:00 yazdığında veritabanında 06:00
görünüyordu. Uygulama içinden tutarlı görünüyordu ama SQL raporları 3 saat kayıktı.

**Refresh token JWT değil.**
JWT kendi kendini doğrular, yani iptal edilemez — çıkış yapan kullanıcının token'ı
süresi dolana kadar geçerli kalırdı. Veritabanında tutulan opak token anında iptal
edilebiliyor ve her yenilemede döndürülüyor (rotation).

**Müsaitlik motoru saf fonksiyon.**
`availability.engine.ts` veritabanından tamamen bağımsız. Sistemin en çok kural içeren
parçası olduğu için veritabanı kurmadan test edilebiliyor — 25 birim testi var.

**Prerender (SSG) ile SEO.**
Tanıtım sayfaları build sırasında gerçek HTML'e dönüşüyor. Doğrulandı: ana sayfa
JavaScript çalışmadan 3.800+ karakter metin, `<title>`, meta description ve
`VeterinaryCare` JSON-LD içeriyor.

---

## Test durumu

```
Birim testleri :  25 geçiyor   (müsaitlik motoru)
E2E testleri   :  39 geçiyor   (auth, randevu, hız sınırı)
API yüzeyi     :  88 işlem
```

E2E testleri **ayrı bir veritabanında** (`vetclinic_test`) çalışır; geliştirme
verisi korunur.

---

## Bilinen eksikler

| Konu | Durum |
|------|-------|
| Demo görselleri | Unsplash'ten çekiliyor, **internet gerektirir**. Gerçek kurulumda kliniğin kendi fotoğrafları panelden yüklenmeli |
| E-posta / SMS / WhatsApp | Altyapı hazır (`NotificationChannel`), sağlayıcı bağlanmadı. `DEMO_MODE=false` yapıp `EmailChannel` eklenmeli |
| Google Yorumları | Kod hazır; `GOOGLE_PLACES_API_KEY` ve panelden `googlePlaceId` girilmeli |
| Online ödeme | Kapsam dışı |
| Çoklu dil | Kapsam dışı; şema çeviri tablosuna hazır |
| `npm audit` | 3 yüksek uyarı var: Prisma **CLI**'ının `deepmerge-ts` bağımlılığı. Dev-only, üretime çıkmıyor. Kararlı bir sürümde henüz düzeltilmedi |

---

## Dağıtım

**Frontend** — build çıktısı statik:

```bash
npm run build -w @vet/web      # apps/web/build/client
```

Netlify, Cloudflare Pages, Vercel veya herhangi bir statik hosting.

**Backend + veritabanı** — Docker:

```bash
npm run build -w @vet/api
NODE_ENV=production node apps/api/dist/main.js
```

Railway, Render, Fly.io veya Docker çalıştıran bir VPS.

Üretime geçmeden önce:

- [ ] `JWT_ACCESS_SECRET` ve `JWT_REFRESH_SECRET` yeniden üretildi
- [ ] `COOKIE_SECURE=true` (HTTPS zorunlu)
- [ ] `WEB_ORIGIN` gerçek alan adına ayarlandı
- [ ] `DEMO_MODE=false` ve e-posta/SMS sağlayıcısı bağlandı
- [ ] Giriş sayfasındaki demo hesap kısayolları kaldırıldı
- [ ] `admin@demo.com` şifresi değiştirildi veya hesap silindi
- [ ] `lib/seo.ts` içindeki `SITE_URL` gerçek alan adına ayarlandı
- [ ] Veritabanı yedekleme planı kuruldu
