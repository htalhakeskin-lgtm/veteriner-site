import { useRouteLoaderData } from 'react-router';

import { serverFetch } from '~/lib/api';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { SiteSettings, Testimonial } from '~/lib/types';
import { Card, Icon, IconFrame, LinkButton } from '~/components/ui';
import { CountUp } from '~/components/sections/count-up';
import { PageHero } from '~/components/sections/page-hero';
import type { Route } from './+types/about';

export function meta() {
  return buildMeta({
    title: 'Hakkımızda — Kliniğimizin Hikâyesi',
    description:
      'Kuruluşumuzdan bugüne, nasıl çalıştığımız ve neye önem verdiğimiz. Rakamlarla kliniğimiz.',
    path: '/hakkimizda',
  });
}

export async function loader() {
  const [settings, rating] = await Promise.all([
    serverFetch<SiteSettings>('/settings').catch(() => null),
    serverFetch<{ ratingValue: number; reviewCount: number } | null>(
      '/testimonials/rating',
    ).catch(() => null),
  ]);
  return { settings, rating };
}

const VALUES = [
  {
    icon: 'clock',
    title: 'Acele ettirmiyoruz',
    text: 'Muayeneye gerçekten yetecek süre ayırıyoruz. Hayvanın ortama alışması da tedavinin parçası.',
  },
  {
    icon: 'file',
    title: 'Anlatarak çalışıyoruz',
    text: 'Ne yaptığımızı, neden yaptığımızı ve alternatiflerini anlatıyoruz. Röntgeni birlikte inceliyoruz.',
  },
  {
    icon: 'shield',
    title: 'Şeffaf fiyat',
    text: 'İşlem öncesi tahmini tutarı söylüyoruz. Sürpriz kalem çıkarmıyoruz.',
  },
  {
    icon: 'heart',
    title: 'Takip ediyoruz',
    text: 'Operasyon sonrası arıyoruz, aşı zamanı geldiğinde hatırlatıyoruz. Dosya kapanmıyor.',
  },
];

export default function About({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const s = loaderData.settings ?? root?.settings ?? null;
  const rating = loaderData.rating;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Hakkımızda', path: '/hakkimizda' },
          ]),
        }}
      />

      <PageHero
        eyebrow="Hakkımızda"
        title={
          s ? `${s.clinic.foundedYear}'den beri aynı mahalledeyiz` : 'Kliniğimiz'
        }
        lede={s?.clinic.description}
      />

      {/* ── Rakamlar ── */}
      {s && (
        <section className="border-y border-line bg-surface-2 py-14">
          <div className="wrap grid grid-cols-2 gap-8 md:grid-cols-4" data-reveal>
            <Metric
              value={<CountUp to={s.clinic.totalPatients} suffix="+" />}
              label="Bakılan hasta"
            />
            <Metric
              value={<CountUp to={s.clinic.experienceYears} suffix=" yıl" />}
              label="Klinik deneyimi"
            />
            <Metric
              value={
                <CountUp
                  to={rating?.ratingValue ?? s.clinic.satisfactionRate}
                  decimals={1}
                  suffix="/5"
                />
              }
              label={rating ? `${rating.reviewCount} Google yorumu` : 'Memnuniyet'}
            />
            <Metric value="7/24" label="Acil hizmet" />
          </div>
        </section>
      )}

      {/* ── Hikaye ── */}
      <section className="py-18 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div data-reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-brand opacity-60" />
              Hikâyemiz
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)]">
              Küçük bir muayenehane olarak başladık
            </h2>
            <div className="mt-6 grid gap-4 leading-relaxed text-ink-muted">
              <p>
                İlk gün iki masa, bir mikroskop ve çok fazla sorumuz vardı.
                Mahallede kimse bizi tanımıyordu; ilk hastamız komşunun kedisiydi.
              </p>
              <p>
                Yıllar içinde ekipman değişti, ekip büyüdü, ameliyathane kuruldu.
                Değişmeyen tek şey şu oldu: bir hayvanı muayene etmek, sahibiyle
                konuşmadan tamamlanmıyor.
              </p>
              <p>
                Bugün dijital röntgenden yoğun bakıma kadar her şey aynı binada.
                Hayvanınızı tanımadığı bir yere sevk etmiyoruz — çünkü stres de
                bir bulgu.
              </p>
            </div>
          </div>

          <div
            className="aspect-4/3 overflow-hidden rounded-xl bg-tint"
            data-reveal="right"
          >
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80"
              alt="Klinik iç mekânından bir görünüm"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Değerler ── */}
      <section className="pb-18 md:pb-32">
        <div className="wrap">
          <div className="mb-12 max-w-[50ch]">
            <span className="eyebrow mb-4" data-reveal="fade">
              <span className="h-px w-6 bg-brand opacity-60" />
              Nasıl çalışıyoruz
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)]" data-reveal>
              Dört basit kural
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2" data-stagger>
            {VALUES.map((v) => (
              <Card key={v.title} className="p-8" data-reveal>
                <IconFrame name={v.icon} />
                <h3 className="mt-5 font-sans text-lg font-semibold">{v.title}</h3>
                <p className="mt-2.5 leading-relaxed text-ink-muted">{v.text}</p>
              </Card>
            ))}
          </div>

          <div className="mt-14 flex justify-center" data-reveal="fade">
            <LinkButton to="/randevu">
              Randevu Al <Icon name="arrow" size={17} />
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-none font-semibold tracking-tight text-brand">
        {value}
      </div>
      <div className="mt-2 text-sm text-ink-muted">{label}</div>
    </div>
  );
}
