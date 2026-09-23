# 🐾 Veteriner Klinik Demo Web Sitesi — Proje Planı

## Proje Amacı

Farklı veteriner kliniklerine satılabilecek, **white-label** (kişiselleştirilebilir) bir demo web sitesi geliştirmek. Site:

- **Tek bir config dosyasından** tüm klinik bilgileri (ad, renk, iletişim, hizmetler) değiştirilebilecek
- **Backend olmadan** tamamen frontend'de çalışacak — tüm veriler `localStorage` ve mock JSON ile simüle edilecek
- **Animasyonlu, modern ve premium** görünecek — wetnose.com.tr'den ilham alınarak ama daha sade, doğal ve sağlık temalı
- **Tam işlevsel demo** olacak — randevu alma, üye girişi, profil görüntüleme, admin paneli hepsi çalışır durumda

> **ÖNEMLİ:** Bu proje bir **satış aracı**dır. Kliniklere gidip "siteniz böyle görünecek" demek için kullanılacak. Bu yüzden görsel kalite ve kullanıcı deneyimi en üst önceliktir.

---

## ✅ Alınan Kararlar

| Karar | Sonuç |
|-------|-------|
| **Klinik adı** | Placeholder: "Klinik Adı" — config'den tek tıkla değişir |
| **Tema sistemi** | 5 hazır preset + özel renk seçici + tek tıkla değiştirme |
| **Sayfalar** | Tüm sayfalar eksiksiz geliştirilecek |
| **Görseller** | AI ile üretilecek (hero, ekip, hizmet, Instagram mock) |
| **Admin paneli** | Tam kapsamlı: blog, hizmet, personel, randevu, iletişim, çalışma saatleri, ekstra her şey |
| **E-bülten** | Dahil edilecek |
| **KVKK sayfası** | Dahil edilecek |
| **PWA** | Dahil edilecek (manifest.json + service worker) |
| **Sanal klinik turu** | Sonraya bırakıldı |
| **Çoklu dil (TR/EN)** | Sonraya bırakıldı |

---

## 🎨 Tasarım Sistemi

### Renk Yaklaşımı — CSS Custom Properties

Site renkleri **tek bir yerden** (`config.js`) kontrol edilecek. CSS custom properties (`--primary`, `--secondary` vb.) kullanılacak ve JavaScript ile dinamik olarak değiştirilebilecek.

**Varsayılan Tema (Demo):**

```
Ana Renk (Primary):       #4CAF7D  (Doğal yeşil — güven, sağlık)
İkincil Renk (Secondary): #1E3A5F  (Lacivert — profesyonellik)
Vurgu (Accent):           #E8A838  (Sıcak altın — dikkat çekici CTA'lar)
Arkaplan (Background):    #FAFAF7  (Krem beyaz — sıcak, doğal)
Metin (Text):             #2D3436  (Koyu gri — okunaklı)
Yumuşak Arka:             #F0EDE6  (Bej — kartlar, alternatif bölümler)
Başarı:                   #27AE60  (Yeşil — onay mesajları)
Uyarı:                    #E74C3C  (Kırmızı — hata, acil)
```

### Hazır Tema Presetleri

Config'de değiştirilebilir hazır tema paketleri:

| Tema Adı | Primary | Secondary | Accent | Kullanım |
|-----------|---------|-----------|--------|----------|
| **Doğa** (Varsayılan) | `#4CAF7D` | `#1E3A5F` | `#E8A838` | Genel amaçlı |
| **Okyanus** | `#2196F3` | `#0D47A1` | `#FF9800` | Mavi seven klinikler |
| **Lavanta** | `#7E57C2` | `#4A148C` | `#FFB74D` | Feminen/modern |
| **Klasik** | `#D32F2F` | `#1B5E20` | `#FFC107` | Geleneksel klinikler |
| **Midnight** | `#00BCD4` | `#0A1628` | `#FF6B6B` | Dark mode seven klinikler |

### Tipografi

```
Başlıklar:  'Playfair Display', serif  — Zarif, güvenilir
Gövde:      'Inter', sans-serif        — Temiz, modern, okunabilir
Accent:     'Outfit', sans-serif       — Butonlar, etiketler
```

Google Fonts üzerinden yüklenecek. Font boyutları:

```
--font-xs:    0.75rem   (12px)
--font-sm:    0.875rem  (14px)
--font-base:  1rem      (16px)
--font-lg:    1.125rem  (18px)
--font-xl:    1.25rem   (20px)
--font-2xl:   1.5rem    (24px)
--font-3xl:   1.875rem  (30px)
--font-4xl:   2.25rem   (36px)
--font-5xl:   3rem      (48px)
--font-6xl:   3.75rem   (60px)
--font-hero:  4.5rem    (72px)
```

### Animasyon Sistemi

Tüm animasyonlar **CSS + Intersection Observer** ile:

| Animasyon | Kullanıldığı Yer | Tetiklenme |
|-----------|-------------------|------------|
| `fade-up` | Kartlar, paragraflar | Scroll ile görünür olunca |
| `fade-in` | Görseller, ikonlar | Scroll ile görünür olunca |
| `slide-left` | İçerik blokları | Scroll ile görünür olunca |
| `slide-right` | Görseller | Scroll ile görünür olunca |
| `scale-in` | İstatistik sayaçlar | Scroll ile görünür olunca |
| `count-up` | Sayısal istatistikler | Görünür olunca sayı animasyonu |
| `float` | Dekoratif pati izleri | Sürekli (CSS keyframe) |
| `pulse-glow` | Acil hizmet badge | Sürekli (CSS keyframe) |
| `shimmer` | CTA butonları hover | Hover'da (CSS) |
| `typewriter` | Hero başlık | Sayfa yüklenince |
| `parallax` | Hero arka plan | Scroll hızı farkı |
| `carousel` | Testimonials, Instagram | Otomatik + tıklama |
| `stagger` | Grid kartları | Sıralı gecikmeyle giriş |
| `morph` | Tema değişiminde renkler | Config değiştiğinde |

