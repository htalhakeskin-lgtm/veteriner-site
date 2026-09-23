# 🔧 Veteriner Klinik Platformu — Backend Planı

> Bu doküman `proje-plani.md`'nin devamıdır. O doküman **frontend'i ve görsel tasarımı**,
> bu doküman **backend mimarisini, veritabanını ve API sözleşmesini** tanımlar.
>
> **Durum:** Planlama tamamlandı — uygulama bekleniyor
> **Son güncelleme:** 23.09.2026

---

## 1. Mevcut Durum Analizi

Proje şu anda **tamamen frontend** bir prototip. Tespit edilenler:

| Konu | Mevcut Durum | Sorun |
|------|--------------|-------|
| Veri saklama | `localStorage` (`vet_users`, `vet_pets`, `vet_appointments`, `vet_healthRecords`) | Tarayıcı temizlenince her şey gider. Cihazlar arası senkron yok. |
| Kimlik doğrulama | `js/auth.js` — düz metin şifre karşılaştırma | Şifreler açık metin. Oturum = `localStorage`'da JSON. Güvenlik yok. |
| Konfigürasyon | `js/config.js` (590 satır global `SITE_CONFIG`) | Admin panelinden değiştirilemez; her değişiklik kod düzenlemesi ister. |
| Randevu çakışması | Kontrol yok | İki kişi aynı saate randevu alabilir. |
| Admin paneli | `panel/index.html`, `panel/musteriler.html` (2/8 sayfa) | 6 sayfa hiç yazılmamış, CRUD yok. |
| Görseller | `assets/` klasörü **hiç yok** | Tüm `assets/images/...` yolları kırık. |
| İçerik yönetimi | Yok | Blog, hizmet, personel kod içinde gömülü. |

**Sonuç:** Backend sadece "veri saklama" değil, aynı zamanda `config.js`'i ve admin panelini gerçekten işlevsel kılan katman olacak.

---

## 2. Alınan Teknoloji Kararları

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| **Backend framework** | **NestJS 11** (Node 24, TypeScript) | Modüler mimari, DI, guard/interceptor/pipe yapısı. Admin paneli gibi çok rollü, çok endpoint'li bir sistemde dosya karmaşasını baştan engeller. Swagger entegrasyonu hazır gelir. |
| **ORM** | **Prisma 6** | Tip güvenli sorgular, otomatik migration, `prisma studio` ile görsel veritabanı tarayıcısı — demo sırasında veriyi göstermek için ideal. |
| **Veritabanı** | **PostgreSQL 17** (Docker Compose ile) | Geçici/lokal ihtiyacı Docker karşılıyor (`docker compose up -d`). Ürüne geçerken aynı şema Neon / Railway / Supabase üzerinde sıfır kod değişikliğiyle çalışır. |
| **Mimari** | **Tek kiracılı (single-tenant)** | Her klinik = ayrı kurulum + ayrı veritabanı. Kod çok daha sade; `clinicId` taşıma yükü yok. Klinik bilgileri `SiteSetting` tablosunda tek satırda tutulur. |
| **Frontend** | **Vite + React 19 + TypeScript + React Router v7 (framework mode)** | Aşağıda gerekçesi var. |
| **Stil** | **Tailwind CSS v4 + CSS custom properties** | Tema renkleri CSS değişkeni olarak tanımlanır → tema değiştirici runtime'da çalışır, yeniden build gerekmez. |
| **Animasyon** | **Motion (framer-motion) + Lenis** | Lenis = yumuşak, momentum'lu scroll. Motion = scroll ile tetiklenen yumuşak geçişler. |

### 2.1. Frontend kararının gerekçesi (SEO + Vite/React)

Senin tercihin **Vite + React**, ama aynı zamanda **SEO görünürlüğü** istiyorsun. Klasik Vite SPA'da
sunucu boş bir `<div id="root">` döner; arama motoru botları içeriği göremez ve klinik sitesi
Google'da görünmez. Bu iki isteği birlikte karşılayan çözüm:

> **Vite + React Router v7 "framework mode" + prerender (SSG)**

- Altında **Vite** çalışır — senin istediğin geliştirme deneyimi birebir aynı (HMR, hızlı build).
- **Tanıtım sayfaları** (ana sayfa, hizmetler, hizmet detay, ekibimiz, hakkımızda, blog, blog detay,
  iletişim, KVKK) build sırasında **gerçek HTML dosyalarına** prerender edilir → Google tam içeriği
  görür, ilk açılış anında boyanır (LCP düşer).
- **Uygulama sayfaları** (randevu sihirbazı, müşteri paneli, admin paneli) normal SPA olarak çalışır —
  zaten SEO'ya ihtiyaçları yok, `noindex` verilir.
- Next.js'e göre avantajı: çıktı **statik dosya**; herhangi bir hosting'e (Netlify, Vercel, Cloudflare
  Pages, hatta cPanel) atılabilir. Kliniğe "sitenizi şu klasöre atın" demek yeterli.

**Ek SEO kalemleri:** her sayfaya `<title>` / `<meta description>` / Open Graph, `LocalBusiness` +
`VeterinaryCare` JSON-LD şeması, otomatik `sitemap.xml` + `robots.txt`, canonical URL'ler,
semantik HTML ve görsel `alt` metinleri.

---

## 3. Klasör Yapısı

Proje **monorepo** haline gelir (npm workspaces). Mevcut kök dizindeki HTML/CSS/JS dosyaları
`legacy/` altına taşınır — referans olarak kalır, yeni arayüz bitince silinir.

