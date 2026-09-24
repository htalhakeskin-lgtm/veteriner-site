import { Link, useRouteLoaderData } from 'react-router';

import { serverFetch } from '~/lib/api';
import { formatNumber } from '~/lib/format';
import { buildMeta, clinicJsonLd } from '~/lib/seo';
import type { Service, SiteSettings, StaffMember, Testimonial } from '~/lib/types';
import {
  Card,
  Chip,
  Icon,
  IconFrame,
  LinkButton,
  SectionHead,
} from '~/components/ui';
import { CountUp } from '~/components/sections/count-up';
import { Quotes } from '~/components/sections/quotes';
import type { Route } from './+types/home';

export function meta({ data }: Route.MetaArgs) {
  const s = data?.settings;
  return buildMeta({
    title: s
      ? `${s.clinic.name} — ${s.clinic.slogan}`
      : 'Veteriner Kliniği — Online Randevu',
    description:
      s?.seo.metaDescription ??
      'Modern veteriner hizmetleri, online randevu ve 7/24 acil müdahale.',
    path: '/',
  });
}

export async function loader() {
  // Paralel çekiyoruz: sırayla beklemek ilk boyamayi gereksiz geciktirir.
  const [settings, services, staff, testimonials, rating] = await Promise.all([
    serverFetch<SiteSettings>('/settings').catch(() => null),
    serverFetch<Service[]>('/services?featured=true').catch(() => []),
    serverFetch<StaffMember[]>('/staff').catch(() => []),
    serverFetch<Testimonial[]>('/testimonials?limit=5').catch(() => []),
    serverFetch<{ ratingValue: number; reviewCount: number } | null>(
      '/testimonials/rating',
    ).catch(() => null),
  ]);

  return { settings, services, staff, testimonials, rating };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { settings, services, staff, testimonials, rating } = loaderData;
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const s = settings ?? root?.settings ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: clinicJsonLd(s, rating) }}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-14 md:py-26">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[30%] -right-[10%] h-[60vw] max-h-[760px] w-[60vw] max-w-[760px] rounded-full opacity-85"
          style={{
            background:
              'radial-gradient(circle, var(--color-tint) 0%, transparent 68%)',
          }}
        />

        <div className="wrap relative grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-24">
          <div>
            <span data-reveal="fade">
              <Chip>
                <Icon name="shield" size={15} />
                {s ? `${s.clinic.experienceYears} yıldır aynı mahallede` : 'Güvenilir bakım'}
              </Chip>
            </span>

            <h1
              className="mt-6 text-[clamp(2.6rem,6vw,4.4rem)]"
              data-reveal
              style={{ '--delay': '80ms' } as React.CSSProperties}
            >
              Dostunuz için
              <br />
              sakin, <em className="text-brand italic">özenli</em>
              <br />
              bir klinik.
            </h1>

            <p
              className="mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-muted"
              data-reveal
              style={{ '--delay': '160ms' } as React.CSSProperties}
            >
              Acele ettirilmeyen muayeneler, her adımı açıkça anlatılan tedaviler ve
              kapıdan girdiği andan itibaren korkmayan hayvanlar. Randevunuzu iki
              dakikada online alın.
            </p>

            <div
              className="mt-12 flex flex-wrap gap-3"
              data-reveal
              style={{ '--delay': '240ms' } as React.CSSProperties}
            >
              <LinkButton to="/randevu">
                Randevu Al <Icon name="arrow" size={17} />
              </LinkButton>
              <LinkButton to="/hizmetler" variant="ghost">
                Hizmetleri Gör
              </LinkButton>
            </div>

            {s && (
              <div
                className="mt-16 grid grid-cols-3 gap-4 border-t border-line pt-8"
                data-reveal
                style={{ '--delay': '320ms' } as React.CSSProperties}
              >
                <Stat
                  value={<CountUp to={s.clinic.totalPatients} suffix="+" />}
                  label="Bakılan hasta"
                />
                <Stat
                  value={<CountUp to={s.clinic.experienceYears} suffix=" yıl" />}
                  label="Klinik deneyimi"
                />
                <Stat
                  value={
                    <CountUp
                      to={rating?.ratingValue ?? s.clinic.satisfactionRate}
                      decimals={1}
                      suffix="/5"
                    />
                  }
                  label="Google puanı"
                />
              </div>
            )}
          </div>

          <div
            className="relative"
            data-reveal="right"
            style={{ '--delay': '200ms' } as React.CSSProperties}
          >
            <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-tint shadow-2xl lg:aspect-5/6">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
                alt="Muayene sırasında bir veteriner hekim ve köpek"
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-soft hover:scale-103"
                loading="eager"
                width={900}
                height={1125}
              />
            </div>

            <div className="absolute bottom-9 -left-4 flex items-center gap-3 rounded-md border border-line bg-surface px-4.5 py-3.5 shadow-xl sm:-left-8">
              <IconFrame name="check" size={38} />
              <span>
                <span className="block text-sm leading-tight font-medium">
                  Randevunuz onaylandı
                </span>
                <span className="block text-xs text-ink-muted">
                  Cuma 14:30 · {staff[0]?.fullName ?? 'Dr. Elif Kaya'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── GİVEN ŞERİDİ ── */}
      <div className="border-y border-line bg-surface-2 py-8">
        <div
          className="wrap flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[0.8125rem] tracking-[0.08em] text-ink-faint uppercase"
          data-reveal="fade"
        >
          {[
            { icon: 'clock', label: '7/24 acil' },
            { icon: 'scan', label: 'Dijital röntgen' },
            { icon: 'flask', label: 'Yerinde laboratuvar' },
            { icon: 'heart', label: 'Yoğun bakım' },
            { icon: 'cpu', label: 'Mikroçip kaydı' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2.5">
              <Icon name={item.icon} size={15} className="text-brand" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── HİZMETLER ── */}
      <section className="py-18 md:py-32" id="hizmetler">
        <div className="wrap">
          <SectionHead
            eyebrow="Hizmetler"
            title="Tek çatı altında, baştan sona bakım"
            lede="Rutin kontrolden acil cerrahiye kadar her şey aynı binada. Hayvanınız tanımadığı bir yere sevk edilmiyor."
            action={
              <LinkButton to="/hizmetler" variant="ghost" size="sm">
                Tüm hizmetler <Icon name="arrow" size={15} />
              </LinkButton>
            }
          />

          {/* 1px gap + arka plan = ince ayirac cizgileri */}
          <div
            className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
            data-reveal
          >
            {services.slice(0, 6).map((service) => (
              <Link
                key={service.id}
                to={`/hizmetler/${service.slug}`}
                className="group flex flex-col gap-3.5 bg-surface p-8 transition-colors duration-500 ease-soft hover:bg-surface-2"
              >
                <IconFrame
                  name={service.icon ?? 'stethoscope'}
                  className="transition-colors duration-500 group-hover:bg-brand group-hover:text-brand-contrast"
                />
                <h3 className="font-sans text-[1.0625rem] font-semibold tracking-tight">
                  {service.title}
                </h3>
                <p className="flex-1 text-[0.9rem] leading-relaxed text-ink-muted">
                  {service.shortDesc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand opacity-0 transition-all duration-400 ease-soft group-hover:opacity-100 max-md:opacity-100">
                  Detay <Icon name="arrow" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SÜREÇ ── */}
      <section className="bg-deep py-18 text-deep-ink md:py-32">
        <div className="wrap">
          <div className="max-w-[60ch]">
            <span className="eyebrow mb-4 text-deep-muted" data-reveal="fade">
              <span className="h-px w-6 bg-brand" />
              Online Randevu
            </span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] text-deep-ink" data-reveal>
              Üç adım, iki dakika
            </h2>
            <p
              className="mt-5 text-[1.0625rem] leading-relaxed text-deep-muted"
              data-reveal
              style={{ '--delay': '80ms' } as React.CSSProperties}
            >
              Telefonda sıra beklemeye gerek yok. Müsait saatleri canlı görüp
              seçiyorsunuz; onay WhatsApp'tan geliyor.
            </p>
          </div>

          <div
            className="mt-12 grid gap-px overflow-hidden rounded-lg border border-deep-line bg-deep-line md:grid-cols-3"
            data-reveal
          >
            {[
              {
                n: '01',
                t: 'Hizmeti seçin',
                d: 'Muayene mi, aşı mı, kontrol mü — seçtiğiniz hizmete göre ne kadar süre ayrılacağını sistem kendisi hesaplıyor.',
              },
              {
                n: '02',
                t: 'Saatinizi belirleyin',
                d: 'Takvimde yalnızca gerçekten boş olan saatler görünür. Dilerseniz hekiminizi de seçebilirsiniz.',
              },
              {
                n: '03',
                t: 'Onayı alın',
                d: 'Randevu kodunuz anında oluşur. Bir gün önce hatırlatma mesajı gönderilir.',
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col gap-3 bg-deep px-8 py-12">
                <span className="font-display text-sm tracking-[0.1em] text-brand">
                  {step.n}
                </span>
                <h3 className="font-sans text-lg font-semibold text-deep-ink">
                  {step.t}
                </h3>
                <p className="text-[0.9rem] leading-relaxed text-deep-muted">{step.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3" data-reveal="fade">
            <LinkButton to="/randevu">
              Randevu Al <Icon name="arrow" size={17} />
            </LinkButton>
            <LinkButton
              to="/randevu-sorgula"
              variant="ghost"
              className="border-deep-line bg-transparent text-deep-ink hover:border-brand hover:text-brand"
            >
              Randevu Sorgula
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ── EKİP ── */}
      {staff.length > 0 && (
        <section className="py-18 md:py-32">
          <div className="wrap">
            <SectionHead
              eyebrow="Ekibimiz"
              title="Hayvanınızı tanıyan hekimler"
              lede="Her ziyarette aynı hekime gelebilirsiniz — dosyanızı baştan anlatmak zorunda kalmazsınız."
            />
            <div className="grid gap-6 md:grid-cols-3" data-stagger>
              {staff.slice(0, 3).map((member) => (
                <Card key={member.id} hover className="overflow-hidden" data-reveal>
                  <Link to={`/ekibimiz#${member.slug}`}>
                    <div className="aspect-3/4 overflow-hidden bg-tint">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.fullName}
                          loading="lazy"
                          className="h-full w-full object-cover saturate-92 transition-all duration-[1100ms] ease-soft hover:scale-104 hover:saturate-100"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-brand">
                          <Icon name="user" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-sans text-[1.0625rem] font-semibold">
                        {member.fullName}
                      </h3>
                      <p className="mt-1 text-[0.8125rem] font-medium text-brand">
                        {member.speciality ?? member.title}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                        {member.bio}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── YORUMLAR ── */}
      {testimonials.length > 0 && (
        <section className="border-y border-line bg-surface-2 py-18 md:py-32">
          <Quotes items={testimonials} />
        </section>
      )}

      {/* ── İLETİŞİM ── */}
      {s && (
        <section className="py-18 md:py-32">
          <div className="wrap grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-24">
            <div>
              <span className="eyebrow mb-4" data-reveal="fade">
                <span className="h-px w-6 bg-brand opacity-60" />
                İletişim
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)]" data-reveal>
                Bize ulaşın
              </h2>

              <ul className="mt-8 grid gap-4" data-reveal>
                <InfoRow icon="pin" label="Adres" value={s.contact.address.full} />
                <InfoRow
                  icon="phone"
                  label="Telefon"
                  value={s.contact.phone}
                  href={`tel:${s.contact.phoneRaw}`}
                />
                <InfoRow
                  icon="mail"
                  label="E-posta"
                  value={s.contact.email}
                  href={`mailto:${s.contact.email}`}
                />
              </ul>

              <div className="mt-8 overflow-hidden rounded-md border border-line bg-surface" data-reveal>
                <HoursRow label="Pazartesi – Cuma" value={`${s.workingHours.weekdays.open} – ${s.workingHours.weekdays.close}`} />
                <HoursRow label="Cumartesi" value={`${s.workingHours.saturday.open} – ${s.workingHours.saturday.close}`} />
                <HoursRow label="Pazar" value="Kapalı" muted />
                {s.workingHours.emergency && <HoursRow label="Acil hat" value="7/24" last />}
              </div>
            </div>

            <div
              className="grid min-h-80 place-items-center rounded-lg border border-line bg-tint p-8 text-center text-sm text-ink-faint"
              data-reveal="right"
            >
              {s.seo.googleMapsEmbedUrl ? (
                <iframe
                  src={s.seo.googleMapsEmbedUrl}
                  title="Klinik konumu"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full min-h-80 w-full rounded-lg border-0"
                />
              ) : (
                <span>
                  <Icon name="pin" size={26} className="mx-auto mb-3" />
                  <br />
                  Google Haritalar bağlantısı ayarlardan eklenebilir
                </span>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-display text-[clamp(1.6rem,3.4vw,2.1rem)] leading-none font-semibold tracking-tight">
        {value}
      </div>
      <div className="mt-1.5 text-[0.8125rem] text-ink-muted">{label}</div>
    </div>
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
  const content = (
    <>
      <IconFrame name={icon} size={38} />
      <span>
        <span className="block text-xs tracking-[0.06em] text-ink-faint uppercase">
          {label}
        </span>
        <span className="mt-0.5 block text-[0.9375rem] font-medium">{value}</span>
      </span>
    </>
  );

  return (
    <li className="flex items-start gap-3.5">
      {href ? (
        <a href={href} className="flex items-start gap-3.5 transition-colors hover:text-brand">
          {content}
        </a>
      ) : (
        content
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
      <span
        className={`font-medium tabular-nums ${muted ? 'text-ink-faint' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

export { formatNumber };