### Bileşen Tasarım Kuralları

- **Kartlar**: `border-radius: 16px`, hafif `box-shadow`, hover'da `translateY(-4px)` + gölge büyütme
- **Butonlar**: Rounded (`border-radius: 50px`), gradient arka plan, hover'da shimmer efekti
- **Bölüm geçişleri**: Her bölüm arası SVG wave veya açılı divider
- **Glassmorphism**: Sadece header (scroll sonrası) ve floating butonlarda — aşırıya kaçılmayacak
- **İkonlar**: Lucide Icons (SVG, hafif, tutarlı stil)
- **Boşluklar**: 8px grid sistemi (`8, 16, 24, 32, 48, 64, 80, 96, 120`)

---

## 📁 Proje Dosya Yapısı

```
veteriner-site/
├── index.html                    ← Ana sayfa
├── hizmetler.html                ← Hizmetler listesi
├── hizmet-detay.html             ← Tek hizmet detayı (query param ile)
├── ekibimiz.html                 ← Veteriner ekip tanıtımı
├── hakkimizda.html               ← Klinik hakkında, galeri, sertifikalar
├── blog.html                     ← Blog listesi
├── blog-detay.html               ← Tek blog yazısı (query param ile)
├── iletisim.html                 ← İletişim formu + harita
├── randevu.html                  ← Online randevu alma (çok adımlı form)
├── giris.html                    ← Giriş sayfası
├── kayit.html                    ← Kayıt sayfası
├── sifre-sifirla.html            ← Şifre sıfırlama
├── kvkk.html                     ← KVKK / Gizlilik Politikası
├── profil/
│   ├── index.html                ← Müşteri dashboard
│   ├── randevularim.html         ← Geçmiş/gelecek randevular
│   ├── hayvanlarim.html          ← Kayıtlı evcil hayvanlar
│   └── saglik-karti.html         ← Hayvan sağlık kartı detay
├── panel/
│   ├── index.html                ← Admin dashboard
│   ├── randevular.html           ← Randevu takvimi yönetimi
│   ├── musteriler.html           ← Müşteri listesi
│   ├── hayvanlar.html            ← Hayvan kayıtları
│   ├── blog-yonetimi.html        ← Blog CRUD
│   ├── hizmet-yonetimi.html      ← Hizmet CRUD
│   ├── personel-yonetimi.html    ← Personel CRUD
│   └── ayarlar.html              ← Site ayarları (iletişim, çalışma saatleri vb.)
├── css/
│   ├── variables.css             ← CSS custom properties (temalar)
│   ├── reset.css                 ← CSS reset/normalize
│   ├── base.css                  ← Temel stiller (body, typography, links)
│   ├── components.css            ← Tekrar kullanılan bileşenler (btn, card, badge...)
│   ├── layout.css                ← Grid, container, spacing
│   ├── animations.css            ← Tüm animasyon tanımları
│   ├── header.css                ← Header & navigation
│   ├── footer.css                ← Footer
│   ├── hero.css                  ← Hero section
│   ├── sections.css              ← Ana sayfa bölümleri (stats, services, team...)
│   ├── forms.css                 ← Form elemanları (input, select, textarea)
│   ├── randevu.css               ← Randevu sayfası özel stiller
│   ├── auth.css                  ← Giriş/kayıt sayfaları
│   ├── profil.css                ← Müşteri paneli
│   ├── panel.css                 ← Admin paneli
│   ├── responsive.css            ← Medya sorguları (tüm breakpoint'ler)
│   └── utilities.css             ← Yardımcı sınıflar (text-center, mt-4, hidden...)
├── js/
│   ├── config.js                 ← 🎯 ANA CONFIG: Klinik adı, renkler, iletişim, hizmetler, her şey
│   ├── app.js                    ← Ana uygulama: sayfa yükleme, tema uygulama, ortak init
│   ├── theme.js                  ← Tema değiştirici: CSS variables güncelleme, preset'ler
│   ├── animations.js             ← Intersection Observer + scroll animasyonları
│   ├── header.js                 ← Header: scroll davranışı, mobil menü, aktif link
│   ├── hero.js                   ← Hero: slider, typewriter, parallax
│   ├── stats.js                  ← İstatistik count-up animasyonu
│   ├── carousel.js               ← Genel carousel bileşeni (testimonials, instagram)
│   ├── randevu.js                ← Randevu formu: adım yönetimi, validasyon, localStorage kayıt
│   ├── auth.js                   ← Giriş/kayıt/çıkış: localStorage token yönetimi
│   ├── profil.js                 ← Müşteri paneli: randevu geçmişi, hayvan yönetimi
│   ├── panel.js                  ← Admin paneli: takvim, müşteri listesi, blog CRUD
│   ├── mock-data.js              ← Tüm mock veriler (kullanıcılar, randevular, blog yazıları...)
│   ├── router.js                 ← Basit query param tabanlı dinamik sayfa yönetimi
│   ├── components.js             ← Ortak HTML bileşenleri render (header, footer inject)
│   └── utils.js                  ← Yardımcı fonksiyonlar (tarih formatlama, validasyon...)
├── assets/
│   ├── images/
│   │   ├── hero/                 ← Hero slider görselleri (AI üretilecek)
│   │   ├── services/             ← Hizmet görselleri (AI üretilecek)
│   │   ├── team/                 ← Ekip fotoğrafları (AI üretilecek)
│   │   ├── gallery/              ← Klinik galeri fotoğrafları
│   │   ├── blog/                 ← Blog kapak görselleri
│   │   ├── instagram/            ← Mock Instagram görselleri (AI üretilecek)
│   │   ├── testimonials/         ← Müşteri fotoğrafları
│   │   └── icons/                ← Özel SVG ikonlar
│   └── fonts/                    ← (Opsiyonel, Google Fonts CDN tercih edilecek)
├── manifest.json                 ← PWA manifest
├── sw.js                         ← PWA service worker
├── proje-plani.md                ← Bu dosya
└── README.md                     ← Proje açıklaması & kurulum rehberi
```

