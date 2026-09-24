import { useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { buildMeta } from '~/lib/seo';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Icon,
  Input,
  Select,
  Skeleton,
  SuccessNote,
  Textarea,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Site Ayarları — Yönetim',
    description: 'Klinik bilgileri, tema ve randevu kuralları.',
    path: '/panel/ayarlar',
    noindex: true,
  });
}

/** Sunucudaki SiteSetting JSON kolonlarının tamamı. */
interface FullSettings {
  clinic: Record<string, unknown>;
  contact: Record<string, unknown>;
  workingHours: Record<string, unknown>;
  theme: Record<string, unknown>;
  features: Record<string, boolean>;
  appointmentRules: Record<string, unknown>;
  seo: Record<string, unknown>;
  socialLinks: Record<string, unknown>;
  googlePlaceId: string | null;
}

const THEMES = [
  { id: 'adacayi', label: 'Adaçayı', color: '#5A7D6A' },
  { id: 'okyanus', label: 'Okyanus', color: '#2C6E9B' },
  { id: 'lavanta', label: 'Lavanta', color: '#7A6BA8' },
  { id: 'kurumsal', label: 'Kurumsal', color: '#1F3A5F' },
  { id: 'toprak', label: 'Toprak', color: '#B0765A' },
  { id: 'gece', label: 'Gece', color: '#7FB3A5' },
];

const FEATURE_LABELS: Record<string, string> = {
  showEmergencyBanner: 'Acil hizmet bandını göster',
  showBlogSection: 'Blog bölümünü göster',
  showTestimonials: 'Müşteri yorumlarını göster',
  showInstagramFeed: 'Instagram akışını göster',
  showLiveStats: 'Canlı istatistikleri göster',
  enableOnlineBooking: 'Online randevuyu aç',
  enableRegistration: 'Yeni üye kaydına izin ver',
  demoMode: 'Demo modu (tema değiştirici görünür)',
};

type Tab = 'clinic' | 'contact' | 'hours' | 'appointment' | 'theme' | 'seo';

