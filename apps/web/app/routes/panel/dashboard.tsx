import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { api } from '~/lib/api';
import { formatTime, speciesLabel } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment, DashboardOverview } from '~/lib/types';
import {
  Card,
  EmptyState,
  Icon,
  IconFrame,
  Skeleton,
  StatusBadge,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Yönetim Paneli',
    description: 'Klinik özeti.',
    path: '/panel',
    noindex: true,
  });
}

interface TrendPoint {
  date: string;
  total: number;
  cancelled: number;
}

interface TopService {
  serviceId: string;
  title: string;
  count: number;
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [today, setToday] = useState<Appointment[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);

  useEffect(() => {
    void (async () => {
      const [o, t, tr, ts] = await Promise.all([
        api.get<DashboardOverview>('/admin/dashboard').catch(() => null),
        api.get<Appointment[]>('/admin/dashboard/today').catch(() => []),
        api.get<TrendPoint[]>('/admin/dashboard/trend?days=14').catch(() => []),
        api.get<TopService[]>('/admin/dashboard/top-services?limit=5').catch(() => []),
      ]);
      setOverview(o);
      setToday(t);
      setTrend(tr);
      setTopServices(ts);
    })();
  }, []);

  const maxTrend = Math.max(1, ...trend.map((d) => d.total));

  return (
    <>
      <PanelHeader
        title="Dashboard"
        description={new Date().toLocaleDateString('tr-TR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {/* ── Özet ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="calendar"
          label="Bugünkü randevu"
          value={overview?.appointments.today}
          to="/panel/randevular"
        />
        <Stat
          icon="clock"
          label="Onay bekleyen"
          value={overview?.appointments.pendingApproval}
          highlight={(overview?.appointments.pendingApproval ?? 0) > 0}
          to="/panel/randevular?status=PENDING"
        />
        <Stat
          icon="users"
          label="Toplam müşteri"
          value={overview?.customers.total}
          hint={
            overview ? `Bu ay +${overview.customers.newThisMonth}` : undefined
          }
          to="/panel/musteriler"
        />
        <Stat
          icon="mail"
          label="Okunmamış mesaj"
          value={overview?.inbox.unreadMessages}
          highlight={(overview?.inbox.unreadMessages ?? 0) > 0}
          to="/panel/mesajlar"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* ── Bugünün takvimi ── */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans text-lg font-semibold">Bugünün randevuları</h2>
            <Link
              to="/panel/randevular"
              className="text-sm text-brand transition-opacity hover:opacity-80"
            >
              Tüm randevular
            </Link>
          </div>

          <div className="mt-4">
            {today === null ? (
              <Skeleton className="h-48" />
            ) : today.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="Bugün randevu yok"
                description="Takvim boş görünüyor."
              />
            ) : (
              <Card className="divide-y divide-line-soft">
                {today.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                    <span className="w-14 shrink-0 font-display text-lg font-semibold tabular-nums">
                      {formatTime(a.startAt)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {a.pet?.name ?? a.guestName ?? 'İsimsiz'}
                        {a.pet && (
                          <span className="ml-2 text-sm font-normal text-ink-muted">
                            {speciesLabel(a.pet.species)}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-ink-muted">
                        {a.service.title}
                        {a.staff && ` · ${a.staff.fullName}`}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </Card>
            )}
          </div>
        </section>

        {/* ── Yan sütun ── */}
        <div className="grid content-start gap-6">
          {/* Basit cubuk grafik: harici kutuphane yerine CSS.
              Veri az ve bicim sabit; bağımlılık eklemeye degmez. */}
          <Card className="p-5">
            <h2 className="font-sans text-base font-semibold">Son 14 gün</h2>
            {trend.length === 0 ? (
              <Skeleton className="mt-4 h-24" />
            ) : (
              <>
                <div className="mt-5 flex h-24 items-end gap-1">
                  {trend.map((d) => (
                    <div
                      key={d.date}
                      className="group relative flex-1"
                      title={`${d.date}: ${d.total} randevu`}
                    >
                      <div
                        className="w-full rounded-t-sm bg-brand transition-opacity hover:opacity-80"
                        style={{ height: `${(d.total / maxTrend) * 96}px` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-faint">
                  Toplam {trend.reduce((a, d) => a + d.total, 0)} randevu
                </p>
              </>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-sans text-base font-semibold">En çok tercih edilen</h2>
            <ul className="mt-4 grid gap-3">
              {topServices.map((s) => (
                <li key={s.serviceId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{s.title}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {s.count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${(s.count / (topServices[0]?.count ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
              {topServices.length === 0 && (
                <li className="text-sm text-ink-muted">Veri yok</li>
              )}
            </ul>
          </Card>

          {overview && overview.inbox.pendingTestimonials > 0 && (
            <Link to="/panel/yorumlar">
              <Card hover className="flex items-center gap-4 p-5">
                <IconFrame name="star" size={42} />
                <div>
                  <p className="font-medium">
                    {overview.inbox.pendingTestimonials} yorum onay bekliyor
                  </p>
                  <p className="text-sm text-ink-muted">İncelemek için tıklayın</p>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  highlight,
  to,
}: {
  icon: string;
  label: string;
  value: number | undefined;
  hint?: string;
  highlight?: boolean;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card
        hover
        className={cx('h-full p-5', highlight && 'border-brand/50 bg-tint/30')}
      >
        <div className="flex items-start gap-4">
          <IconFrame name={icon} size={42} />
          <div className="min-w-0">
            <div className="font-display text-2xl leading-none font-semibold">
              {value ?? '—'}
            </div>
            <div className="mt-1 text-sm text-ink-muted">{label}</div>
            {hint && <div className="mt-0.5 text-xs text-brand">{hint}</div>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