---

## ⚙️ Config Sistemi Detayı — `config.js`

Bu dosya projenin **kalbi**. Bir klinike gittiğinde sadece bu dosyayı düzenleyeceksin.

```javascript
// config.js — Tüm site bu dosyadan beslenir
const SITE_CONFIG = {

  // ═══════════════════════════════════════
  // 🏥 KLİNİK BİLGİLERİ
  // ═══════════════════════════════════════
  clinic: {
    name: "Klinik Adı",                           // ← Tek yerden değiştir, tüm sitede geçerli
    slogan: "Dostlarınız İçin En İyi Bakım",
    description: "Modern veteriner hizmetleri ile evcil dostlarınıza en iyi bakımı sunuyoruz.",
    foundedYear: 2010,
    totalPatients: "27.000+",
    experienceYears: "15+",
    satisfactionRate: "4.9/5",
  },

  // ═══════════════════════════════════════
  // 📞 İLETİŞİM BİLGİLERİ
  // ═══════════════════════════════════════
  contact: {
    phone: "0262 000 00 00",
    phoneRaw: "+902620000000",
    whatsapp: "+905000000000",
    whatsappMessage: "Merhaba, randevu almak istiyorum.",
    email: "info@klinikadi.com",
    instagram: "klinikadi",
    instagramUrl: "https://instagram.com/klinikadi",
    facebook: "",
    twitter: "",
    address: {
      full: "Örnek Mah. Veteriner Cad. No:1 Merkez/İstanbul",
      district: "Merkez",
      city: "İstanbul",
      mapEmbedUrl: "https://www.google.com/maps/embed?...",
      lat: 41.0082,
      lng: 28.9784
    },
    workingHours: {
      weekdays: "09:00 - 20:00",
      saturday: "09:00 - 18:00",
      sunday: "Kapalı",
      emergency: true,
      emergencyPhone: "0532 000 00 00"
    }
  },

  // ═══════════════════════════════════════
  // 🎨 TEMA AYARLARI
  // ═══════════════════════════════════════
  theme: {
    activePreset: "doga",  // "doga" | "okyanus" | "lavanta" | "klasik" | "midnight" | "custom"
    presets: { ... },      // 5 hazır tema (detaylar config.js dosyasında)
    custom: null           // Özel renk seçimi
  },

  // ═══════════════════════════════════════
  // 🩺 HİZMETLER
  // ═══════════════════════════════════════
  services: [ ... ],       // 10 hizmet (detaylar config.js dosyasında)

  // ═══════════════════════════════════════
  // 👨‍⚕️ EKİP
  // ═══════════════════════════════════════
  team: [ ... ],           // 3 veteriner (detaylar config.js dosyasında)

  // ═══════════════════════════════════════
  // 💬 MÜŞTERİ YORUMLARI
  // ═══════════════════════════════════════
  testimonials: [ ... ],   // 5 mock yorum

  // ═══════════════════════════════════════
  // 📝 RANDEVU AYARLARI
  // ═══════════════════════════════════════
  appointment: {
    slotDuration: 30,      // dakika
    startHour: 9,
    endHour: 20,
    daysInAdvance: 30,
    cancelBeforeHours: 72,
    autoConfirm: false,
    reminderHours: 24
  },

  // ═══════════════════════════════════════
  // 🔧 SİTE AYARLARI
  // ═══════════════════════════════════════
  site: {
    language: "tr",
    showEmergencyBanner: true,
    showInstagramFeed: true,
    showBlogSection: true,
    showLiveStats: true,
    showNewsletter: true,
    enableRegistration: true,
    enableOnlineBooking: true,
    enablePwa: true,
    demoMode: true           // Tema değiştirici paneli görünsün mü
  }
};
```

> **İPUCU:** Kliniklere gittiğinde: `config.js` dosyasını aç → `clinic.name`'i değiştir → `theme.activePreset`'i değiştir → **5 dakikada tamamen kişiselleştirilmiş demo.**

---

## 🖥️ Sayfa Detayları

### Sayfa 1: Ana Sayfa (`index.html`)

Ana sayfa sitedeki en önemli sayfa. Müşteriye teklif verirken **ilk göstereceğin sayfa** bu olacak. 10 bölümden oluşacak:

#### Bölüm 1.1: Header (Tüm Sayfalarda Ortak)
```
┌─────────────────────────────────────────────────────────┐
│  [Logo/Klinik Adı]    Nav Linkleri    [📞 Tel] [Randevu Al] │
└─────────────────────────────────────────────────────────┘
```
- Sayfa üstünde **transparent**, scroll sonrası **beyaz + blur** backdrop
- Logo sol tarafta — `config.clinic.name` ile otomatik
- Navigation: Ana Sayfa, Hizmetler, Ekibimiz, Blog, İletişim
- Sağda: Telefon numarası + "Online Randevu Al" buton (primary renk)
- Mobilde: Hamburger menü → slide-in sidebar
- Header üstünde ince acil hizmet bandı: `🚨 7/24 Acil: 0532 000 00 00`