```
veteriner-site/
├── apps/
│   ├── api/                          ← NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts               ← Bootstrap, CORS, helmet, Swagger
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/       ← @Roles, @CurrentUser, @Public
│   │   │   │   ├── guards/           ← JwtAuthGuard, RolesGuard
│   │   │   │   ├── filters/          ← HttpExceptionFilter (tek tip hata formatı)
│   │   │   │   ├── interceptors/     ← LoggingInterceptor, TransformInterceptor
│   │   │   │   ├── pipes/            ← ZodValidationPipe
│   │   │   │   └── dto/              ← PaginationDto, ortak DTO'lar
│   │   │   ├── config/               ← @nestjs/config + zod ile .env doğrulama
│   │   │   ├── prisma/               ← PrismaService (global modül)
│   │   │   ├── modules/
│   │   │   │   ├── auth/             ← register, login, refresh, forgot/reset password
│   │   │   │   ├── users/            ← profil, şifre değiştirme, admin müşteri listesi
│   │   │   │   ├── pets/             ← evcil hayvan CRUD
│   │   │   │   ├── medical-records/  ← aşı + tedavi geçmişi
│   │   │   │   ├── services/         ← hizmet CRUD
│   │   │   │   ├── staff/            ← personel CRUD + çalışma takvimi + izinler
│   │   │   │   ├── availability/     ← ⭐ müsait slot hesaplama motoru
│   │   │   │   ├── appointments/     ← randevu oluştur / onayla / iptal / ertele
│   │   │   │   ├── blog/             ← yazı + kategori CRUD
│   │   │   │   ├── testimonials/     ← yorum + moderasyon
│   │   │   │   ├── contact/          ← iletişim formu mesajları
│   │   │   │   ├── newsletter/       ← e-bülten aboneleri
│   │   │   │   ├── notifications/    ← kullanıcı bildirimleri
│   │   │   │   ├── settings/         ← ⭐ config.js'in veritabanı karşılığı
│   │   │   │   ├── media/            ← görsel yükleme
│   │   │   │   ├── dashboard/        ← admin istatistikleri
│   │   │   │   └── health/           ← /health (uptime kontrolü)
│   │   │   └── jobs/                 ← cron: randevu hatırlatma, aşı hatırlatma
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts               ← config.js + mock-data.js → veritabanı
│   │   ├── test/                     ← e2e testleri (supertest)
│   │   ├── uploads/                  ← yerel dosya depolama (gitignore)
│   │   └── .env.example
│   │
│   └── web/                          ← Vite + React frontend
│       ├── app/
│       │   ├── root.tsx
│       │   ├── routes.ts             ← rota tanımları + prerender listesi
│       │   ├── routes/
│       │   │   ├── _public/          ← prerender edilen tanıtım sayfaları
│       │   │   ├── randevu/          ← randevu sihirbazı (SPA)
│       │   │   ├── hesap/            ← müşteri paneli (SPA, korumalı)
│       │   │   └── panel/            ← admin paneli (SPA, korumalı)
│       │   ├── components/
│       │   │   ├── ui/               ← Button, Card, Input, Dialog, Toast...
│       │   │   ├── layout/           ← Header, Footer, Sidebar, FAB
│       │   │   └── sections/         ← Hero, Services, Team, Testimonials...
│       │   ├── lib/
│       │   │   ├── api.ts            ← tip güvenli API istemcisi
│       │   │   ├── auth.tsx          ← oturum context'i
│       │   │   ├── theme.tsx         ← tema presetleri + değiştirici
│       │   │   └── seo.tsx           ← meta etiketleri + JSON-LD
│       │   └── styles/
│       │       ├── app.css           ← Tailwind v4 + tasarım token'ları
│       │       └── themes.css        ← tema presetleri (CSS değişkenleri)
│       ├── public/                   ← robots.txt, manifest.json, görseller
│       └── vite.config.ts
│
├── packages/
│   └── shared/                       ← API tipleri + zod şemaları (iki taraf da kullanır)
│
├── docker-compose.yml                ← postgres + (opsiyonel) adminer
├── package.json                      ← npm workspaces
├── proje-plani.md
├── backend-plani.md                  ← bu dosya
└── README.md
```

---

## 4. Veritabanı Şeması

Aşağıdaki şema mevcut `mock-data.js` ve `config.js` yapılarıyla **uyumlu** tasarlandı; göç sırasında
veri kaybı olmaz. Tüm `id` alanları `cuid()`.

### 4.1. Enum'lar

```prisma
enum Role              { CUSTOMER  STAFF  ADMIN }
enum Species           { CAT  DOG  BIRD  RODENT  REPTILE  FISH  OTHER }
enum Gender            { MALE  FEMALE  UNKNOWN }
enum AppointmentStatus { PENDING  CONFIRMED  COMPLETED  CANCELLED  NO_SHOW }
enum RecordType        { EXAMINATION  VACCINATION  SURGERY  LAB_TEST  TREATMENT  OTHER }
enum PostStatus        { DRAFT  PUBLISHED  ARCHIVED }
enum NotificationType  { APPOINTMENT_CREATED  APPOINTMENT_CONFIRMED  APPOINTMENT_CANCELLED
                         APPOINTMENT_REMINDER  VACCINATION_DUE  SYSTEM }
```

### 4.2. Tablolar