export default function AdminSettings() {
  const [data, setData] = useState<FullSettings | null>(null);
  const [tab, setTab] = useState<Tab>('clinic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<FullSettings>('/admin/settings')
      .then(setData)
      .catch(() => setData(null));
  }, []);

  /** Ic içe JSON alanını günceller: patch('clinic', 'name', 'Yeni Ad') */
  function patch(section: keyof FullSettings, key: string, value: unknown) {
    setData((d) =>
      d
        ? {
            ...d,
            [section]: { ...(d[section] as Record<string, unknown>), [key]: value },
          }
        : d,
    );
  }

  function patchNested(
    section: keyof FullSettings,
    outer: string,
    key: string,
    value: unknown,
  ) {
    setData((d) => {
      if (!d) return d;
      const sec = d[section] as Record<string, unknown>;
      const inner = (sec[outer] ?? {}) as Record<string, unknown>;
      return { ...d, [section]: { ...sec, [outer]: { ...inner, [key]: value } } };
    });
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/admin/settings', data);
      setSuccess(
        'Ayarlar kaydedildi. Değişiklikler siteye en geç bir dakika içinde yansır.',
      );
      // Tema seçimi hemen görülsün.
      const preset = (data.theme as { activePreset?: string }).activePreset;
      if (preset) document.documentElement.setAttribute('data-theme', preset);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <>
        <PanelHeader title="Site ayarları" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const clinic = data.clinic as Record<string, string | number>;
  const contact = data.contact as Record<string, unknown>;
  const address = (contact.address ?? {}) as Record<string, unknown>;
  const hours = data.workingHours as Record<string, unknown>;
  const rules = data.appointmentRules as Record<string, unknown>;
  const seo = data.seo as Record<string, unknown>;
  const social = data.socialLinks as Record<string, unknown>;
  const theme = data.theme as Record<string, unknown>;

  return (
    <>
      <PanelHeader
        title="Site ayarları"
        description="Buradaki bilgiler sitenin her yerinde kullanılır. Kod değiştirmenize gerek yok."
        action={
          <Button size="sm" loading={saving} onClick={() => void save()}>
            <Icon name="check" size={15} /> Kaydet
          </Button>
        }
      />

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {success && (
        <div className="mb-5">
          <SuccessNote>{success}</SuccessNote>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['clinic', 'Klinik'],
            ['contact', 'İletişim'],
            ['hours', 'Çalışma saatleri'],
            ['appointment', 'Randevu kuralları'],
            ['theme', 'Tema ve bölümler'],
            ['seo', 'Arama motoru'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            aria-pressed={tab === v}
            className={cx(
              'rounded-full border px-4.5 py-2 text-sm transition-all duration-300',
              tab === v
                ? 'border-brand bg-brand text-brand-contrast'
                : 'border-line text-ink-muted hover:border-brand hover:text-brand',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="p-6 md:p-8">
        {tab === 'clinic' && (
          <div className="grid gap-5">
            <Field label="Klinik adı" htmlFor="name" hint="Sitenin her yerinde görünür">
              <Input
                id="name"
                value={String(clinic.name ?? '')}
                onChange={(e) => patch('clinic', 'name', e.target.value)}
              />
            </Field>
            <Field label="Slogan" htmlFor="slogan">
              <Input
                id="slogan"
                value={String(clinic.slogan ?? '')}
                onChange={(e) => patch('clinic', 'slogan', e.target.value)}
              />
            </Field>
            <Field label="Açıklama" htmlFor="desc">
              <Textarea
                id="desc"
                value={String(clinic.description ?? '')}
                onChange={(e) => patch('clinic', 'description', e.target.value)}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Kuruluş yılı" htmlFor="founded">
                <Input
                  id="founded"
                  type="number"
                  value={String(clinic.foundedYear ?? '')}
                  onChange={(e) =>
                    patch('clinic', 'foundedYear', Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Bakılan hasta" htmlFor="patients">
                <Input
                  id="patients"
                  type="number"
                  value={String(clinic.totalPatients ?? '')}
                  onChange={(e) =>
                    patch('clinic', 'totalPatients', Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Deneyim (yıl)" htmlFor="exp">
                <Input
                  id="exp"
                  type="number"
                  value={String(clinic.experienceYears ?? '')}
                  onChange={(e) =>
                    patch('clinic', 'experienceYears', Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Telefon" htmlFor="phone">
                <Input
                  id="phone"
                  value={String(contact.phone ?? '')}
                  onChange={(e) => patch('contact', 'phone', e.target.value)}
                />
              </Field>
              <Field
                label="Telefon (ham)"
                htmlFor="phoneRaw"
                hint="Arama bağlantısı için: +902620000000"
              >
                <Input
                  id="phoneRaw"
                  value={String(contact.phoneRaw ?? '')}
                  onChange={(e) => patch('contact', 'phoneRaw', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="WhatsApp numarası" htmlFor="wa">
                <Input
                  id="wa"
                  value={String(contact.whatsapp ?? '')}
                  onChange={(e) => patch('contact', 'whatsapp', e.target.value)}
                />
              </Field>
              <Field label="E-posta" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={String(contact.email ?? '')}
                  onChange={(e) => patch('contact', 'email', e.target.value)}
                />
              </Field>
            </div>
            <Field label="WhatsApp hazır mesajı" htmlFor="waMsg">
              <Input
                id="waMsg"
                value={String(contact.whatsappMessage ?? '')}
                onChange={(e) => patch('contact', 'whatsappMessage', e.target.value)}
              />
            </Field>
            <Field label="Adres" htmlFor="addr">
              <Textarea
                id="addr"
                className="min-h-20"
                value={String(address.full ?? '')}
                onChange={(e) => patchNested('contact', 'address', 'full', e.target.value)}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="İlçe" htmlFor="district">
                <Input
                  id="district"
                  value={String(address.district ?? '')}
                  onChange={(e) =>
                    patchNested('contact', 'address', 'district', e.target.value)
                  }
                />
              </Field>
              <Field label="Şehir" htmlFor="city">
                <Input
                  id="city"
                  value={String(address.city ?? '')}
                  onChange={(e) =>
                    patchNested('contact', 'address', 'city', e.target.value)
                  }
                />
              </Field>
            </div>
            <Field label="Instagram adresi" htmlFor="ig">
              <Input
                id="ig"
                type="url"
                placeholder="https://instagram.com/…"
                value={String(social.instagram ?? '')}
                onChange={(e) => patch('socialLinks', 'instagram', e.target.value)}
              />
            </Field>
          </div>
        )}

        {tab === 'hours' && (
          <div className="grid gap-5">
            <p className="text-sm text-ink-muted">
              Bu saatler sitede gösterilir. Randevu saatlerini{' '}
              <strong className="font-medium text-ink">Personel</strong> sayfasındaki
              çalışma takvimi belirler.
            </p>
            {(['weekdays', 'saturday'] as const).map((key) => {
              const label = key === 'weekdays' ? 'Hafta içi' : 'Cumartesi';
              const val = (hours[key] ?? {}) as Record<string, string>;
              return (
                <div key={key} className="grid gap-5 sm:grid-cols-2">
                  <Field label={`${label} açılış`} htmlFor={`${key}-open`}>
                    <Input
                      id={`${key}-open`}
                      type="time"
                      value={val.open ?? ''}
                      onChange={(e) =>
                        patchNested('workingHours', key, 'open', e.target.value)
                      }
                    />
                  </Field>
                  <Field label={`${label} kapanış`} htmlFor={`${key}-close`}>
                    <Input
                      id={`${key}-close`}
                      type="time"
                      value={val.close ?? ''}
                      onChange={(e) =>
                        patchNested('workingHours', key, 'close', e.target.value)
                      }
                    />
                  </Field>
                </div>
              );
            })}
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={Boolean(hours.emergency)}
                onChange={(e) => patch('workingHours', 'emergency', e.target.checked)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              7/24 acil hizmet var
            </label>
            {Boolean(hours.emergency) && (
              <Field label="Acil hat numarası" htmlFor="emergencyPhone">
                <Input
                  id="emergencyPhone"
                  value={String(hours.emergencyPhone ?? '')}
                  onChange={(e) =>
                    patch('workingHours', 'emergencyPhone', e.target.value)
                  }
                />
              </Field>
            )}
          </div>
        )}

        {tab === 'appointment' && (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Slot aralığı (dakika)"
                htmlFor="slot"
                hint="Randevu saatleri bu adımla üretilir"
              >
                <Input
                  id="slot"
                  type="number"
                  min="5"
                  step="5"
                  value={String(rules.slotDurationMinutes ?? 30)}
                  onChange={(e) =>
                    patch('appointmentRules', 'slotDurationMinutes', Number(e.target.value))
                  }
                />
              </Field>
              <Field
                label="Hazırlık payı (saat)"
                htmlFor="lead"
                hint="Bu süreden yakın randevu alınamaz"
              >
                <Input
                  id="lead"
                  type="number"
                  min="0"
                  value={String(rules.leadTimeHours ?? 2)}
                  onChange={(e) =>
                    patch('appointmentRules', 'leadTimeHours', Number(e.target.value))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Kaç gün ileriye randevu"
                htmlFor="advance"
              >
                <Input
                  id="advance"
                  type="number"
                  min="1"
                  value={String(rules.daysInAdvance ?? 30)}
                  onChange={(e) =>
                    patch('appointmentRules', 'daysInAdvance', Number(e.target.value))
                  }
                />
              </Field>
              <Field
                label="İptal süresi (saat)"
                htmlFor="cancel"
                hint="Müşteri bu süreden sonra iptal edemez"
              >
                <Input
                  id="cancel"
                  type="number"
                  min="0"
                  value={String(rules.cancelBeforeHours ?? 24)}
                  onChange={(e) =>
                    patch('appointmentRules', 'cancelBeforeHours', Number(e.target.value))
                  }
                />
              </Field>
            </div>
            <Field
              label="Günlük azami randevu"
              htmlFor="maxDaily"
              hint="0 yazarsanız sınır olmaz"
            >
              <Input
                id="maxDaily"
                type="number"
                min="0"
                value={String(rules.maxDailySlots ?? 0)}
                onChange={(e) =>
                  patch('appointmentRules', 'maxDailySlots', Number(e.target.value))
                }
              />
            </Field>
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={Boolean(rules.autoConfirm)}
                onChange={(e) =>
                  patch('appointmentRules', 'autoConfirm', e.target.checked)
                }
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Randevuları otomatik onayla (admin onayı gerekmesin)
            </label>
          </div>
        )}

        {tab === 'theme' && (
          <div className="grid gap-8">
            <div>
              <h3 className="text-xs font-medium tracking-wider text-ink-faint uppercase">
                Renk teması
              </h3>
              <p className="mt-1.5 text-sm text-ink-muted">
                Seçtiğiniz tema tüm ziyaretçiler için geçerli olur.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch('theme', 'activePreset', t.id)}
                    aria-pressed={theme.activePreset === t.id}
                    className={cx(
                      'grid justify-items-center gap-2 rounded-md border px-2 py-3 text-xs transition-all duration-300',
                      theme.activePreset === t.id
                        ? 'border-brand bg-tint font-medium text-brand'
                        : 'border-line text-ink-muted hover:border-brand',
                    )}
                  >
                    <span
                      className="block h-7 w-7 rounded-full border border-black/10"
                      style={{ background: t.color }}
                    />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium tracking-wider text-ink-faint uppercase">
                Kaydırma hızı
              </h3>
              <p className="mt-1.5 text-sm text-ink-muted">
                1 en yavaş, 10 en hızlı. Varsayılan 4.
              </p>
              <input
                type="range"
                min="1"
                max="10"
                value={Number(theme.scrollSpeed ?? 4)}
                onChange={(e) => patch('theme', 'scrollSpeed', Number(e.target.value))}
                className="mt-4 w-full max-w-sm accent-[var(--color-brand)]"
              />
              <span className="ml-3 text-sm text-brand tabular-nums">
                {Number(theme.scrollSpeed ?? 4)}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-medium tracking-wider text-ink-faint uppercase">
                Bölümler
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(data.features[key])}
                      onChange={(e) => patch('features', key, e.target.checked)}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'seo' && (
          <div className="grid gap-5">
            <Field label="Site başlığı" htmlFor="metaTitle" hint="En fazla 60 karakter">
              <Input
                id="metaTitle"
                maxLength={70}
                value={String(seo.metaTitle ?? '')}
                onChange={(e) => patch('seo', 'metaTitle', e.target.value)}
              />
            </Field>
            <Field
              label="Site açıklaması"
              htmlFor="metaDesc"
              hint="Google arama sonucunda görünür, en fazla 160 karakter"
            >
              <Textarea
                id="metaDesc"
                maxLength={160}
                className="min-h-20"
                value={String(seo.metaDescription ?? '')}
                onChange={(e) => patch('seo', 'metaDescription', e.target.value)}
              />
            </Field>
            <Field
              label="Google Haritalar gömme adresi"
              htmlFor="maps"
              hint="Haritada Paylaş › Harita yerleştir › src adresi"
            >
              <Input
                id="maps"
                type="url"
                value={String(seo.googleMapsEmbedUrl ?? '')}
                onChange={(e) => patch('seo', 'googleMapsEmbedUrl', e.target.value)}
              />
            </Field>
            <Field
              label="Google Place ID"
              htmlFor="placeId"
              hint="Google yorumlarını çekmek için. Boşsa manuel yorumlar gösterilir."
            >
              <Input
                id="placeId"
                value={data.googlePlaceId ?? ''}
                onChange={(e) =>
                  setData((d) => (d ? { ...d, googlePlaceId: e.target.value } : d))
                }
              />
            </Field>
          </div>
        )}

        <div className="mt-8 border-t border-line pt-6">
          <Button loading={saving} onClick={() => void save()}>
            <Icon name="check" size={17} /> Ayarları Kaydet
          </Button>
        </div>
      </Card>
    </>
  );
}
