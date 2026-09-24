import {
  index,
  layout,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

export default [
  // ── Tanıtım sayfaları (prerender edilir, SEO önemli) ──
  layout('routes/_public/layout.tsx', [
    index('routes/_public/home.tsx'),
    route('hizmetler', 'routes/_public/services.tsx'),
    route('hizmetler/:slug', 'routes/_public/service-detail.tsx'),
    route('ekibimiz', 'routes/_public/team.tsx'),
    route('hakkimizda', 'routes/_public/about.tsx'),
    route('blog', 'routes/_public/blog.tsx'),
    route('blog/:slug', 'routes/_public/blog-detail.tsx'),
    route('iletisim', 'routes/_public/contact.tsx'),
    route('kvkk', 'routes/_public/kvkk.tsx'),
    route('randevu', 'routes/randevu/wizard.tsx'),
    route('randevu-sorgula', 'routes/randevu/lookup.tsx'),
  ]),

  // ── Kimlik doğrulama (kendi sade düzeni) ──
  layout('routes/auth/layout.tsx', [
    route('giris', 'routes/auth/login.tsx'),
    route('kayit', 'routes/auth/register.tsx'),
    route('sifremi-unuttum', 'routes/auth/forgot-password.tsx'),
    route('sifre-sifirla', 'routes/auth/reset-password.tsx'),
  ]),

  // ── Müşteri paneli (korumalı) ──
  layout('routes/hesap/layout.tsx', [
    route('hesap', 'routes/hesap/dashboard.tsx'),
    route('hesap/randevularim', 'routes/hesap/appointments.tsx'),
    route('hesap/hayvanlarim', 'routes/hesap/pets.tsx'),
    route('hesap/hayvanlarim/:id', 'routes/hesap/pet-detail.tsx'),
    route('hesap/bildirimler', 'routes/hesap/notifications.tsx'),
    route('hesap/ayarlar', 'routes/hesap/settings.tsx'),
  ]),

  // ── Yönetim paneli (korumalı, ADMIN/STAFF) ──
  layout('routes/panel/layout.tsx', [
    route('panel', 'routes/panel/dashboard.tsx'),
    route('panel/randevular', 'routes/panel/appointments.tsx'),
    route('panel/musteriler', 'routes/panel/customers.tsx'),
    route('panel/hastalar', 'routes/panel/pets.tsx'),
    route('panel/hizmetler', 'routes/panel/services.tsx'),
    route('panel/personel', 'routes/panel/staff.tsx'),
    route('panel/blog', 'routes/panel/blog.tsx'),
    route('panel/yorumlar', 'routes/panel/testimonials.tsx'),
    route('panel/mesajlar', 'routes/panel/messages.tsx'),
    route('panel/ayarlar', 'routes/panel/settings.tsx'),
  ]),

  // SEO dosyaları — kaynak olarak sunulur
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('robots.txt', 'routes/robots[.]txt.ts'),
] satisfies RouteConfig;