| Tablo | Amaç | Öne çıkan alanlar |
|-------|------|-------------------|
| `User` | Müşteri / personel / admin hesapları | `email` (unique), `passwordHash`, `fullName`, `phone`, `role`, `isActive`, `lastLoginAt`, `deletedAt` |
| `RefreshToken` | Oturum yenileme | `tokenHash`, `userId`, `expiresAt`, `revokedAt`, `userAgent`, `ipAddress` |
| `PasswordResetToken` | Şifre sıfırlama | `tokenHash`, `userId`, `expiresAt`, `usedAt` |
| `Pet` | Evcil hayvanlar | `ownerId`, `name`, `species`, `breed`, `birthDate`, `gender`, `weightKg`, `color`, `isNeutered`, `microchipNo`, `photoUrl` |
| `MedicalRecord` | Aşı + tedavi geçmişi | `petId`, `appointmentId?`, `staffId?`, `type`, `title`, `description`, `performedAt`, `nextDueAt`, `attachments[]` |
| `Service` | Klinik hizmetleri | `slug` (unique), `title`, `shortDesc`, `longDesc`, `icon`, `category`, `price?`, `durationMinutes`, `isFeatured`, `isActive`, `sortOrder` |
| `StaffMember` | Veteriner hekim / personel | `userId?`, `slug` (unique), `fullName`, `title`, `speciality`, `experienceYears`, `bio`, `education`, `photoUrl`, `isActive`, `sortOrder` |
| `StaffSchedule` | Haftalık çalışma saatleri | `staffId`, `dayOfWeek` (0–6), `startTime`, `endTime` |
| `StaffTimeOff` | İzin / tatil | `staffId`, `startAt`, `endAt`, `reason` |
| `ClinicHoliday` | Resmî tatiller | `date` (unique), `label` |
| `Appointment` | Randevular | `code` (unique, `RND-2026-0042`), `userId?`, `petId?`, misafir alanları, `serviceId`, `staffId?`, `startAt`, `endAt`, `status`, `notes`, `cancelReason`, `cancelledAt`, `reminderSentAt` |
| `BlogCategory` | Blog kategorileri | `slug` (unique), `name`, `icon`, `sortOrder` |
| `BlogPost` | Blog yazıları | `slug` (unique), `title`, `excerpt`, `contentHtml`, `coverImageUrl`, `categoryId`, `authorId?`, `status`, `publishedAt`, `readMinutes`, `viewCount`, `metaTitle`, `metaDescription` |
| `Testimonial` | Müşteri yorumları | `authorName`, `petName`, `petSpecies`, `rating` (1–5), `text`, `isApproved`, `displayDate`, `sortOrder` |
| `ContactMessage` | İletişim formu | `name`, `email`, `phone`, `subject`, `message`, `isRead`, `repliedAt` |
| `NewsletterSubscriber` | E-bülten | `email` (unique), `isActive`, `unsubscribeToken`, `subscribedAt` |
| `Notification` | Kullanıcı bildirimleri | `userId`, `type`, `title`, `message`, `linkUrl?`, `isRead`, `readAt` |
| `SiteSetting` | ⭐ `config.js`'in yerini alır | Tek satır (`id = "singleton"`), JSON kolonlar: `clinic`, `contact`, `workingHours`, `theme`, `features`, `appointmentRules`, `seo`, `socialLinks` |
| `MediaAsset` | Yüklenen dosyalar | `filename`, `url`, `mimeType`, `sizeBytes`, `width?`, `height?`, `uploadedById` |
| `AuditLog` | Admin işlem kaydı | `actorId`, `action`, `entity`, `entityId`, `metadata` (JSON), `ipAddress` |

### 4.3. Kritik kısıtlar ve indeksler

```prisma
@@index([startAt, status])            // takvim sorguları
@@index([userId, startAt])            // "randevularım"
@@index([status, publishedAt])        // yayınlanmış blog listesi
@@index([ownerId])                    // "hayvanlarım"
@@index([petId, performedAt])         // sağlık kartı zaman çizelgesi
```

> **Çifte rezervasyon koruması — Faz 1'de düzeltildi.**
>
> İlk tasarım `@@unique([staffId, startAt])` şeklinde bir partial unique index öngörüyordu.
> Uygulamada bunun **yetersiz** olduğu görüldü: index yalnızca *aynı `startAt`* değerini
> yakalıyor. 09:00–10:30 arası 90 dakikalık bir cerrahi ile 09:30'daki 30 dakikalık
> muayenenin `startAt` değerleri farklı olduğu için index bunları geçiriyordu — ama bir
> hekim aynı anda iki yerde olamaz. Seed verisinde 4 adet fiziksel olarak imkânsız randevu
> çifti bu şekilde oluştu.
>
> Yerine PostgreSQL **exclusion constraint** kullanılıyor (`btree_gist` eklentisiyle):
>
> ```sql
> ALTER TABLE "Appointment"
>   ADD CONSTRAINT "Appointment_no_overlap"
>   EXCLUDE USING gist (
>     "staffId" WITH =,
>     tsrange("startAt", "endAt", '[)') WITH &&
>   )
>   WHERE ("status" IN ('PENDING','CONFIRMED','COMPLETED') AND "staffId" IS NOT NULL);
> ```
>
> - Aralık **`'[)'` yarı açık**: 09:00–09:30 ile 09:30–10:00 çakışmaz, yani ardışık
>   randevular birbirini engellemez. Kapalı aralık kullanılsaydı takvim yarı yarıya dolardı.
> - `CANCELLED` ve `NO_SHOW` kapsam dışı — iptal edilen saat yeniden satılabilir.
> - `COMPLETED` kapsam içinde: geçmişte de olsa hekim o saatte doluydu.
> - Bu kısıt eski partial unique index'in işini de kapsadığı için o kaldırıldı
>   (migration `20260923010000_appointment_overlap_guard`).
>
> **Servis katmanı için not:** ihlal durumunda Postgres `23P01 exclusion_violation`
> döndürür — unique ihlalindeki Prisma `P2002` değil. Randevu oluşturma servisi bu kodu
> yakalayıp `409 SLOT_TAKEN` çevirmelidir.

