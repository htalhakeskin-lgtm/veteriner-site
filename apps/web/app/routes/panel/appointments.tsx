import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { ApiError, api } from '~/lib/api';
import {
  dayKey,
  formatDate,
  formatDateTime,
  formatTime,
  speciesLabel,
  whatsappLink,
} from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment, AppointmentStatus, StaffMember } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  IconFrame,
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
  { value: 'NO_SHOW', label: 'Gelinmedi' },
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

  /** Detay panelinde açık olan randevu. */
  const [detail, setDetail] = useState<Appointment | null>(null);

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
      const updated = await api.patch<Appointment>(
        `/admin/appointments/${id}/status`,
        { status: next },
      );
      // Detay paneli açıksa oradaki kaydı da tazele.
      setDetail((d) => (d && d.id === id ? updated : d));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Durum değiştirilemedi.');
    } finally {
      setBusyId(null);
    }
  }

  // Güne göre grupla: düz bir liste, yoğun bir takvimde okunması zor olurdu.
  const grouped = (items ?? []).reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = dayKey(new Date(a.startAt));
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <PanelHeader
        title="Randevular"
        description="Takvimi filtreleyin, detayını görün, onaylayın veya iptal edin."
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
            <span className="text-xs tracking-wider text-ink-faint uppercase">Ara</span>
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
                <span className="ml-2 font-normal text-ink-faint">({list.length})</span>
              </h2>

              <Card className="divide-y divide-line-soft">
                {list.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                    {/* Satırın kendisi detay açar; işlem butonları
                        stopPropagation ile bunu tetiklemez. */}
                    <button
                      type="button"
                      onClick={() => setDetail(a)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <span className="w-14 shrink-0 font-display text-lg font-semibold tabular-nums">
                        {formatTime(a.startAt)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {a.pet?.name ?? a.guestPetName ?? '—'}
                          {a.pet && (
                            <span className="ml-2 text-sm font-normal text-ink-muted">
                              {speciesLabel(a.pet.species)}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {a.service.title}
                          {a.staff && ` · ${a.staff.fullName}`}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-faint">
                          <span className="font-mono">{a.code}</span>
                          {' · '}
                          {a.user?.fullName ?? a.guestName ?? 'Misafir'}
                        </span>
                      </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.status} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetail(a)}
                      >
                        Detay <Icon name="arrow" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      {detail && (
        <DetailPanel
          appointment={detail}
          busy={busyId === detail.id}
          onClose={() => setDetail(null)}
          onStatus={(next) => void setStatusFor(detail.id, next)}
        />
      )}
    </>
  );
}

/** Randevu detayı — her durumda açılır, duruma göre işlem sunar. */
function DetailPanel({
  appointment: a,
  busy,
  onClose,
  onStatus,
}: {
  appointment: Appointment;
  busy: boolean;
  onClose: () => void;
  onStatus: (next: AppointmentStatus) => void;
}) {
  // Escape ile kapanabilsin: modal açıkken klavyeyle çıkış beklenir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const phone = a.user?.phone ?? a.guestPhone;
  const email = a.user?.email ?? a.guestEmail;
  const customer = a.user?.fullName ?? a.guestName ?? 'Misafir';
  const petName = a.pet?.name ?? a.guestPetName;
  const petSpecies = a.pet?.species ?? a.guestPetSpecies;

  const acik = a.status === 'PENDING' || a.status === 'CONFIRMED';
  const dakika = Math.round(
    (new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60000,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Randevu detayı ${a.code}`}
      className="fixed inset-0 z-60 flex justify-end bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-[480px] overflow-y-auto bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-line bg-surface/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="font-display text-lg font-semibold">Randevu detayı</p>
            <p className="font-mono text-xs text-ink-faint">{a.code}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-brand hover:text-brand"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <StatusBadge status={a.status} />
            <span className="text-sm text-ink-muted">{dakika} dakika</span>
          </div>

          <Row icon="calendar" label="Tarih ve saat" value={formatDateTime(a.startAt)} />
          <Row icon="stethoscope" label="Hizmet" value={a.service.title} />
          <Row
            icon="user"
            label="Hekim"
            value={a.staff ? `${a.staff.fullName} · ${a.staff.title}` : 'Atanmadı'}
          />
          <Row
            icon="paw"
            label="Hasta"
            value={
              petName
                ? `${petName}${petSpecies ? ` · ${speciesLabel(petSpecies)}` : ''}${a.pet?.breed ? ` (${a.pet.breed})` : ''}`
                : 'Belirtilmedi'
            }
          />
          <Row
            icon="users"
            label="Müşteri"
            value={`${customer}${a.userId ? '' : ' (üye değil)'}`}
          />
          {phone && <Row icon="phone" label="Telefon" value={phone} />}
          {email && <Row icon="mail" label="E-posta" value={email} />}

          {a.notes && (
            <div>
              <p className="text-xs tracking-[0.06em] text-ink-faint uppercase">
                Müşteri notu
              </p>
              <p className="mt-1.5 rounded-md bg-surface-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {a.notes}
              </p>
            </div>
          )}

          {a.cancelReason && (
            <div>
              <p className="text-xs tracking-[0.06em] text-ink-faint uppercase">
                İptal nedeni
              </p>
              <p className="mt-1.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {a.cancelReason}
              </p>
            </div>
          )}

          {/* Hızlı iletişim: telefonu olan her randevu için */}
          {phone && (
            <div className="flex flex-wrap gap-2 border-t border-line-soft pt-5">
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-brand hover:text-brand"
              >
                <Icon name="phone" size={14} /> Ara
              </a>
              <a
                href={whatsappLink(
                  phone,
                  `Merhaba, ${formatDateTime(a.startAt)} tarihli ${a.service.title} randevunuz hakkında bilgi vermek istiyoruz.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-brand hover:text-brand"
              >
                <Icon name="chat" size={14} /> WhatsApp
              </a>
            </div>
          )}

          {/* Durum işlemleri: kapanmış randevu yeniden açılabilir. */}
          <div className="grid gap-2 border-t border-line-soft pt-5">
            <p className="text-xs tracking-[0.06em] text-ink-faint uppercase">
              Durumu değiştir
            </p>
            <div className="flex flex-wrap gap-2">
              {a.status === 'PENDING' && (
                <Button size="sm" loading={busy} onClick={() => onStatus('CONFIRMED')}>
                  <Icon name="check" size={14} /> Onayla
                </Button>
              )}
              {acik && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => onStatus('COMPLETED')}
                  >
                    Tamamlandı
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => onStatus('NO_SHOW')}
                  >
                    Gelinmedi
                  </Button>
                  <Button
                    size="sm"
                    variant="quiet"
                    loading={busy}
                    onClick={() => onStatus('CANCELLED')}
                    className="text-danger hover:text-danger"
                  >
                    İptal et
                  </Button>
                </>
              )}
              {!acik && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() => onStatus('CONFIRMED')}
                >
                  <Icon name="check" size={14} /> Yeniden aç
                </Button>
              )}
            </div>
            {!acik && (
              <p className="text-xs text-ink-faint">
                Yeniden açmak, o saatin hâlâ boş olmasını gerektirir.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <IconFrame name={icon} size={38} />
      <div className="min-w-0">
        <p className="text-xs tracking-[0.06em] text-ink-faint uppercase">{label}</p>
        <p className="mt-0.5 font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
