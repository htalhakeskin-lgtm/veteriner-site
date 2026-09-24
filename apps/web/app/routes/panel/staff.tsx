import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatDate } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Service, StaffMember } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  IconFrame,
  Input,
  Skeleton,
  SuccessNote,
  Textarea,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Personel — Yönetim',
    description: 'Hekim kadrosu, çalışma takvimi ve izinler.',
    path: '/panel/personel',
    noindex: true,
  });
}

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

type AdminStaff = StaffMember & {
  isActive: boolean;
  timeOff?: Array<{ id: string; startAt: string; endAt: string; reason: string | null }>;
  _count?: { appointments: number };
};

interface Window {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function AdminStaff() {
  const [items, setItems] = useState<AdminStaff[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<AdminStaff | null>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [timeOff, setTimeOff] = useState({ startAt: '', endAt: '', reason: '' });

  const load = useCallback(async () => {
    try {
      const [st, sv] = await Promise.all([
        api.get<AdminStaff[]>('/admin/staff'),
        api.get<Service[]>('/services').catch(() => []),
      ]);
      setItems(st);
      setServices(sv);
      // Secili personeli tazele
      setSelected((cur) => (cur ? (st.find((s) => s.id === cur.id) ?? null) : null));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function select(member: AdminStaff) {
    setSelected(member);
    setWindows(
      (member.schedules ?? []).map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    );
    setError(null);
    setSuccess(null);
  }

  async function saveSchedule() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/admin/staff/${selected.id}/schedule`, { windows });
      setSuccess('Çalışma takvimi güncellendi.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Takvim kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function addTimeOff(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/admin/staff/${selected.id}/time-off`, {
        startAt: `${timeOff.startAt}T00:00:00.000Z`,
        endAt: `${timeOff.endAt}T23:59:59.000Z`,
        reason: timeOff.reason || undefined,
      });
      setSuccess('İzin eklendi. Bu tarihlerde randevu alınamayacak.');
      setTimeOff({ startAt: '', endAt: '', reason: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İzin eklenemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function removeTimeOff(id: string) {
    try {
      await api.delete(`/admin/staff/time-off/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İzin silinemedi.');
    }
  }

  return (
    <>
      <PanelHeader
        title="Personel"
        description="Hekim kadrosu, çalışma saatleri ve izinler. Burada yaptığınız değişiklikler randevu takvimine anında yansır."
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* ── Liste ── */}
        <div>
          {items === null ? (
            <div className="grid gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon="user" title="Personel kaydı yok" />
          ) : (
            <div className="grid gap-3">
              {items.map((m) => (
                <button key={m.id} type="button" onClick={() => select(m)}>
                  <Card
                    hover
                    className={cx(
                      'p-4 text-left',
                      selected?.id === m.id && 'border-brand bg-tint/40',
                      !m.isActive && 'opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <IconFrame name="user" size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.fullName}</p>
                        <p className="truncate text-sm text-ink-muted">{m.title}</p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {m.schedules?.length ?? 0} çalışma aralığı ·{' '}
                          {m.services?.length ?? 0} hizmet
                          {m._count && ` · ${m._count.appointments} randevu`}
                        </p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Detay ── */}
        <div>
          {!selected ? (
            <EmptyState
              icon="user"
              title="Personel seçin"
              description="Çalışma takvimini düzenlemek veya izin eklemek için soldan bir hekim seçin."
            />
          ) : (
            <div className="grid gap-4">
              {error && <ErrorNote>{error}</ErrorNote>}
              {success && <SuccessNote>{success}</SuccessNote>}

              {/* Calisma takvimi */}
              <Card className="p-6">
                <h2 className="font-sans text-lg font-semibold">
                  {selected.fullName} — Çalışma takvimi
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Buradaki saatler dışında randevu alınamaz.
                </p>

                <div className="mt-5 grid gap-2">
                  {windows.length === 0 && (
                    <p className="rounded-md border border-dashed border-line px-4 py-5 text-center text-sm text-ink-muted">
                      Çalışma aralığı tanımlı değil — bu hekime randevu alınamaz.
                    </p>
                  )}

                  {windows.map((w, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <select
                        value={w.dayOfWeek}
                        onChange={(e) =>
                          updateWindow(i, { dayOfWeek: Number(e.target.value) })
                        }
                        className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
                      >
                        {DAYS.map((d, n) => (
                          <option key={n} value={n}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={w.startTime}
                        onChange={(e) => updateWindow(i, { startTime: e.target.value })}
                        className="rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums"
                      />
                      <span className="text-ink-faint">–</span>
                      <input
                        type="time"
                        value={w.endTime}
                        onChange={(e) => updateWindow(i, { endTime: e.target.value })}
                        className="rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setWindows((ws) => ws.filter((_, n) => n !== i))}
                        aria-label="Kaldır"
                        className="grid h-9 w-9 place-items-center rounded-md text-ink-muted transition-colors hover:text-danger"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setWindows((ws) => [
                        ...ws,
                        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
                      ])
                    }
                  >
                    <Icon name="plus" size={15} /> Aralık ekle
                  </Button>
                  <Button size="sm" loading={saving} onClick={() => void saveSchedule()}>
                    Takvimi kaydet
                  </Button>
                </div>
              </Card>

              {/* Izinler */}
              <Card className="p-6">
                <h2 className="font-sans text-lg font-semibold">İzinler</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  İzin girilen tarihlerde bu hekime randevu verilmez.
                </p>

                {selected.timeOff && selected.timeOff.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {selected.timeOff.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-line px-4 py-2.5 text-sm"
                      >
                        <span>
                          {formatDate(t.startAt)} – {formatDate(t.endAt)}
                          {t.reason && (
                            <span className="ml-2 text-ink-muted">({t.reason})</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => void removeTimeOff(t.id)}
                          aria-label="İzni kaldır"
                          className="text-ink-muted transition-colors hover:text-danger"
                        >
                          <Icon name="x" size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={addTimeOff} className="mt-5 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Başlangıç" required htmlFor="tstart">
                      <Input
                        id="tstart"
                        type="date"
                        required
                        value={timeOff.startAt}
                        onChange={(e) =>
                          setTimeOff({ ...timeOff, startAt: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Bitiş" required htmlFor="tend">
                      <Input
                        id="tend"
                        type="date"
                        required
                        min={timeOff.startAt}
                        value={timeOff.endAt}
                        onChange={(e) =>
                          setTimeOff({ ...timeOff, endAt: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Sebep" htmlFor="treason">
                    <Input
                      id="treason"
                      placeholder="Yıllık izin, kongre…"
                      value={timeOff.reason}
                      onChange={(e) =>
                        setTimeOff({ ...timeOff, reason: e.target.value })
                      }
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    loading={saving}
                    className="justify-self-start"
                  >
                    <Icon name="plus" size={15} /> İzin ekle
                  </Button>
                </form>
              </Card>

              {/* Verdigi hizmetler */}
              <Card className="p-6">
                <h2 className="font-sans text-base font-semibold">Verdiği hizmetler</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Hekim yalnızca bu hizmetler için randevu alabilir.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {services.map((sv) => {
                    const active = selected.services?.some((x) => x.id === sv.id);
                    return (
                      <span
                        key={sv.id}
                        className={cx(
                          'rounded-full border px-3 py-1.5 text-sm',
                          active
                            ? 'border-brand bg-tint text-brand'
                            : 'border-line text-ink-faint',
                        )}
                      >
                        {sv.title}
                      </span>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );

  function updateWindow(index: number, patch: Partial<Window>) {
    setWindows((ws) => ws.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }
}