### 4.4. `SiteSetting` — `config.js`'ten veritabanına geçiş

`config.js`'in tüm içeriği tek satırda JSON kolonlara taşınır. Böylece **admin paneli → Ayarlar**
sayfasından klinik adı, telefon, çalışma saatleri, tema ve özellik anahtarları kod dokunmadan değişir.
Frontend açılışta `GET /api/v1/settings` ile bunu çeker.

```jsonc
{
  "clinic":  { "name", "slogan", "description", "foundedYear", "totalPatients",
               "experienceYears", "satisfactionRate", "logoUrl" },
  "contact": { "phone", "phoneRaw", "whatsapp", "whatsappMessage", "email", "address": { } },
  "workingHours": { "weekdays", "saturday", "sunday", "emergency", "emergencyPhone" },
  "theme":   { "activePreset", "customColors" },
  "features":{ "showEmergencyBanner", "showInstagramFeed", "showBlogSection",
               "showLiveStats", "showTestimonials", "enableOnlineBooking", "enableRegistration" },
  "appointmentRules": { "slotDurationMinutes", "leadTimeHours", "daysInAdvance",
                        "cancelBeforeHours", "autoConfirm", "maxDailySlots" },
  "seo":     { "metaTitle", "metaDescription", "ogImageUrl", "googleMapsEmbedUrl" },
  "socialLinks": { "instagram", "facebook", "twitter", "youtube" }
}
```

---

## 5. API Sözleşmesi

