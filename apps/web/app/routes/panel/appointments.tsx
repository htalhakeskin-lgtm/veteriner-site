import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { ApiError, api } from '~/lib/api';
import { dayKey, formatDate, formatTime, speciesLabel } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment, AppointmentStatus, StaffMember } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  Input,
  Select,
  Skeleton,
  StatusBadge,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Randevular — Yönetim',
    description: 'Randevu takvimi ve onay işlemleri.',
    path: '/panel/randevular',
    noindex: true,
  });
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tümü' },
  { value: 'PENDING', label: 'Onay bekleyen' },
  { value: 'CONFIRMED', label: 'Onaylı' },
  { value: 'COMPLETED', label: 'Tamamlanan' },
  { value: 'CANCELLED', label: 'İptal' },
];

export default function AdminAppointments() {
  const [params, setParams] = useSearchParams();

  const [from, setFrom] = useState(() => dayKey(new Date()));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return dayKey(d);
  });
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [staffId, setStaffId] = useState('');
  const [q, setQ] = useState('');

  const [items, setItems] = useState<Appointment[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<StaffMember[]>('/staff').then(setStaff).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      if (status) query.set('status', status);
      if (staffId) query.set('staffId', staffId);
      if (q.trim()) query.set('q', q.trim());
      setItems(await api.get<Appointment[]>(`/admin/appointments?${query}`));
    } catch (err) {
      setItems([]);
      setError(err instanceof ApiError ? err.message : 'Randevular yüklenemedi.');
    }
  }, [from, to, status, staffId, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatusFor(id: string, next: AppointmentStatus) {
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status: next });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Durum değiştirilemedi.');
    } finally {
      setBusyId(null);
    }
  }

  // Gune gore grupla: duz bir liste, yogun bir takvimde okunmasi zor olurdu.
  const grouped = (items ?? []).reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = dayKey(new Date(a.startAt));
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <PanelHeader
        title="Randevular"
        description="Takvimi filtreleyin, onaylayın veya iptal edin."
      />

      {/* ── Filtreler ── */}
      <Card className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <span className="text-xs tracking-wider text-ink-faint uppercase">
              Başlangıç
            </span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs tracking-wider text-ink-faint uppercase">
              Bitiş
            </span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs tracking-wider text-ink-faint uppercase">
              Hekim
            </span>
            <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Tümü</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs tracking-wider text-ink-faint uppercase">
              Ara
            </span>
            <Input
              placeholder="Kod, isim, telefon…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setParams(f.value ? { status: f.value } : {});
              }}
              aria-pressed={status === f.value}
              className={cx(
                'rounded-full border px-4 py-1.5 text-sm transition-all duration-300',
                status === f.value
                  ? 'border-brand bg-brand text-brand-contrast'
                  : 'border-line text-ink-muted hover:border-brand hover:text-brand',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {items === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Randevu bulunamadı"
          description="Seçtiğiniz aralıkta ve filtrede randevu yok."
        />
      ) : (
        <div className="grid gap-6">
          <p className="text-sm text-ink-muted">{items.length} randevu bulundu</p>

          {Object.entries(grouped).map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-3 font-sans text-sm font-semibold tracking-wider text-ink-muted uppercase">
                {formatDate(day)}
                <span className="ml-2 font-normal text-ink-faint">
                  ({list.length})
                </span>
              </h2>

              <Card className="divide-y divide-line-soft">
                {list.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                    <span className="w-14 shrink-0 font-display text-lg font-semibold tabular-nums">
                      {formatTime(a.startAt)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {a.pet?.name ?? a.guestPetName ?? '—'}
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
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        <span className="font-mono">{a.code}</span>
                        {' · '}
                        {a.user?.fullName ?? a.guestName ?? 'Misafir'}
                        {(a.user?.phone ?? a.guestPhone) &&
                          ` · ${a.user?.phone ?? a.guestPhone}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.status} />

                      {a.status === 'PENDING' && (
                        <Button
                          size="sm"
                          loading={busyId === a.id}
                          onClick={() => void setStatusFor(a.id, 'CONFIRMED')}
                        >
                          <Icon name="check" size={14} /> Onayla
                        </Button>
                      )}
                      {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={busyId === a.id}
                            onClick={() => void setStatusFor(a.id, 'COMPLETED')}
                          >
                            Tamamlandı
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            loading={busyId === a.id}
                            onClick={() => void setStatusFor(a.id, 'CANCELLED')}
                            className="text-danger hover:text-danger"
                          >
                            İptal
                          </Button>
                        </>
                      )}
                    </div>

                    {a.notes && (
                      <p className="w-full rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                        {a.notes}
                      </p>
                    )}
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