#### Bölüm 1.2: Hero Section
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [badge: 🩺 7/24 Acil Veteriner Hizmeti  ● Aktif]     │
│                                                         │
│   ██ Dostlarınız İçin                                   │
│   ██ En İyi Bakım                    [Hayvan görseli    │
│                                       parallax efekt]    │
│   Modern veteriner hizmetleri ile                       │
│   evcil dostlarınıza...                                 │
│                                                         │
│   [🗓 Online Randevu Al →]  [▶ Keşfet]                  │
│                                                         │
│   27.000+        15+           7/24                     │
│   Mutlu Hasta    Yıl Deneyim   Acil Hizmet              │
│                                                         │
│                  ↓ Scroll                                │
└─────────────────────────────────────────────────────────┘
```
- Full viewport height, gradient overlay üzerine hero görseli
- Animasyonlu başlık: Satır satır `fade-up` ile giriş
- İstatistik sayaçları: `count-up` animasyonu (scroll'da tetiklenir)
- İki CTA butonu: Primary (Randevu) + Secondary (Keşfet, aşağı scroll)
- Arka planda yumuşak **parallax** efekti

#### Bölüm 1.3: Canlı Klinik Ritmi Bar
```
┌─────────────────────────────────────────────────────────┐
│  ● Canlı  │  🩺 Şu an 3 hasta  │  👥 Bugün 12 tedavi  │  ⏱ ~15dk │
└─────────────────────────────────────────────────────────┘
```
- Gradient arka plan, yatay ticker bant
- `config.site.showLiveStats` ile açılıp kapatılabilir
- Mock veriler — gerçek veritabanı bağlanınca canlı olur

#### Bölüm 1.4: Hizmetlerimiz
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🩺       │ │ 💉       │ │ ✂️       │ │ 😁       │
│ Genel    │ │ Aşılama  │ │ Cerrahi  │ │ Diş      │
│ Muayene  │ │          │ │          │ │ Bakımı   │
│ Kısa açık│ │ Kısa açık│ │ Kısa açık│ │ Kısa açık│
│          │ │          │ │          │ │          │
│ [Detay →]│ │ [Detay →]│ │ [Detay →]│ │ [Detay →]│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
                   [Tüm Hizmetleri Gör →]
```
- `config.services` dizisinden oluşturulur (dinamik)
- Grid: Desktop 4 sütun, tablet 2, mobil 1
- Her kart: İkon + başlık + kısa açıklama + "Detay" linki
- Staggered fade-up animasyonu (sırayla beliriyor)
- Hover: Kart yukarı kayar, gölge büyür, ikon renklenir

#### Bölüm 1.5: Online Randevu CTA
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   📅 Online Randevu Almak Çok Kolay!                    │
│                                                         │
│   ① Hizmet Seç  →  ② Tarih Seç  →  ③ Onayla            │
│                                                         │
│           [✨ Hemen Randevu Al →]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
- Dikkat çekici bölüm, farklı arka plan (primary gradient veya pattern)
- 3 adımlık mini infografik
- Büyük CTA buton

#### Bölüm 1.6: Ekibimiz
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  [Fotoğraf]│  │  [Fotoğraf]│  │  [Fotoğraf]│
│            │  │            │  │            │
│ Dr. Ahmet  │  │ Dr. Elif   │  │ Dr. Mehmet │
│ Baş Hekim  │  │ Dermatoloji│  │ Ortopedi   │
│            │  │            │  │            │
│ Hover →    │  │ Hover →    │  │ Hover →    │
│ bio çıkıyor│  │ bio çıkıyor│  │ bio çıkıyor│
└────────────┘  └────────────┘  └────────────┘
```
- `config.team` dizisinden oluşturulur
- Fotoğraflı kartlar, hover'da kısa bio overlay
- Slide-in animasyonu

#### Bölüm 1.7: Müşteri Yorumları (Testimonials Carousel)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ⭐⭐⭐⭐⭐                                              │
│  "Boncuk'un ameliyatı çok başarılı geçti..."           │
│                                                         │
│  — Ayşe K., Boncuk (Kedi)                              │
│                                                         │
│  ◄  ○ ● ○ ○  ►                                         │
└─────────────────────────────────────────────────────────┘
```
- Otomatik kayan carousel (5 saniye aralıkla)
- Yıldız puanlama, yorum, müşteri adı, hayvan bilgisi
- Sol/sağ ok butonları + dot göstergeleri
- Touch swipe desteği (mobil)

#### Bölüm 1.8: Instagram Feed
```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │
│    │ │    │ │    │ │    │ │    │ │    │
└────┘ └────┘ └────┘ └────┘ └────┘ └────┘
        [@klinikadi 'ı Instagram'da Takip Et]
```
- 6 adet mock Instagram postu (kare grid)
- Her biri tıklanınca Instagram'a açılır
- Hover efekti: Instagram ikonu overlay
- `config.site.showInstagramFeed` ile kontrol edilir

#### Bölüm 1.9: İletişim & Konum
```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│  📍 Adres            │  [Google Maps        │
│  📞 Telefon          │   Gömülü Harita]     │
│  📧 E-posta          │                      │
│                      │                      │
│  Çalışma Saatleri:   │                      │
│  Pzt-Cum: 09-20     │                      │
│  Cmt: 09-18         │                      │
│  Paz: Kapalı        │                      │
│                      │                      │
│  [💬 WhatsApp ile    │                      │
│   İletişime Geç]    │                      │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

#### Bölüm 1.10: Footer
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Klinik Adı         Hızlı Linkler    İletişim   │
│  Kısa açıklama             Hizmetler        Telefon    │
│                             Blog             E-posta   │
│  Sosyal Medya İkonları      Randevu Al       Adres     │
│  📷 📱 📞                   Giriş Yap                   │
│                                                         │
│  📧 E-bülten Aboneliği: [e-posta] [Abone Ol]          │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  © 2024 Klinik Adı. Tüm hakları saklıdır.   KVKK      │
└─────────────────────────────────────────────────────────┘
```

---

### Sayfa 2: Randevu (`randevu.html`)

Çok adımlı form wizard — en kritik işlevsel sayfa.

