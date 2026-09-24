import { Link } from 'react-router';

import { serverFetch } from '~/lib/api';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { StaffMember } from '~/lib/types';
import { Chip, Icon, LinkButton, cx } from '~/components/ui';
import { PageHero } from '~/components/sections/page-hero';
import type { Route } from './+types/team';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function meta() {
  return buildMeta({
    title: 'Ekibimiz — Veteriner Hekimlerimiz',
    description:
      'Uzman veteriner hekim kadromuz. Her ziyarette aynı hekime gelebilir, dosyanızı baştan anlatmak zorunda kalmazsınız.',
    path: '/ekibimiz',
  });
}

export async function loader() {
  const staff = await serverFetch<StaffMember[]>('/staff').catch(() => []);
  // Çalışma takvimi detay sayfasında; listede her hekim için ayrı
  // istek atmak yerine hepsini paralel çekiyoruz.
  const detailed = await Promise.all(
    staff.map((s) =>
      serverFetch<StaffMember>(`/staff/${s.slug}`).catch(() => s),
    ),
  );
  return { staff: detailed };
}

export default function Team({ loaderData }: Route.ComponentProps) {
  const { staff } = loaderData;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Ekibimiz', path: '/ekibimiz' },
          ]),
        }}
      />

      <PageHero
        eyebrow="Ekibimiz"
        title="Hayvanınızı tanıyan hekimler"
        lede="Her ziyarette aynı hekime gelebilirsiniz. Dosyanızı baştan anlatmak zorunda kalmaz, tedavi geçmişi kesintiye uğramaz."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap grid gap-16 md:gap-24">
          {staff.map((member, i) => (
            <article
              key={member.id}
              id={member.slug}
              className={cx(
                'grid items-center gap-10 md:gap-16 lg:grid-cols-2',
                // Zigzag: tek sırada fotoğraf sağda
                i % 2 === 1 && 'lg:[&>figure]:order-2',
              )}
              data-reveal
            >
              <figure className="aspect-4/5 overflow-hidden rounded-xl bg-tint">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover saturate-92 transition-all duration-[1100ms] ease-soft hover:scale-103 hover:saturate-100"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-brand">
                    <Icon name="user" size={64} />
                  </div>
                )}
              </figure>

              <div>
                <span className="eyebrow mb-3">
                  <span className="h-px w-6 bg-brand opacity-60" />
                  {member.title}
                </span>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)]">{member.fullName}</h2>

                {member.speciality && (
                  <p className="mt-3 font-medium text-brand">{member.speciality}</p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {member.experienceYears && (
                    <Chip>
                      <Icon name="clock" size={14} />
                      {member.experienceYears} yıl deneyim
                    </Chip>
                  )}
                  {member.education && (
                    <Chip>
                      <Icon name="file" size={14} />
                      {member.education}
                    </Chip>
                  )}
                </div>

                {member.bio && (
                  <p className="mt-6 leading-relaxed text-ink-muted">{member.bio}</p>
                )}

                {member.schedules && member.schedules.length > 0 && (
                  <div className="mt-7">
                    <h3 className="text-xs font-medium tracking-[0.1em] text-ink-faint uppercase">
                      Klinikte olduğu günler
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {member.schedules.map((sch) => (
                        <span
                          key={`${sch.dayOfWeek}-${sch.startTime}`}
                          className="rounded-md border border-line bg-surface px-3 py-1.5 text-[0.8125rem]"
                        >
                          <span className="text-ink-muted">{DAYS[sch.dayOfWeek]}</span>{' '}
                          <span className="font-medium tabular-nums">
                            {sch.startTime}–{sch.endTime}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.services && member.services.length > 0 && (
                  <div className="mt-7">
                    <h3 className="text-xs font-medium tracking-[0.1em] text-ink-faint uppercase">
                      Verdiği hizmetler
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                      {member.services.map((svc) => (
                        <Link
                          key={svc.id}
                          to={`/hizmetler/${svc.slug}`}
                          className="text-ink-muted transition-colors hover:text-brand"
                        >
                          {svc.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <LinkButton
                  to={`/randevu?hekim=${member.slug}`}
                  variant="ghost"
                  size="sm"
                  className="mt-8"
                >
                  {member.fullName.split(' ')[0]} ile randevu al{' '}
                  <Icon name="arrow" size={15} />
                </LinkButton>
              </div>
            </article>
          ))}

          {staff.length === 0 && (
            <p className="py-16 text-center text-ink-muted">
              Ekip bilgileri yakında eklenecek.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
