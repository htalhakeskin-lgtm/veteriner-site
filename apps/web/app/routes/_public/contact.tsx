import { useState } from 'react';
import { useRouteLoaderData } from 'react-router';

import { ApiError, api } from '~/lib/api';
import { whatsappLink } from '~/lib/format';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { SiteSettings } from '~/lib/types';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Icon,
  IconFrame,
  Input,
  SuccessNote,
  Textarea,
} from '~/components/ui';
import { PageHero } from '~/components/sections/page-hero';

export function meta() {
  return buildMeta({
    title: 'İletişim — Adres, Telefon ve Çalışma Saatleri',
    description:
      'Kliniğimize nasıl ulaşırsınız? Adres, telefon, WhatsApp ve çalışma saatleri. İletişim formundan da yazabilirsiniz.',
    path: '/iletisim',
  });
}

export default function Contact() {
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const s = root?.settings ?? null;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: '', // honeypot
  });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        website: form.website || undefined,
      };
      await api.post('/contact', payload);
      setState('done');
    } catch (err) {
      setState('idle');
      setError(
        err instanceof ApiError
          ? err.message
          : 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
      );
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'İletişim', path: '/iletisim' },
          ]),
        }}
      />

      <PageHero
        eyebrow="İletişim"
        title="Bize ulaşın"
        lede="Acil durumlarda lütfen telefonla arayın — form mesajlarını mesai saatlerinde yanıtlıyoruz."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* ── Bilgiler ── */}
          <div data-reveal>
            <ul className="grid gap-4">
              {s?.contact.address && (
                <InfoRow icon="pin" label="Adres" value={s.contact.address.full} />
              )}
              {s?.contact.phone && (
                <InfoRow
                  icon="phone"
                  label="Telefon"
                  value={s.contact.phone}
                  href={`tel:${s.contact.phoneRaw}`}
                />
              )}
              {s?.contact.email && (
                <InfoRow
                  icon="mail"
                  label="E-posta"
                  value={s.contact.email}
                  href={`mailto:${s.contact.email}`}
                />
              )}
              {s?.workingHours.emergency && (
                <InfoRow
                  icon="clock"
                  label="Acil hat (7/24)"
                  value={s.workingHours.emergencyPhone}
                  href={`tel:${s.workingHours.emergencyPhone.replace(/\s/g, '')}`}
                />
              )}
            </ul>

            {s && (
              <div className="mt-8 overflow-hidden rounded-md border border-line bg-surface">
                <HoursRow
                  label="Pazartesi – Cuma"
                  value={`${s.workingHours.weekdays.open} – ${s.workingHours.weekdays.close}`}
                />
                <HoursRow
                  label="Cumartesi"
                  value={`${s.workingHours.saturday.open} – ${s.workingHours.saturday.close}`}
                />
                <HoursRow label="Pazar" value="Kapalı" muted last />
              </div>
            )}

            {s?.contact.whatsapp && (
              <a
                href={whatsappLink(s.contact.whatsapp, s.contact.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-brand px-6.5 py-3.5 text-[0.9375rem] font-medium text-brand-contrast transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                <Icon name="chat" size={17} /> WhatsApp'tan yazın
              </a>
            )}
          </div>

          {/* ── Form ── */}
          <Card className="p-8 md:p-10" data-reveal="right">
            {state === 'done' ? (
              <div className="grid place-items-center gap-4 py-10 text-center">
                <IconFrame name="check" size={56} />
                <h2 className="font-sans text-xl font-semibold">Mesajınız alındı</h2>
                <p className="max-w-[40ch] text-ink-muted">
                  En kısa sürede dönüş yapacağız. Acil bir durumsa lütfen
                  telefonla arayın.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5">
                <h2 className="font-sans text-xl font-semibold">Mesaj gönderin</h2>

                {error && <ErrorNote>{error}</ErrorNote>}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Adınız" required htmlFor="ad">
                    <Input
                      id="ad"
                      required
                      minLength={2}
                      maxLength={120}
                      value={form.name}
                      onChange={update('name')}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="E-posta" required htmlFor="eposta">
                    <Input
                      id="eposta"
                      type="email"
                      required
                      value={form.email}
                      onChange={update('email')}
                      autoComplete="email"
                    />
                  </Field>
                </div>

                <Field label="Telefon" htmlFor="tel" hint="İsteğe bağlı">
                  <Input
                    id="tel"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="0532 000 00 00"
                    autoComplete="tel"
                  />
                </Field>

                <Field label="Konu" required htmlFor="konu">
                  <Input
                    id="konu"
                    required
                    minLength={3}
                    maxLength={150}
                    value={form.subject}
                    onChange={update('subject')}
                  />
                </Field>

                <Field label="Mesajınız" required htmlFor="mesaj">
                  <Textarea
                    id="mesaj"
                    required
                    minLength={10}
                    maxLength={2000}
                    value={form.message}
                    onChange={update('message')}
                  />
                </Field>

                {/*
                  Honeypot: gerçek kullanıcı görmez, bot doldurur.
                  Sunucu dolu geldiğinde mesajı sessizce atar.
                */}
                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Bu alanı boş bırakın</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={update('website')}
                  />
                </div>

                <Button type="submit" loading={state === 'sending'} className="justify-self-start">
                  Gönder <Icon name="arrow" size={17} />
                </Button>

                <p className="text-xs leading-relaxed text-ink-faint">
                  Gönderdiğiniz bilgiler yalnızca size dönüş yapmak için kullanılır.{' '}
                  <a href="/kvkk" className="text-brand underline underline-offset-2">
                    KVKK aydınlatma metni
                  </a>
                </p>
              </form>
            )}
          </Card>
        </div>

        {/* ── Harita ── */}
        {s?.seo.googleMapsEmbedUrl && (
          <div className="wrap mt-16" data-reveal>
            <iframe
              src={s.seo.googleMapsEmbedUrl}
              title="Klinik konumu"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-96 w-full rounded-lg border border-line"
            />
          </div>
        )}
      </section>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <IconFrame name={icon} size={42} />
      <span>
        <span className="block text-xs tracking-[0.06em] text-ink-faint uppercase">
          {label}
        </span>
        <span className="mt-0.5 block font-medium">{value}</span>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} className="flex items-start gap-4 transition-colors hover:text-brand">
          {body}
        </a>
      ) : (
        <span className="flex items-start gap-4">{body}</span>
      )}
    </li>
  );
}

function HoursRow({
  label,
  value,
  muted,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 px-4.5 py-3.5 text-sm ${last ? '' : 'border-b border-line-soft'}`}
    >
      <span className="text-ink-muted">{label}</span>
      <span className={`font-medium tabular-nums ${muted ? 'text-ink-faint' : ''}`}>
        {value}
      </span>
    </div>
  );
}