```
Progress bar:  ━━━━━━━━●━━━━━━━━○━━━━━━━━○━━━━━━━━○━━━━━━━━○

Adım 1: Hizmet Seçimi
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Muayene  │ │ Aşılama  │ │ Cerrahi  │   ← Tıklanabilir kartlar
  └──────────┘ └──────────┘ └──────────┘

Adım 2: Veteriner Seçimi
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Dr.Ahmet  │ │Dr.Elif   │ │Farketmez │
  └──────────┘ └──────────┘ └──────────┘

Adım 3: Tarih & Saat
  ┌──────────────────────┐  ┌──────────────┐
  │  Takvim              │  │  09:00  ✓    │
  │  < Eylül 2026 >      │  │  09:30       │
  │  [gün seçimi grid]   │  │  10:00  ✓    │
  │                      │  │  10:30       │
  └──────────────────────┘  │  11:00  ✓    │
                            └──────────────┘

Adım 4: Hayvan & İletişim Bilgileri
  ┌────────────────────────────────────────┐
  │  Hayvan Adı:  [________]              │
  │  Türü:        [Kedi ▾]               │
  │  Cinsi:       [________]              │
  │  Yaş:         [________]              │
  │  Adınız:      [________]              │
  │  Telefon:     [________]              │
  │  E-posta:     [________]              │
  │  Not:         [________________]      │
  └────────────────────────────────────────┘
  (Üye giriş yapmışsa otomatik dolu)

Adım 5: Onay
  ┌────────────────────────────────────────┐
  │  📋 Randevu Özeti                      │
  │                                        │
  │  Hizmet:    Genel Muayene              │
  │  Veteriner: Dr. Ahmet Yılmaz           │
  │  Tarih:     25 Eylül 2026, Cuma        │
  │  Saat:      14:30                       │
  │  Hayvan:    Boncuk (Kedi)              │
  │                                        │
  │  [← Geri]         [✅ Randevuyu Onayla] │
  └────────────────────────────────────────┘

Sonuç: Başarı Ekranı
  ┌────────────────────────────────────────┐
  │         ✅ Randevunuz Oluşturuldu!      │
  │                                        │
  │  Onay kodu: #RND-2026-0042            │
  │                                        │
  │  Size onay mesajı gönderilecektir.     │
  │                                        │
  │  [📅 Takvime Ekle]  [🏠 Ana Sayfaya]  │
  └────────────────────────────────────────┘
```

**Teknik detaylar:**
- Her adım geçişinde yumuşak slide animasyonu
- Form validasyonu: Her adımda geçiş öncesi kontrol
- `localStorage`'a kayıt
- Üye girişi yapmışsa hayvan/iletişim bilgileri otomatik dolar
- Üye değilse de randevu alabilir (misafir randevu)

---

### Sayfa 3: Giriş (`giris.html`) ve Kayıt (`kayit.html`)

```
┌────────────────────────────────────────────────┐
│                                                │
│              🐾 Klinik Adı                     │
│              Hesabınıza giriş yapın            │
│                                                │
│        E-posta:  [________________]            │
│        Şifre:    [________________]  👁        │
│                                                │
│        [☐ Beni hatırla]    Şifremi unuttum →   │
│                                                │
│        [═══ Giriş Yap ═══]                     │
│                                                │
│        ─── veya ───                            │
│                                                │
│        Hesabınız yok mu? Kayıt olun →          │
│                                                │
└────────────────────────────────────────────────┘
```

**Mock auth sistemi:**
- `localStorage`'da kullanıcı veritabanı
- Kayıt: Ad, soyad, telefon, e-posta, şifre
- Login: E-posta + şifre kontrolü
- Token: `localStorage.setItem('authToken', ...)` ile oturum yönetimi
- Varsayılan demo hesapları:
  - Müşteri: `musteri@demo.com` / `123456`
  - Admin: `admin@demo.com` / `admin123`

---

### Sayfa 4: Müşteri Paneli (`profil/`)

#### Dashboard (`profil/index.html`)
```
┌─────────────────────────────────────────────────────┐
│  Sidebar          │  Hoş geldin, Ayşe! 👋           │
│                   │                                  │
│  📊 Dashboard     │  ┌─────────┐ ┌─────────┐        │
│  📅 Randevularım  │  │Yaklaşan │ │ Toplam  │        │
│  🐾 Hayvanlarım   │  │Randevu:2│ │ Hayvan:3│        │
│  📋 Sağlık Kartı  │  └─────────┘ └─────────┘        │
│  🔔 Bildirimler   │                                  │
│  ⚙️ Ayarlar       │  Yaklaşan Randevunuz:            │
│  🚪 Çıkış        │  ┌──────────────────────────┐     │
│                   │  │ 25 Eyl - 14:30           │     │
│                   │  │ Genel Muayene            │     │
│                   │  │ Dr. Ahmet - Boncuk       │     │
│                   │  │ [İptal Et] [Değiştir]    │     │
│                   │  └──────────────────────────┘     │
└───────────────────┴──────────────────────────────────┘
```

#### Hayvanlarım (`profil/hayvanlarim.html`)
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  🐱      │  │  🐶      │  │  ➕      │
│ Boncuk   │  │ Karamel  │  │ Yeni     │
│ Kedi     │  │ Köpek    │  │ Hayvan   │
│ 3 yaş    │  │ 5 yaş    │  │ Ekle     │
│[Detay]   │  │[Detay]   │  │          │
└──────────┘  └──────────┘  └──────────┘
```

#### Sağlık Kartı (`profil/saglik-karti.html`)
```
┌─────────────────────────────────────────────────────┐
│  🐱 Boncuk — Sağlık Kartı                          │
│                                                     │
│  📊 Genel Bilgiler                                  │
│  Tür: Kedi | Cins: British Shorthair | Yaş: 3      │
│  Kilo: 4.5 kg | Renk: Gri | Kısırlaştırılmış: ✓   │
│                                                     │
│  💉 Aşı Takvimi                                     │
│  ┌────────────────────────────────────────────┐     │
│  │  ✅ Karma Aşı      15.03.2026  (Yapıldı)  │     │
│  │  ✅ Kuduz Aşısı     20.04.2026  (Yapıldı)  │     │
│  │  ⏳ Karma Aşı      15.03.2027  (Yaklaşan)  │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  📝 Tedavi Geçmişi                                  │
│  ┌────────────────────────────────────────────┐     │
│  │  10.05.2026  Genel Muayene  Dr. Ahmet      │     │
│  │  22.07.2026  Diş Temizliği  Dr. Elif       │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

