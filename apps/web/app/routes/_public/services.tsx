import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { serverFetch } from '~/lib/api';
import { formatPrice } from '~/lib/format';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { Service } from '~/lib/types';
import { Icon, IconFrame, LinkButton, cx } from '~/components/ui';
import { PageHero } from '~/components/sections/page-hero';
import type { Route } from './+types/services';

export function meta() {
  return buildMeta({
    title: 'Hizmetlerimiz — Veteriner Kliniği',
    description:
      'Genel muayene, aşılama, cerrahi, diş bakımı, görüntüleme ve laboratuvar. Tümü tek çatı altında, online randevu ile.',
    path: '/hizmetler',
  });
}

export async function loader() {
  const services = await serverFetch<Service[]>('/services').catch(() => []);
  return { services };
}

export default function Services({ loaderData }: Route.ComponentProps) {
  const { services } = loaderData;
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(
    () => ['all', ...new Set(services.map((s) => s.category))],
    [services],
  );

  const visible = useMemo(
    () =>
      category === 'all'
        ? services
        : services.filter((s) => s.category === category),
    [services, category],
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Hizmetler', path: '/hizmetler' },
          ]),
        }}
      />

      <PageHero
        eyebrow="Hizmetler"
        title="Neler yapıyoruz?"
        lede="Rutin kontrolden acil cerrahiye kadar her şey aynı binada. Hangi hizmetin ne kadar sürdüğünü de burada görebilirsiniz."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap">
          {categories.length > 2 && (
            <div className="mb-10 flex flex-wrap gap-2" data-reveal="fade">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cx(
                    'rounded-full border px-4.5 py-2 text-sm transition-all duration-300 ease-soft',
                    category === c
                      ? 'border-brand bg-brand text-brand-contrast'
                      : 'border-line bg-surface text-ink-muted hover:border-brand hover:text-brand',
                  )}
                >
                  {c === 'all' ? 'Tümü' : c}
                </button>
              ))}
            </div>
          )}

          <div
            className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
            data-reveal
          >
            {visible.map((service) => (
              <Link
                key={service.id}
                to={`/hizmetler/${service.slug}`}
                className="group flex flex-col gap-3.5 bg-surface p-8 transition-colors duration-500 ease-soft hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <IconFrame
                    name={service.icon ?? 'stethoscope'}
                    className="transition-colors duration-500 group-hover:bg-brand group-hover:text-brand-contrast"
                  />
                  <span className="rounded-full bg-tint px-2.5 py-1 text-[0.6875rem] font-medium text-brand">
                    {service.durationMinutes} dk
                  </span>
                </div>
                <h2 className="font-sans text-[1.0625rem] font-semibold tracking-tight">
                  {service.title}
                </h2>
                <p className="flex-1 text-[0.9rem] leading-relaxed text-ink-muted">
                  {service.shortDesc}
                </p>
                <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
                  <span className="text-sm font-medium">
                    {formatPrice(service.price)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand">
                    Detay <Icon name="arrow" size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="py-16 text-center text-ink-muted">
              Bu kategoride henüz hizmet bulunmuyor.
            </p>
          )}

          <div className="mt-14 flex flex-col items-center gap-4 text-center" data-reveal="fade">
            <p className="max-w-[48ch] text-ink-muted">
              Aradığınız hizmeti bulamadıysanız bizi arayın — yönlendirelim.
            </p>
            <LinkButton to="/randevu">
              Randevu Al <Icon name="arrow" size={17} />
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
