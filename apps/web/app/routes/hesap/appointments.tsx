import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatDateTime } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  IconFrame,
  LinkButton,
  Skeleton,
  StatusBadge,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Randevularım',
    description: 'Geçmiş ve yaklaşan randevularınız.',
    path: '/hesap/randevularim',
    noindex: true,
  });
}

type Tab = 'upcoming' | 'past';

export default function MyAppointments() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    try {
      const all = await api.get<Appointment[]>('/appointments/me');
      const now = Date.now();
      setItems(
        all.filter((a) =>
          tab === 'upcoming'
            ? new Date(a.startAt).getTime() >= now &&
              a.status !== 'CANCELLED' &&
              a.status !== 'COMPLETED'
            : new Date(a.startAt).getTime() < now ||
              a.status === 'CANCELLED' ||
              a.status === 'COMPLETED',
        ),
      );
    } catch {
      setItems([]);
      setError('Randevular yüklenemedi.');
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    // Randevu iptali geri alınamaz; önce onay aliyoruz.
    if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/appointments/${id}/cancel`, {});
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Randevu iptal edilemedi.',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PanelHeader
        title="Randevularım"
        description="Yaklaşan ve geçmiş randevularınızın tamamı."
        action={
          <LinkButton to="/randevu" size="sm">
            <Icon name="plus" size={15} /> Yeni Randevu
          </LinkButton>
        }
      />

      <div className="mb-6 flex gap-2">
        {(
          [
            ['upcoming', 'Yaklaşan'],
            ['past', 'Geçmiş'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cx(
              'rounded-full border px-4.5 py-2 text-sm transition-all duration-300',
              tab === value
                ? 'border-brand bg-brand text-brand-contrast'
                : 'border-line bg-surface text-ink-muted hover:border-brand hover:text-brand',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {items === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={tab === 'upcoming' ? 'Yaklaşan randevunuz yok' : 'Geçmiş randevu yok'}
          description={
            tab === 'upcoming'
              ? 'Dostunuz için kontrol zamanı geldiyse randevu alabilirsiniz.'
              : 'Tamamlanan randevularınız burada görünecek.'
          }
          action={
            tab === 'upcoming' ? (
              <LinkButton to="/randevu" size="sm" className="mt-2">
                Randevu Al
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <IconFrame
                    name="calendar"
                    size={46}
                    className={
                      a.status === 'CANCELLED'
                        ? 'bg-line-soft text-ink-faint'
                        : undefined
                    }
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{formatDateTime(a.startAt)}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {a.service.title}
                      {a.staff && ` · ${a.staff.fullName}`}
                      {a.pet && ` · ${a.pet.name}`}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-ink-faint">{a.code}</p>
                    {a.cancelReason && (
                      <p className="mt-2 text-xs text-danger">
                        İptal nedeni: {a.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <StatusBadge status={a.status} />
                  {tab === 'upcoming' && (
                    <Button
                      variant="quiet"
                      size="sm"
                      loading={busyId === a.id}
                      onClick={() => void cancel(a.id)}
                      className="text-danger hover:text-danger"
                    >
                      İptal et
                    </Button>
                  )}
                </div>
              </div>

              {a.notes && (
                <p className="mt-4 rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-muted">
                  {a.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