### Sayfa 5: Admin Paneli (`panel/`)

#### Dashboard (`panel/index.html`)
```
┌────────────────────────────────────────────────────────────┐
│  Sidebar            │  📊 Dashboard                        │
│                     │                                      │
│  📊 Dashboard       │  ┌────────┐┌────────┐┌────────┐     │
│  📅 Randevular      │  │Bugünkü ││Bu Hafta ││Toplam  │     │
│  👥 Müşteriler      │  │ Rndv:8 ││  Rndv:32││Müşt:156│     │
│  🐾 Hayvanlar       │  └────────┘└────────┘└────────┘     │
│  📝 Blog Yönetimi   │                                      │
│  🩺 Hizmet Yönetimi │  📅 Bugünkü Randevular               │
│  👨‍⚕️ Personel       │  ┌─────┬────────┬────────┬──────┐    │
│  ⚙️ Ayarlar         │  │Saat │Hasta   │Hizmet  │Durum │    │
│  🚪 Çıkış          │  │09:00│Boncuk  │Muayene │✅    │    │
│                     │  │09:30│Karamel │Aşı     │⏳    │    │
│                     │  │10:00│Pamuk   │Cerrahi │⏳    │    │
│                     │  └─────┴────────┴────────┴──────┘    │
└─────────────────────┴──────────────────────────────────────┘
```

#### Randevu Takvimi (`panel/randevular.html`)
```
┌────────────────────────────────────────────────────────────┐
│  ◄ Eylül 2026 ►                                           │
│                                                            │
│  Pzt    Sal    Çar    Per    Cum    Cmt    Paz             │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐             │
│  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │             │
│  │     │ ●●  │ ●   │ ●●● │ ●●  │ ●   │     │             │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤             │
│  │  8  │  9  │ 10  │ ...                                  │
│                                                            │
│  Gün tıklandığında randevu detayları açılır                │
│  Randevu durumu: ✅ Onaylandı | ⏳ Bekliyor | ❌ İptal     │
│  Admin randevuyu onaylayabilir, iptal edebilir             │
└────────────────────────────────────────────────────────────┘
```

#### Hizmet Yönetimi (`panel/hizmet-yonetimi.html`)
- Mevcut hizmetleri listele, düzenle, sil
- Yeni hizmet ekle (başlık, açıklama, ikon, kategori)
- Hizmet sırasını değiştir

#### Personel Yönetimi (`panel/personel-yonetimi.html`)
- Veteriner/personel listesi
- Yeni personel ekle (ad, uzmanlık, biyografi, fotoğraf)
- Personel düzenle/sil

#### Ayarlar (`panel/ayarlar.html`)
- İletişim bilgilerini güncelle (telefon, e-posta, adres)
- Çalışma saatlerini güncelle
- Sosyal medya linklerini güncelle
- Acil hizmet açma/kapama
- Site bölüm göster/gizle ayarları

---

### Sayfa 6: Hizmetler (`hizmetler.html`)

```
┌─────────────────────────────────────────────────────┐
│  Hero: "Hizmetlerimiz" başlık + kısa açıklama       │
│                                                     │
│  Filtre: [Tümü] [Cerrahi] [Koruyucu] [Tanı]        │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Genel    │ │ Aşılama  │ │ Cerrahi  │            │
│  │ Muayene  │ │          │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Diş      │ │Dermatoloji│ │Radyoloji │            │
│  │ Bakımı   │ │          │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

Her kart tıklandığında `hizmet-detay.html?id=genel-muayene` gibi detay sayfasına yönlendirir.

---

### Sayfa 7: Blog (`blog.html`)

```
┌─────────────────────────────────────────────────────┐
│  Hero: "Sağlık Rehberi" başlık                      │
│                                                     │
│  Kategoriler: [Tümü] [Beslenme] [Bakım] [Sağlık]   │
│                                                     │
│  ┌────────────────────────────┐  ┌─────────────────┐│
│  │  [Büyük kapak görsel]     │  │ [Küçük kart]    ││
│  │  Kedinizin Beslenmesi     │  │ Blog yazısı 2   ││
│  │  12 Eyl 2026 · 5 dk okuma│  │                  ││
│  │  Kısa özet...             │  ├─────────────────┤│
│  │  [Devamını Oku →]         │  │ [Küçük kart]    ││
│  │                           │  │ Blog yazısı 3   ││
│  └────────────────────────────┘  └─────────────────┘│
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Blog 4│ │Blog 5│ │Blog 6│ │Blog 7│              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
└─────────────────────────────────────────────────────┘
```

---

### Sayfa 8: Ekibimiz (`ekibimiz.html`)

```
┌─────────────────────────────────────────────────────┐
│  Hero: "Uzman Ekibimiz" başlık                      │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │  [Büyük Fotoğraf]    Dr. Ahmet Yılmaz   │        │
│  │                      Baş Veteriner Hekim │        │
│  │                      Genel Cerrahi       │        │
│  │                      15 yıl deneyim      │        │
│  │                      Detaylı biyografi...│        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │  Dr. Elif Kaya        [Büyük Fotoğraf]  │        │
│  │  Dermatoloji                             │        │
│  │  ...                                    │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

