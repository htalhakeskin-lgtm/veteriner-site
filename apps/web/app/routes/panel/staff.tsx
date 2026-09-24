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

const DAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

type AdminStaff = StaffMember & {
  isActive: boolean;
  sortOrder: number;
  timeOff?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    reason: string | null;
  }>;
  _count?: { appointments: number };
};

interface Window {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

type Tab = 'bilgiler' | 'takvim' | 'izinler';

const EMPTY_FORM = {
  slug: '',
  fullName: '',
  title: 'Veteriner Hekim',
  speciality: '',
  experienceYears: '',
  education: '',
  bio: '',
  photoUrl: '',
  isActive: true,
  serviceIds: [] as string[],
};

export default function AdminStaff() {
  const [items, setItems] = useState<AdminStaff[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  /** null = yeni personel formu açık, AdminStaff = o kişi düzenleniyor */
  const [selected, setSelected] = useState<AdminStaff | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<Tab>('bilgiler');

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [windows, setWindows] = useState<Window[]>([]);
  const [timeOff, setTimeOff] = useState({ startAt: '', endAt: '', reason: '' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [st, sv] = await Promise.all([
        api.get<AdminStaff[]>('/admin/staff'),
        api.get<Service[]>('/services').catch(() => []),
      ]);
      setItems(st);
      setServices(sv);
      // Seçili personeli tazele; silinmişse seçimi düşür.
      setSelected((cur) => (cur ? (st.find((s) => s.id === cur.id) ?? null) : null));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startNew() {
    setCreating(true);
    setSelected(null);
    setTab('bilgiler');
    setForm({ ...EMPTY_FORM });
    setWindows([
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    ]);
    setError(null);
    setSuccess(null);
  }

  function select(member: AdminStaff) {
    setCreating(false);
    setSelected(member);
    setTab('bilgiler');
    setForm({
      slug: member.slug,
      fullName: member.fullName,
      title: member.title,
      speciality: member.speciality ?? '',
      experienceYears: member.experienceYears ? String(member.experienceYears) : '',
      education: member.education ?? '',
      bio: member.bio ?? '',
      photoUrl: member.photoUrl ?? '',
      isActive: member.isActive,
      serviceIds: (member.services ?? []).map((s) => s.id),
    });
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

  /** Yeni personel: önce kaydı oluştur, sonra çalışma takvimini yaz. */
  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        slug: form.slug || slugify(form.fullName),
        fullName: form.fullName,
        title: form.title,
        speciality: form.speciality || undefined,
        experienceYears: form.experienceYears
          ? Number(form.experienceYears)
          : undefined,
        education: form.education || undefined,
        bio: form.bio || undefined,
        photoUrl: form.photoUrl || undefined,
        isActive: form.isActive,
        serviceIds: form.serviceIds,
      };

      if (creating) {
        const created = await api.post<AdminStaff>('/admin/staff', payload);
        // Takvim ayrı bir uç; yeni personel randevu alabilsin diye
        // oluşturur oluşturmaz yazıyoruz.
        if (windows.length > 0) {
          await api.put(`/admin/staff/${created.id}/schedule`, { windows });
        }
        setSuccess('Personel eklendi.');
        setCreating(false);
        await load();
        // Yeni kaydı seçili hale getir.
        const fresh = await api.get<AdminStaff[]>('/admin/staff');
        const mine = fresh.find((s) => s.id === created.id);
        if (mine) select(mine);
      } else if (selected) {
        await api.patch(`/admin/staff/${selected.id}`, payload);
        setSuccess('Bilgiler güncellendi.');
        await load();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
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

  async function deactivate() {
    if (!selected) return;
    if (
      !confirm(
        `${selected.fullName} pasife alınsın mı? Geçmiş randevuları korunur, yeni randevu alınamaz.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/staff/${selected.id}`);
      setSuccess('Personel pasife alındı.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız.');
    }
  }

  const formOpen = creating || selected !== null;

  return (
    <>
      <PanelHeader
        title="Personel"
        description="Hekim kadrosu, çalışma saatleri ve izinler. Buradaki değişiklikler randevu takvimine anında yansır."
        action={
          <Button size="sm" onClick={startNew}>
            <Icon name="plus" size={15} /> Yeni Personel
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        {/* ── Liste ── */}
        <div>
          {items === null ? (
            <div className="grid gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon="user"
              title="Personel kaydı yok"
              description="İlk hekiminizi ekleyerek başlayın."
              action={
                <Button size="sm" className="mt-2" onClick={startNew}>
                  Yeni Personel
                </Button>
              }
            />
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
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-tint">
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full place-items-center text-brand">
                            <Icon name="user" size={20} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {m.fullName}
                          {!m.isActive && (
                            <span className="ml-2 rounded-full bg-line-soft px-2 py-0.5 text-[0.6875rem] font-normal text-ink-faint">
                              Pasif
                            </span>
                          )}
                        </p>
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

        {/* ── Detay / form ── */}
        <div>
          {!formOpen ? (
            <EmptyState
              icon="user"
              title="Personel seçin"
              description="Bilgilerini düzenlemek için soldan bir hekim seçin ya da yeni personel ekleyin."
              action={
                <Button size="sm" className="mt-2" onClick={startNew}>
                  <Icon name="plus" size={15} /> Yeni Personel
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              <h2 className="font-display text-xl font-semibold">
                {creating ? 'Yeni personel' : selected?.fullName}
              </h2>

              {/* Yeni personelde takvim/izin sekmesi yok: kayıt henüz yok. */}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['bilgiler', 'Bilgiler'],
                    ['takvim', 'Çalışma takvimi'],
                    ['izinler', 'İzinler'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    disabled={creating && v === 'izinler'}
                    onClick={() => setTab(v)}
                    aria-pressed={tab === v}
                    className={cx(
                      'rounded-full border px-4 py-1.5 text-sm transition-all duration-300',
                      tab === v
                        ? 'border-brand bg-brand text-brand-contrast'
                        : 'border-line text-ink-muted hover:border-brand hover:text-brand',
                      creating && v === 'izinler' && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {error && <ErrorNote>{error}</ErrorNote>}
              {success && <SuccessNote>{success}</SuccessNote>}

              {/* ── Bilgiler ── */}
              {tab === 'bilgiler' && (
                <Card className="p-6">
                  <form onSubmit={saveInfo} className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Ad Soyad" required htmlFor="fullName">
                        <Input
                          id="fullName"
                          required
                          maxLength={120}
                          placeholder="Dr. Ayşe Yılmaz"
                          value={form.fullName}
                          onChange={(e) => {
                            const fullName = e.target.value;
                            setForm((f) => ({
                              ...f,
                              fullName,
                              // Adres yalnızca YENİ kayıtta addan türetilir;
                              // mevcut kayıtta değiştirmek bağlantıları kırar.
                              slug: creating ? slugify(fullName) : f.slug,
                            }));
                          }}
                        />
                      </Field>
                      <Field label="Unvan" required htmlFor="title">
                        <Input
                          id="title"
                          required
                          maxLength={80}
                          placeholder="Veteriner Hekim"
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <Field
                      label="Adres (slug)"
                      required
                      htmlFor="slug"
                      hint="Sitedeki bağlantı adresi. Değiştirmek eski bağlantıları kırar."
                    >
                      <Input
                        id="slug"
                        required
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Uzmanlık" htmlFor="speciality">
                        <Input
                          id="speciality"
                          maxLength={120}
                          placeholder="Dermatoloji & Beslenme"
                          value={form.speciality}
                          onChange={(e) =>
                            setForm({ ...form, speciality: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Deneyim (yıl)" htmlFor="exp">
                        <Input
                          id="exp"
                          type="number"
                          min="0"
                          max="70"
                          value={form.experienceYears}
                          onChange={(e) =>
                            setForm({ ...form, experienceYears: e.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Eğitim" htmlFor="education">
                      <Input
                        id="education"
                        maxLength={160}
                        placeholder="Ankara Üniversitesi Veteriner Fakültesi"
                        value={form.education}
                        onChange={(e) =>
                          setForm({ ...form, education: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Kısa biyografi" htmlFor="bio">
                      <Textarea
                        id="bio"
                        maxLength={600}
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      />
                    </Field>

                    <Field
                      label="Fotoğraf adresi"
                      htmlFor="photo"
                      hint="Görsel yükleyip adresini buraya yapıştırabilirsiniz"
                    >
                      <Input
                        id="photo"
                        type="url"
                        placeholder="https://…"
                        value={form.photoUrl}
                        onChange={(e) =>
                          setForm({ ...form, photoUrl: e.target.value })
                        }
                      />
                    </Field>

                    {/* Hizmet eşlemesi müsaitlik motorunu doğrudan besler:
                        seçilmeyen hizmet için bu hekime randevu verilmez. */}
                    <div>
                      <span className="text-xs font-medium tracking-wider text-ink-faint uppercase">
                        Verdiği hizmetler
                      </span>
                      <p className="mt-1 text-sm text-ink-muted">
                        Yalnızca işaretlenen hizmetler için randevu alınabilir.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {services.map((sv) => {
                          const checked = form.serviceIds.includes(sv.id);
                          return (
                            <label
                              key={sv.id}
                              className={cx(
                                'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors',
                                checked
                                  ? 'border-brand bg-tint/50'
                                  : 'border-line hover:border-brand',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    serviceIds: e.target.checked
                                      ? [...f.serviceIds, sv.id]
                                      : f.serviceIds.filter((x) => x !== sv.id),
                                  }))
                                }
                                className="h-4 w-4 accent-[var(--color-brand)]"
                              />
                              <span className="truncate">{sv.title}</span>
                            </label>
                          );
                        })}
                      </div>
                      {form.serviceIds.length === 0 && (
                        <p className="mt-2 text-xs text-danger">
                          Hiç hizmet seçilmedi — bu hekime randevu alınamaz.
                        </p>
                      )}
                    </div>

                    <label className="flex items-center gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm({ ...form, isActive: e.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--color-brand)]"
                      />
                      Aktif (sitede görünür, randevu alınabilir)
                    </label>

                    {creating && (
                      <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">
                        Kaydettikten sonra çalışma takvimi otomatik oluşturulur
                        (Pazartesi–Cuma 09:00–18:00). Takvim sekmesinden
                        düzenleyebilirsiniz.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" loading={saving}>
                        {creating ? 'Personeli Ekle' : 'Bilgileri Kaydet'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setCreating(false);
                          setSelected(null);
                        }}
                      >
                        Vazgeç
                      </Button>
                      {!creating && selected?.isActive && (
                        <Button
                          type="button"
                          variant="quiet"
                          onClick={() => void deactivate()}
                          className="ml-auto text-danger hover:text-danger"
                        >
                          <Icon name="trash" size={15} /> Pasife al
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>
              )}

              {/* ── Çalışma takvimi ── */}
              {tab === 'takvim' && (
                <Card className="p-6">
                  <h3 className="font-sans text-base font-semibold">
                    Çalışma takvimi
                  </h3>
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
                          onChange={(e) =>
                            updateWindow(i, { startTime: e.target.value })
                          }
                          className="rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums"
                        />
                        <span className="text-ink-faint">–</span>
                        <input
                          type="time"
                          value={w.endTime}
                          onChange={(e) =>
                            updateWindow(i, { endTime: e.target.value })
                          }
                          className="rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setWindows((ws) => ws.filter((_, n) => n !== i))
                          }
                          aria-label="Aralığı kaldır"
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
                    {creating ? (
                      <p className="self-center text-sm text-ink-muted">
                        Takvim, personel kaydedilince oluşturulur.
                      </p>
                    ) : (
                      <Button size="sm" loading={saving} onClick={() => void saveSchedule()}>
                        Takvimi kaydet
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* ── İzinler ── */}
              {tab === 'izinler' && selected && (
                <Card className="p-6">
                  <h3 className="font-sans text-base font-semibold">İzinler</h3>
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
              )}
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

/** Türkçe karakterleri URL'e uygun hale getirir. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