Taban yol: `/api/v1`. Tüm yanıtlar JSON. Hatalar tek tip:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Seçtiğiniz saat az önce doldu. Lütfen başka bir saat seçin.",
  "code": "SLOT_TAKEN",
  "timestamp": "2026-09-23T10:00:00.000Z",
  "path": "/api/v1/appointments"
}
```

### 5.1. Kimlik doğrulama — `/auth`

| Method | Yol | Erişim | Açıklama |
|--------|-----|--------|----------|
| POST | `/auth/register` | Herkes | Kayıt. Şifre **argon2id** ile hash'lenir. |
| POST | `/auth/login` | Herkes | Access token (JWT, 15 dk) + refresh token (**httpOnly cookie**, 7 gün) |
| POST | `/auth/refresh` | Cookie | Access token yeniler (token rotation) |
| POST | `/auth/logout` | Oturum | Refresh token iptal edilir |
| GET | `/auth/me` | Oturum | Aktif kullanıcı + rolü |
| POST | `/auth/forgot-password` | Herkes | Sıfırlama e-postası (kullanıcının var olup olmadığı sızdırılmaz) |
| POST | `/auth/reset-password` | Token | Yeni şifre + tüm oturumları kapat |

**Güvenlik notları:** Şifre = argon2id. Login'e **rate limit** (IP başına 5 deneme / 15 dk).
Access token bellekte tutulur (`localStorage`'da değil — XSS riski), refresh token httpOnly +
`SameSite=Lax` cookie.

### 5.2. Herkese açık uçlar

| Method | Yol | Açıklama |
|--------|-----|----------|
| GET | `/settings` | Site ayarlarının **herkese açık** alt kümesi (hassas alanlar filtrelenir) |
| GET | `/services` | `?category=&featured=` |
| GET | `/services/:slug` | Hizmet detayı |
| GET | `/staff` | Aktif personel listesi |
| GET | `/staff/:slug` | Hekim detayı |
| GET | `/testimonials` | Sadece onaylı yorumlar |
| GET | `/blog/posts` | `?category=&page=&limit=&q=` — sadece `PUBLISHED` |
| GET | `/blog/posts/:slug` | Yazı detayı (+ `viewCount` artırılır) |
| GET | `/blog/categories` | Kategori listesi (yazı sayılarıyla) |
| GET | `/availability` | ⭐ `?serviceId=&staffId=&from=&to=` → müsait slot'lar |
| POST | `/appointments` | Randevu oluştur (**misafir de alabilir**) |
| GET | `/appointments/lookup` | `?code=&phone=` — üye olmayan randevusunu sorgular |
| POST | `/contact` | İletişim formu (rate limit + honeypot) |
| POST | `/newsletter/subscribe` | E-bülten aboneliği |
| GET | `/newsletter/unsubscribe/:token` | Abonelikten çık |
| GET | `/health` | Uptime + veritabanı bağlantı kontrolü |

### 5.3. Müşteri uçları (rol: `CUSTOMER`)

| Method | Yol | Açıklama |
|--------|-----|----------|
| GET / PATCH | `/users/me` | Profil görüntüle / güncelle |
| PATCH | `/users/me/password` | Şifre değiştir (eski şifre doğrulamalı) |
| GET / POST | `/pets` | Hayvanlarım / yeni ekle |
| GET / PATCH / DELETE | `/pets/:id` | Detay / güncelle / sil (sahiplik kontrolü) |
| GET | `/pets/:id/medical-records` | Sağlık kartı (aşılar + tedaviler) |
| GET | `/pets/:id/vaccination-schedule` | Yaklaşan aşılar |
| GET | `/appointments/me` | `?status=&upcoming=` |
| PATCH | `/appointments/:id/cancel` | İptal (kural: `cancelBeforeHours` öncesine kadar) |
| PATCH | `/appointments/:id/reschedule` | Tarih / saat değiştir |
| GET | `/notifications` | Bildirimlerim |
| PATCH | `/notifications/:id/read` | Okundu işaretle |
| PATCH | `/notifications/read-all` | Hepsini okundu işaretle |

### 5.4. Admin uçları (rol: `ADMIN`) — `/admin`

| Method | Yol | Açıklama |
|--------|-----|----------|
| GET | `/admin/dashboard` | Bugünkü / haftalık randevu, müşteri, hasta sayıları + grafik verisi |
| GET | `/admin/appointments` | `?date=&from=&to=&status=&staffId=&q=` (takvim + liste görünümü) |
| POST | `/admin/appointments` | Telefonla gelen randevuyu elle gir |
| PATCH | `/admin/appointments/:id/status` | Onayla / tamamla / iptal et / gelmedi |
| GET | `/admin/customers` | `?q=&page=` — müşteri listesi + hayvan/randevu sayıları |
| GET | `/admin/customers/:id` | Müşteri 360° görünümü |
| GET / POST / PATCH / DELETE | `/admin/pets` | Hasta kayıtları |
| POST / PATCH / DELETE | `/admin/medical-records` | Aşı & tedavi kaydı gir |
| GET / POST / PATCH / DELETE | `/admin/services` | Hizmet CRUD + `PATCH /reorder` |
| GET / POST / PATCH / DELETE | `/admin/staff` | Personel CRUD |
| PUT | `/admin/staff/:id/schedule` | Haftalık çalışma takvimi |
| POST / DELETE | `/admin/staff/:id/time-off` | İzin ekle / sil |
| GET / POST / PATCH / DELETE | `/admin/blog/posts` | Blog CRUD (taslak / yayınla) |
| GET / POST / PATCH / DELETE | `/admin/blog/categories` | Kategori CRUD |
| GET / PATCH / DELETE | `/admin/testimonials` | Yorum onayla / gizle / sil |
| GET / PATCH / DELETE | `/admin/contact-messages` | Mesajları oku / işaretle |
| GET | `/admin/newsletter` | Abone listesi + CSV dışa aktarma |
| GET / PATCH | `/admin/settings` | ⭐ Tüm site ayarları (klinik bilgisi, tema, özellikler) |
| POST / DELETE | `/admin/media` | Görsel yükle / sil |
| GET / POST / DELETE | `/admin/holidays` | Tatil günleri |
| GET | `/admin/audit-logs` | Kim, ne zaman, neyi değiştirdi |

---

## 6. Müsaitlik Motoru (`availability`)

Sistemin **en kritik iş mantığı**. Randevu sihirbazının 3. adımını besler.

**Girdi:** `serviceId`, `staffId?` (boşsa "farketmez"), `from`, `to` (tarih aralığı)

**Algoritma:**

1. `Service.durationMinutes` okunur (örn. Genel Muayene = 30 dk, Cerrahi = 90 dk).
2. `staffId` verilmişse o hekim; verilmemişse hizmeti verebilen **tüm aktif hekimler** alınır.
3. Her gün için:
   - `ClinicHoliday`'de mi? → gün kapalı.
   - `StaffSchedule`'dan o günün `dayOfWeek` çalışma aralıkları alınır. Yoksa → gün kapalı.
   - `StaffTimeOff` ile kesişen aralıklar çıkarılır.
   - Çalışma aralığı `slotDurationMinutes` adımlarıyla dilimlere bölünür.
   - Mevcut `PENDING` / `CONFIRMED` randevularla **çakışan** dilimler elenir
     (çakışma testi: `newStart < existingEnd && newEnd > existingStart`).
   - `leadTimeHours`'tan yakın dilimler elenir (örn. 2 saatten yakın randevu alınamaz).
   - `maxDailySlots` dolduysa gün kapatılır.
4. Çıktı: gün gün, saat saat müsaitlik.

```jsonc
// GET /api/v1/availability?serviceId=...&from=2026-09-25&to=2026-10-01
{
  "serviceId": "...",
  "durationMinutes": 30,
  "days": [
    {
      "date": "2026-09-25",
      "isOpen": true,
      "slots": [
        { "time": "09:00", "available": true,  "staffId": "stf_1", "staffName": "Dr. Ahmet Yılmaz" },
        { "time": "09:30", "available": false, "reason": "BOOKED" },
        { "time": "10:00", "available": true,  "staffId": "stf_2", "staffName": "Dr. Elif Kaya" }
      ]
    },
    { "date": "2026-09-27", "isOpen": false, "reason": "CLOSED_SUNDAY", "slots": [] }
  ]
}
```

**Çifte rezervasyon koruması (iki katman):**

1. `POST /appointments` içinde **Prisma transaction** + satır kilidi ile slot kilitlenir.
2. Yarış durumu kalırsa veritabanındaki **`Appointment_no_overlap` exclusion constraint**
   devreye girer → Postgres `23P01` hatası yakalanır → kullanıcıya `409 SLOT_TAKEN` döner
   ("Bu saat az önce doldu, lütfen başka bir saat seçin"). Bkz. §4.3.

> **Dikkat — müsaitlik motoru ile kısıtın kapsamı farklı.** Kısıt yalnızca `staffId`
> dolu olan randevuları korur. Müşteri "farketmez" seçtiğinde randevu kaydedilmeden
> **önce** somut bir hekime atanmalıdır; aksi halde iki "farketmez" talebi aynı saate
> düşebilir ve kısıt bunu yakalayamaz (`staffId IS NULL` kapsam dışı).

---

## 7. Güvenlik Önlemleri

| Katman | Önlem |
|--------|-------|
| Şifre | **argon2id** hash (bcrypt değil) |
| Token | Access JWT 15 dk (bellekte) + refresh httpOnly cookie 7 gün + rotation |
| Yetki | `JwtAuthGuard` global, `@Public()` ile istisna; `RolesGuard` + `@Roles(Role.ADMIN)` |
| Sahiplik | Her `/pets/:id`, `/appointments/:id` çağrısında `ownerId === currentUser.id` kontrolü |
| Doğrulama | **DTO'lar:** `class-validator` + global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` → DTO dışı alan reddedilir). **Ortam değişkenleri:** `zod`. *(Faz 0'da düzeltildi: zod, NestJS'in `ValidationPipe`'ı ile çalışmıyor; ayrıca `@nestjs/swagger` istek şemalarını `class-validator` dekoratörlerinden otomatik üretiyor.)* |
| Rate limit | `@nestjs/throttler`: genel 100 istek/dk; `/auth/login` 5/15 dk; `/contact` 3/saat |
| HTTP header | `helmet` + katı CSP |
| CORS | Sadece `WEB_ORIGIN` env değişkenindeki origin |
| Dosya yükleme | MIME **ve** magic-byte kontrolü, max 5 MB, `sharp` ile yeniden kodlama + WebP'ye çevirme |
| SQL Injection | Prisma parametreli sorgular (ham SQL yok) |
| XSS | Blog `contentHtml` kaydedilirken `sanitize-html` ile temizlenir |
| Loglama | `pino` — şifre / token alanları maskelenir |
| KVKK | `deletedAt` ile yumuşak silme, `GET /users/me/export` ile veri dışa aktarma, `DELETE /users/me` ile hesap silme |
| Sırlar | `.env` asla commit edilmez; `.env.example` şablon olarak durur |

---

## 8. Bildirimler ve Zamanlanmış Görevler

`@nestjs/schedule` ile cron görevleri. **Demo modunda** e-posta/SMS gerçekten gönderilmez;
sadece veritabanındaki `Notification` tablosuna yazılır ve panelde görünür — böylece demo sırasında
bir şey "patlamaz" ve maliyet oluşmaz.

| Görev | Sıklık | İş |
|-------|--------|-----|
| Randevu hatırlatma | Saatlik | 24 saat sonraki randevular için bildirim + (açıksa) e-posta |
| Aşı hatırlatma | Günlük 09:00 | `nextDueAt` 7 gün içinde olan aşılar için sahibine bildirim |
| Geçmiş randevu temizliği | Günlük | Tarihi geçmiş `PENDING` randevular → `NO_SHOW` |
| Token temizliği | Günlük | Süresi dolmuş refresh / reset token'ları sil |

**Sağlayıcı soyutlaması:** `NotificationChannel` arayüzü arkasında üç uygulama:
`DatabaseChannel` (her zaman aktif), `EmailChannel` (Resend / Nodemailer — env ile açılır),
`SmsChannel` (NetGSM / İletimerkezi — env ile açılır). Sağlayıcı değişse bile iş mantığı değişmez.

---

## 9. Seed Verisi — Demo Anında Dolu Sistem

`prisma/seed.ts` mevcut `config.js` ve `mock-data.js` içeriğini veritabanına taşır. Kliniğe demo
gösterirken sistem **boş görünmemeli** — bu yüzden seed zengin olacak:

- 1 admin (`admin@demo.com` / `admin123`), 1 müşteri (`musteri@demo.com` / `123456`)
- ~20 ek sahte müşteri (Türkçe isimler), her birinde 1–3 hayvan
- 10 hizmet (`config.js`'teki liste, süre bilgisi eklenmiş)
- 3 veteriner + haftalık çalışma takvimleri
- **~120 randevu**: geçmiş (`COMPLETED`), bugün (karışık), gelecek (`PENDING`/`CONFIRMED`)
  → admin takvimi ve dashboard grafikleri dolu görünür
- Her hayvan için 2–5 sağlık kaydı (aşı + muayene)
- 8 blog yazısı (gerçek Türkçe içerik, 5 kategori)
- 6 onaylı müşteri yorumu
- Varsayılan `SiteSetting` satırı (tüm tema presetleriyle)

Komut: `npm run db:seed` — `npm run db:reset` ile her an sıfırlanıp yeniden doldurulabilir
(demo öncesi temiz başlangıç için).

---

## 10. Tema Sistemi — Verilen Karar

Tüm renk paletleri korunacak ve **admin paneli → Ayarlar → Tema** ekranından değiştirilebilecek.
Fark şu: her preset artık **tek hakim renk + nötrler** disiplinine uyacak — `config.js`'teki gibi
primary/secondary/accent üçlüsü + 4 ayrı gradient değil. Böylece hangi tema seçilirse seçilsin
site "temiz" görünür.

| Preset | Hakim renk | Karakter |
|--------|-----------|----------|
| Adaçayı (varsayılan) | `#5A7D6A` | Sakin, doğal, sağlık çağrışımı |
| Okyanus | `#2C6E9B` | Serin, güvenilir |
| Lavanta | `#7A6BA8` | Modern, yumuşak |
| Kurumsal | `#1F3A5F` | Ciddi, profesyonel |
| Toprak | `#B0765A` | Sıcak, butik |
| Gece (dark) | `#7FB3A5` | Koyu zemin, düşük kontrast yorgunluğu |

**Teknik:** her preset bir CSS değişken seti (`--color-surface`, `--color-ink`, `--color-brand`,
`--color-brand-soft`, `--color-line`, ...). Tema değişimi `<html data-theme="adacayi">` özniteliğini
değiştirir; `transition` ile renkler yumuşakça geçer. Seçim `SiteSetting.theme.activePreset`'e
kaydedilir → **tüm ziyaretçiler** için kalıcı olur (eski sistemde sadece o tarayıcıda kalıyordu).

---

## 10b. Kapsama Eklenen Ek Özellikler

Aşağıdaki iki özellik plana sonradan eklendi ve ilgili fazlara dağıtıldı.

### 10b.1. WhatsApp Randevu Bildirimi

Kliniklerin müşteriyle fiilen konuştuğu kanal WhatsApp. Randevu yaşam döngüsündeki her adımda
mesaj gönderilir.

| Tetikleyici | Mesaj |
|-------------|-------|
| Randevu oluşturuldu | "Randevu talebiniz alındı. Kod: RND-2026-0042. Onaylandığında bilgilendirileceksiniz." |
| Admin onayladı | "Randevunuz onaylandı: 25 Eylül Cuma 14:30 — Dr. Ahmet Yılmaz. İptal: {link}" |
| 24 saat kala | "Yarın 14:30'da Boncuk için randevunuz var. Adres: {harita linki}" |
| İptal edildi | "Randevunuz iptal edildi. Yeni randevu: {link}" |

**Mimari:** `NotificationChannel` arayüzüne üçüncü uygulama olarak `WhatsappChannel` eklenir —
`jobs/` ve `appointments` modülü zaten bu arayüzü kullandığı için ek iş mantığı gerekmez.
`DEMO_MODE=true` iken mesaj gönderilmez, `Notification` tablosuna yazılır ve admin panelinde
"Gönderilecek mesaj" önizlemesi olarak gösterilir — demo sırasında hem maliyet hem hata riski sıfır.
Gerçek satışta `WHATSAPP_PROVIDER` env değişkeniyle Meta Cloud API veya Twilio devreye alınır.

Ayrıca sitede her yerde bulunan WhatsApp butonu, `SiteSetting.contact.whatsappMessage` içeriğiyle
`https://wa.me/{numara}?text={mesaj}` derin bağlantısı üretir (bu kısım sağlayıcı gerektirmez).

### 10b.2. Google Yorumları Entegrasyonu

Uydurma testimonial yerine kliniğin **gerçek** Google İşletme yorumları gösterilir — güven açısından
kıyaslanamaz derecede güçlü.

- **Kaynak:** Google Places API `place_details` → `reviews` (en fazla 5 yorum döner).
- **Önbellek:** Yorumlar günde bir kez cron ile çekilip `Testimonial` tablosuna
  `source = "GOOGLE"` olarak yazılır. Böylece her sayfa açılışında API çağrısı yapılmaz
  (kota + gecikme sorunu ortadan kalkar) ve Google erişilemezse site yine çalışır.
- **Şema değişikliği:** `Testimonial` tablosuna `source` (`MANUAL` | `GOOGLE`), `externalId`,
  `authorPhotoUrl`, `sourceUrl` alanları eklenir.
- **Admin kontrolü:** Ayarlar ekranından `googlePlaceId` girilir; düşük puanlı yorumlar
  gizlenebilir (silinmez — sadece sitede gösterilmez).
- **SEO:** Gösterilen yorumlar `AggregateRating` JSON-LD şemasına beslenir → Google arama
  sonuçlarında yıldız görünümü.
- **Demo modu:** `googlePlaceId` boşsa seed'deki manuel yorumlar gösterilir; böylece
  henüz Google işletme kaydı olmayan kliniğe de demo yapılabilir.

---

## 11. Geliştirme Fazları

### Faz 0 — Altyapı *(yarım gün)*
1. `git init` + `.gitignore`
2. npm workspaces monorepo kurulumu, mevcut dosyalar → `legacy/`
3. `docker-compose.yml` (PostgreSQL 17)
4. NestJS iskeleti + Prisma bağlantısı + `/health` ucu

### Faz 1 — Veri katmanı *(1 gün)*
5. `schema.prisma` — tüm modeller, ilişkiler, indeksler
6. İlk migration + partial unique index (ham SQL)
7. `seed.ts` — zengin demo verisi
8. Prisma Studio ile doğrulama

### Faz 2 — Auth + çekirdek *(1 gün)*
9. `auth` modülü (register/login/refresh/logout, argon2id, JWT, guard'lar)
10. `users` modülü (profil, şifre)
11. Global exception filter, validation pipe, Swagger, rate limit, helmet, CORS
12. Auth e2e testleri

### Faz 3 — İş mantığı *(2 gün)*
13. `settings` modülü (⭐ config.js'in yerine)
14. `services` + `staff` (+ schedule/time-off) modülleri
15. ⭐ `availability` motoru + **birim testleri** (en riskli parça, test şart)
16. `appointments` modülü (oluştur/onayla/iptal/ertele, çakışma koruması, kod üretimi)
17. `pets` + `medical-records` modülleri

### Faz 4 — İçerik + yardımcı *(1 gün)*
18. `blog`, `testimonials`, `contact`, `newsletter`, `notifications`, `media`, `dashboard`
19. Cron görevleri (`jobs/`) + `WhatsappChannel` (§10b.1)
20. Google Yorumları senkronizasyonu (§10b.2)
21. Swagger dokümantasyonunun tamamlanması

### Faz 5 — Frontend iskeleti *(1 gün)*
21. Vite + React Router v7 kurulumu, prerender yapılandırması
22. Tailwind v4 + tasarım token'ları + tema presetleri
23. `lib/api.ts` tip güvenli istemci, `lib/auth.tsx`, `lib/theme.tsx`
24. Lenis yumuşak scroll + Motion geçiş katmanı
25. UI bileşen kütüphanesi (Button, Card, Input, Dialog, Toast, Skeleton)

### Faz 6 — Tanıtım sayfaları *(2 gün)* — **yeni tasarım burada hayat buluyor**
26. Layout (Header, Footer, FAB) + Ana sayfa bölümleri
27. Hizmetler + hizmet detay, Ekibimiz, Hakkımızda
28. Blog + blog detay, İletişim, KVKK
29. SEO katmanı (meta, JSON-LD, sitemap, robots)

### Faz 7 — Uygulama sayfaları *(2 gün)*
30. Randevu sihirbazı (canlı müsaitlik ile)
31. Giriş / kayıt / şifre sıfırlama
32. Müşteri paneli (dashboard, randevularım, hayvanlarım, sağlık kartı, bildirimler, ayarlar)

### Faz 8 — Admin paneli *(2 gün)*
33. Dashboard + randevu takvimi
34. Müşteri / hasta yönetimi + sağlık kaydı girişi
35. Hizmet / personel / blog / yorum yönetimi
36. ⭐ Ayarlar ekranı (klinik bilgisi, çalışma saatleri, tema, özellik anahtarları)

### Faz 9 — Cila *(1 gün)*
37. Görsel üretimi (hero, ekip, hizmet, blog kapakları) — `assets/` boşluğu kapanır
38. Responsive geçiş + erişilebilirlik (klavye, kontrast, `prefers-reduced-motion`)
39. PWA, performans (Lighthouse hedefi: 90+), cross-browser
40. README + kurulum rehberi + deploy

---

## 12. Komut Referansı

```bash
# Veritabanı
docker compose up -d              # PostgreSQL ayağa kalkar
npm run db:migrate                # Migration uygula
npm run db:seed                   # Demo verisini yükle
npm run db:reset                  # Sıfırla + yeniden doldur (demo öncesi)
npm run db:studio                 # Görsel veritabanı tarayıcısı

# Geliştirme
npm run dev                       # api (3000) + web (5173) birlikte
npm run dev:api
npm run dev:web

# Test & build
npm run test                      # birim testleri
npm run test:e2e                  # API e2e
npm run build                     # api derleme + web prerender
```

`.env.example`:

```bash
DATABASE_URL="postgresql://vet:vet@localhost:5432/vetclinic?schema=public"
JWT_ACCESS_SECRET="degistir"
JWT_REFRESH_SECRET="degistir"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
WEB_ORIGIN="http://localhost:5173"
PORT=3000
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_UPLOAD_MB=5
DEMO_MODE=true                    # true iken e-posta/SMS gönderilmez, sadece DB'ye yazılır
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=
# SMS_PROVIDER=netgsm
```

---

## 13. Doğrulama Kriterleri

**Faz 3 sonrası (backend çekirdeği):**
- [ ] `POST /auth/register` → `POST /auth/login` → `GET /auth/me` zinciri çalışıyor
- [ ] Yanlış şifre 5 denemeden sonra rate limit'e takılıyor
- [ ] `GET /availability` kapalı günleri, izinleri ve dolu slotları doğru eliyor
- [ ] **Aynı slota eşzamanlı iki istek**: biri başarılı, diğeri `409 SLOT_TAKEN`
- [ ] Başka kullanıcının `petId`'si ile `GET /pets/:id` → `403`
- [ ] `PATCH /appointments/:id/cancel` `cancelBeforeHours` kuralını uyguluyor
- [ ] Swagger `/api/docs` tüm uçları listeliyor

**Faz 8 sonrası (tam sistem):**
- [ ] Admin panelinden klinik adı değişince site başlığı, header, footer, e-postalar güncelleniyor
- [ ] Admin panelinden tema değişince tüm ziyaretçiler yeni temayı görüyor
- [ ] Randevu al → admin panelinde anında görünüyor → onayla → müşteri panelinde "Onaylandı"
- [ ] Blog yazısı ekle → sitede yayında → Google zengin sonuç testi geçiyor
- [ ] Tarayıcı verisi silinince hiçbir şey kaybolmuyor (localStorage bağımlılığı bitti)
- [ ] Lighthouse: Performance ≥ 90, SEO = 100, Accessibility ≥ 95

---

## 14. Açık Kalan Kararlar

Uygulama ilerledikçe netleştirilecek başlıklar:

| # | Konu | Öneri |
|---|------|-------|
| 1 | **E-posta/SMS** gerçekten gönderilsin mi? | Demo için **hayır** (`DEMO_MODE=true`). Gerçek klinik satışında Resend + NetGSM eklenir. |
| 1b | **WhatsApp bildirimi** hangi sağlayıcı? | Demo: `wa.me` derin bağlantısı + simülasyon. Gerçek satış: WhatsApp Cloud API (Meta) veya Twilio. Karar, ilk klinik müşterisinin bütçesine göre verilecek. |
| 2 | **Görseller** nereden? | AI üretimi + telifsiz stok (Unsplash/Pexels) karışımı. `assets/` şu an tamamen boş. |
| 3 | **Deploy hedefi** | Frontend → Cloudflare Pages / Netlify (statik, ücretsiz). API + DB → Railway veya Hetzner VPS + Docker. |
| 4 | **Online ödeme** | Şimdilik kapsam dışı. İleride iyzico/PayTR ile randevu kaparosu eklenebilir. |
| 5 | **Çoklu dil (TR/EN)** | `proje-plani.md`'de sonraya bırakılmıştı; veritabanı şeması çeviri tablosuna hazır bırakılacak. |
| 6 | **Görsel depolama** | Başlangıçta yerel disk (`uploads/`). Ölçeklenirse S3/R2'ye geçiş tek modül değişikliği. |