Zigzag layout (solda fotoğraf - sağda bilgi, sonra tersi).

---

### Sayfa 9: Hakkımızda (`hakkimizda.html`)

```
┌─────────────────────────────────────────────────────┐
│  Hero: "Hakkımızda"                                 │
│                                                     │
│  📖 Hikayemiz                                       │
│  Paragraf paragraf klinik hikayesi...               │
│                                                     │
│  📊 Rakamlarla Biz                                  │
│  27.000+ Hasta | 15+ Yıl | 4.9/5 Puan             │
│                                                     │
│  📸 Klinik Galerisi                                 │
│  [foto] [foto] [foto] [foto]                        │
│  (Lightbox ile büyütme)                             │
│                                                     │
│  🏆 Sertifikalarımız                                │
│  [sertifika görselleri]                             │
└─────────────────────────────────────────────────────┘
```

---

### Sayfa 10: İletişim (`iletisim.html`)

```
┌──────────────────────┬──────────────────────────────┐
│                      │                              │
│  İletişim Formu      │  İletişim Bilgileri          │
│                      │                              │
│  Ad:     [________]  │  📍 Adres                    │
│  E-posta:[________]  │  📞 Telefon                  │
│  Konu:   [________]  │  📧 E-posta                  │
│  Mesaj:  [________]  │  📷 Instagram                │
│           [________]  │  💬 WhatsApp                 │
│           [________]  │                              │
│                      │  Çalışma Saatleri:            │
│  [📨 Gönder]         │  Pzt-Cum: 09:00-20:00       │
│                      │  Cmt: 09:00-18:00           │
│                      │  Paz: Kapalı                │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│              [Google Maps - Tam Genişlik]            │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Floating Bileşenler (Tüm Sayfalarda)

### Sosyal Medya FAB (Floating Action Buttons)
```
Sağ alt köşe, her zaman görünür:

        ┌────┐
        │ 📞 │  ← Tıkla → telefon aç
        └────┘
        ┌────┐
        │ 💬 │  ← Tıkla → WhatsApp aç (hazır mesajla)
        └────┘
        ┌────┐
        │ 📷 │  ← Tıkla → Instagram'a git
        └────┘
      ┌────────┐
      │   🐾   │  ← Ana buton (tıklayınca diğerleri açılır)
      └────────┘
```
- Varsayılan: Sadece pati izi butonu görünür
- Tıklayınca üstündeki 3 buton fan-out animasyonuyla açılır
- Mobilde daha belirgin, desktopta daha küçük
- WhatsApp: `https://wa.me/{numara}?text={hazır mesaj}`

### Tema Değiştirici (Demo için)
```
Sol alt köşe (sadece demo modda):

      ┌────────┐
      │  🎨   │  ← Tıklayınca açılır
      └────────┘

Açılan panel:
┌──────────────────────┐
│  🎨 Tema Değiştir    │
│                      │
│  Preset:             │
│  ○ Doğa (Varsayılan) │
│  ○ Okyanus           │
│  ○ Lavanta            │
│  ○ Klasik             │
│  ○ Midnight (Dark)    │
│                      │
│  Klinik Adı:         │
│  [_______________]   │
│  [✓ Uygula]         │
│                      │
│  Veya özel renk:     │
│  Primary:  [#____]   │
│  Secondary:[#____]   │
│  Accent:   [#____]   │
│  [✓ Uygula]         │
└──────────────────────┘
```
- Tema değişince: tüm CSS variables anlık güncellenir
- Klinik adı değişince: tüm sayfalardaki `{clinic.name}` anlık güncellenir
- Geçiş animasyonu: yumuşak `transition` ile renkler morph eder
- `localStorage`'a kaydedilir (sayfa yenilenince de kalır)

---

## 🧩 Mock Data Yapısı (`mock-data.js`)

```javascript
const MOCK_DATA = {
  // Kullanıcılar
  users: [
    {
      id: "usr-001",
      email: "musteri@demo.com",
      password: "123456",           // Gerçek projede hash olur
      role: "customer",
      name: "Ayşe Kara",
      phone: "0532 111 22 33",
      avatar: null,
      createdAt: "2024-01-15"
    },
    {
      id: "usr-admin",
      email: "admin@demo.com",
      password: "admin123",
      role: "admin",
      name: "Dr. Ahmet Yılmaz",
      phone: "0532 999 88 77",
      avatar: "team/vet-1.jpg",
      createdAt: "2023-01-01"
    }
  ],

  // Evcil Hayvanlar
  pets: [
    {
      id: "pet-001",
      ownerId: "usr-001",
      name: "Boncuk",
      type: "cat",
      breed: "British Shorthair",
      birthDate: "2023-03-10",
      weight: 4.5,
      color: "Gri",
      gender: "female",
      neutered: true,
      image: null,
      vaccinations: [
        { name: "Karma Aşı", date: "2026-03-15", nextDate: "2027-03-15", vet: "Dr. Ahmet" },
        { name: "Kuduz Aşısı", date: "2026-04-20", nextDate: "2027-04-20", vet: "Dr. Ahmet" }
      ],
      medicalHistory: [
        { date: "2026-05-10", type: "Genel Muayene", vet: "Dr. Ahmet", notes: "Genel sağlık durumu iyi." },
        { date: "2026-07-22", type: "Diş Temizliği", vet: "Dr. Elif", notes: "Diş taşı temizliği yapıldı." }
      ]
    }
  ],

  // Randevular
  appointments: [
    {
      id: "rnd-001",
      userId: "usr-001",
      petId: "pet-001",
      serviceId: "genel-muayene",
      vetId: "vet-ahmet",
      date: "2026-09-25",
      time: "14:30",
      status: "confirmed",      // pending | confirmed | completed | cancelled
      notes: "Yıllık kontrol",
      createdAt: "2026-09-15"
    }
  ],

  // Blog Yazıları
  blogPosts: [
    {
      id: "blog-001",
      title: "Kedinizin Beslenmesinde Dikkat Etmeniz Gerekenler",
      slug: "kedi-beslenme-rehberi",
      excerpt: "Kedilerin sağlıklı beslenmesi için dikkat etmeniz gereken 10 önemli nokta...",
      content: "...",           // HTML içerik
      category: "Beslenme",
      image: "blog/kedi-beslenme.jpg",
      author: "Dr. Elif Kaya",
      publishedAt: "2026-09-12",
      readTime: 5
    }
  ],

  // Müşteri Bildirimleri
  notifications: [
    {
      id: "notif-001",
      userId: "usr-001",
      type: "appointment_reminder",
      title: "Randevu Hatırlatması",
      message: "Yarın 14:30'da Boncuk için randevunuz var.",
      read: false,
      createdAt: "2026-09-24"
    }
  ]
};
```

