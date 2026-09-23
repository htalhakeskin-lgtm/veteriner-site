import { Link } from 'react-router';

import { serverFetch } from '~/lib/api';
import { formatPrice } from '~/lib/format';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { Service, StaffMember } from '~/lib/types';
import { Card, Icon, IconFrame, LinkButton } from '~/components/ui';
import type { Route } from './+types/service-detail';

type ServiceDetail = Service & {
  staff: Array<Pick<StaffMember, 'id' | 'slug' | 'fullName' | 'title' | 'photoUrl'>>;
};

export function meta({ data }: Route.MetaArgs) {
  if (!data?.service) {
    return buildMeta({ title: 'Hizmet bulunamadı', description: '', noindex: true });
  }
  const s = data.service;
  return buildMeta({
    title: `${s.title} — Veteriner Kliniği`,
    description: s.shortDesc,
    path: `/hizmetler/${s.slug}`,
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  const service = await serverFetch<ServiceDetail>(`/services/${params.slug}`);
  const all = await serverFetch<Service[]>('/services').catch(() => []);
  const related = all
    .filter((s) => s.category === service.category && s.id !== service.id)
    .slice(0, 3);
  return { service, related };
}

export default function ServiceDetail({ loaderData }: Route.ComponentProps) {
  const { service, related } = loaderData;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Hizmetler', path: '/hizmetler' },
            { name: service.title, path: `/hizmetler/${service.slug}` },
          ]),
        }}
      />

      <section className="pt-12 pb-18 md:pt-16 md:pb-28">
        <div className="wrap">
          <Link
            to="/hizmetler"
            className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
          >
            <Icon name="arrow-left" size={15} /> Tüm hizmetler
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-20">
            <article>
              <div className="flex items-center gap-4" data-reveal="fade">
                <IconFrame name={service.icon ?? 'stethoscope'} size={56} />
                <div>
                  <span className="text-xs tracking-[0.1em] text-ink-faint uppercase">
                    {service.category}
                  </span>
                  <h1 className="mt-1 text-[clamp(2rem,4vw,3rem)]">{service.title}</h1>
                </div>
              </div>

              <p
                className="mt-8 text-[1.0625rem] leading-relaxed text-ink-muted"
                data-reveal
              >
                {service.shortDesc}
              </p>

              {service.longDesc && (
                <p
                  className="mt-5 leading-relaxed text-ink-muted"
                  data-reveal
                  style={{ '--delay': '80ms' } as React.CSSProperties}
                >
                  {service.longDesc}
                </p>
              )}

              {service.staff.length > 0 && (
                <div className="mt-14" data-reveal>
                  <h2 className="font-sans text-lg font-semibold">
                    Bu hizmeti veren hekimler
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {service.staff.map((member) => (
                      <Card key={member.id} hover className="flex items-center gap-4 p-4">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-tint">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.fullName}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="grid h-full place-items-center text-brand">
                              <Icon name="user" size={22} />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-sm text-ink-muted">{member.title}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Yan panel: kullanici sayfayi okurken randevu butonu
                ekranda kalsin diye yapiskan. */}
            <aside className="lg:sticky lg:top-28 lg:self-start" data-reveal="right">
              <Card className="p-7">
                <dl className="grid gap-4">
                  <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-4">
                    <dt className="text-sm text-ink-muted">Süre</dt>
                    <dd className="font-medium">{service.durationMinutes} dakika</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-4">
                    <dt className="text-sm text-ink-muted">Ücret</dt>
                    <dd className="font-medium">{formatPrice(service.price)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-ink-muted">Kategori</dt>
                    <dd className="font-medium">{service.category}</dd>
                  </div>
                </dl>

                <LinkButton
                  to={`/randevu?hizmet=${service.slug}`}
                  className="mt-7 w-full"
                >
                  Bu hizmet için randevu al <Icon name="arrow" size={17} />
                </LinkButton>

                <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
                  Ücretler bilgilendirme amaçlıdır; muayene sonucuna göre
                  değişebilir.
                </p>
              </Card>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-20 border-t border-line pt-14" data-reveal>
              <h2 className="font-sans text-lg font-semibold">İlgili hizmetler</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} to={`/hizmetler/${r.slug}`}>
                    <Card hover className="h-full p-6">
                      <IconFrame name={r.icon ?? 'stethoscope'} size={38} />
                      <h3 className="mt-4 font-sans text-base font-semibold">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-sm text-ink-muted">{r.shortDesc}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