---

## 📐 Responsive Breakpoint'ler

```css
/* Mobile first yaklaşım */
/* Varsayılan: 0px - 639px (Mobil) */

@media (min-width: 640px)  { /* sm: Büyük mobil / Küçük tablet */ }
@media (min-width: 768px)  { /* md: Tablet */ }
@media (min-width: 1024px) { /* lg: Küçük desktop */ }
@media (min-width: 1280px) { /* xl: Desktop */ }
@media (min-width: 1536px) { /* 2xl: Geniş ekran */ }
```

**Mobil öncelikli tasarım kuralları:**
- Hamburger menü (< 1024px)
- Tek sütun grid (< 768px)
- Floating butonlar daha büyük (mobilde)
- Touch-friendly buton boyutları (min 44px)
- Scroll carousel'lar yerine stack (çok küçük ekranlarda)

---

## 🔄 Geliştirme Sıralaması (Fazlar)

### Faz 1: Temel Altyapı + Ana Sayfa
**Hedef:** Kliniklere gösterebileceğin etkileyici ana sayfa

1. `config.js` — Tüm site konfigürasyonu ✅ (tamamlandı)
2. CSS sistemi — variables, reset, base, components, animations
3. `components.js` — Header & Footer inject sistemi
4. `app.js` — Tema uygulama, sayfa init
5. `animations.js` — Scroll animasyonları
6. `index.html` — Tüm 10 bölüm
7. Floating butonlar (WhatsApp, Instagram, Telefon)
8. Tema değiştirici paneli
9. Responsive düzenlemeler
10. Görsel üretimi (hero, hizmetler, ekip, Instagram mock)

### Faz 2: Fonksiyonel Sayfalar
**Hedef:** Randevu alma ve üyelik sistemi çalışır halde

11. `giris.html` + `kayit.html` + `auth.js`
12. `randevu.html` + `randevu.js` (çok adımlı form)
13. `mock-data.js` — Tüm mock veriler
14. `profil/index.html` — Müşteri dashboard
15. `profil/randevularim.html` — Randevu geçmişi
16. `profil/hayvanlarim.html` — Evcil hayvan yönetimi
17. `profil/saglik-karti.html` — Sağlık kartı detay

### Faz 3: İçerik Sayfaları
**Hedef:** Tüm içerik sayfaları hazır

18. `hizmetler.html` + `hizmet-detay.html`
19. `ekibimiz.html`
20. `hakkimizda.html`
21. `blog.html` + `blog-detay.html`
22. `iletisim.html`
23. `kvkk.html`

### Faz 4: Admin Paneli
**Hedef:** Tam kapsamlı klinik yönetim paneli

24. `panel/index.html` — Admin dashboard
25. `panel/randevular.html` — Takvim görünümü
26. `panel/musteriler.html` — Müşteri listesi
27. `panel/hayvanlar.html` — Hayvan kayıtları
28. `panel/blog-yonetimi.html` — Blog CRUD
29. `panel/hizmet-yonetimi.html` — Hizmet CRUD
30. `panel/personel-yonetimi.html` — Personel CRUD
31. `panel/ayarlar.html` — Site ayarları (iletişim, çalışma saatleri, sosyal medya)

### Faz 5: Son Dokunuşlar
32. PWA (manifest.json + service worker)
33. E-bülten aboneliği
34. SEO optimizasyonu (meta tags, structured data)
35. Performance optimizasyonu
36. Cross-browser test
37. README.md — Kurulum & kişiselleştirme rehberi

---

## ✅ Doğrulama Planı

### Her Faz Sonrasında
- [ ] Tüm sayfalar responsive çalışıyor (mobil, tablet, desktop)
- [ ] Tema değişikliği anlık yansıyor
- [ ] Klinik adı değişikliği tüm sayfada yansıyor
- [ ] Animasyonlar düzgün çalışıyor
- [ ] Tıklanabilir her element çalışıyor
- [ ] localStorage verileri doğru kaydediliyor/okunuyor
- [ ] WhatsApp/Instagram/Telefon linkleri doğru açılıyor

### Faz 2 Sonrası Ek
- [ ] Randevu alıp localStorage'da kayıt oluşuyor
- [ ] Giriş/kayıt sistemi çalışıyor
- [ ] Müşteri panelinde randevular listeleniyor
- [ ] Hayvan ekleme/görüntüleme çalışıyor

### Faz 4 Sonrası Ek
- [ ] Admin panelinde randevular listeleniyor
- [ ] Blog CRUD çalışıyor (ekleme, düzenleme, silme)
- [ ] Hizmet CRUD çalışıyor
- [ ] Personel CRUD çalışıyor
- [ ] Müşteri listesi görüntüleniyor
- [ ] Ayarlar sayfasından iletişim/çalışma saatleri güncellenebiliyor
