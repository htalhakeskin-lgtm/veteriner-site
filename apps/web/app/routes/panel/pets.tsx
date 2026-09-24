import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import {
  RECORD_TYPE_OPTIONS,
  formatDate,
  petAge,
  recordTypeLabel,
  speciesLabel,
} from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { MedicalRecord, Pet, StaffMember } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  IconFrame,
  Input,
  Select,
  Skeleton,
  SuccessNote,
  Textarea,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Hastalar — Yönetim',
    description: 'Hasta kayıtları ve sağlık geçmişi girişi.',
    path: '/panel/hastalar',
    noindex: true,
  });
}

type AdminPet = Pet & {
  owner: { id: string; fullName: string; phone: string | null };
};

export default function AdminPets() {
  const [q, setQ] = useState('');
  const [pets, setPets] = useState<AdminPet[] | null>(null);
  const [selected, setSelected] = useState<AdminPet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [form, setForm] = useState({
    type: 'EXAMINATION',
    title: '',
    description: '',
    performedAt: new Date().toISOString().slice(0, 10),
    nextDueAt: '',
    staffId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void api.get<StaffMember[]>('/staff').then(setStaff).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setPets(null);
    const query = new URLSearchParams();
    if (q.trim()) query.set('q', q.trim());
    try {
      setPets(await api.get<AdminPet[]>(`/admin/pets?${query}`));
    } catch {
      setPets([]);
    }
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function open(pet: AdminPet) {
    setSelected(pet);
    setSuccess(null);
    setError(null);
    setRecords([]);
    try {
      setRecords(await api.get<MedicalRecord[]>(`/pets/${pet.id}/medical-records`));
    } catch {
      setRecords([]);
    }
  }

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/medical-records', {
        petId: selected.id,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        performedAt: `${form.performedAt}T09:00:00.000Z`,
        nextDueAt: form.nextDueAt ? `${form.nextDueAt}T09:00:00.000Z` : undefined,
        staffId: form.staffId || undefined,
      });
      setSuccess('Sağlık kaydı eklendi.');
      setForm({ ...form, title: '', description: '', nextDueAt: '' });
      setRecords(await api.get<MedicalRecord[]>(`/pets/${selected.id}/medical-records`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kayıt eklenemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PanelHeader
        title="Hastalar"
        description="Hasta kaydı seçip sağlık geçmişine kayıt girin."
      />

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Hayvan adı, mikroçip veya sahip adı ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* ── Hasta listesi ── */}
        <div>
          {pets === null ? (
            <div className="grid gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : pets.length === 0 ? (
            <EmptyState icon="paw" title="Hasta bulunamadı" />
          ) : (
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
              {pets.map((pet) => (
                <button key={pet.id} type="button" onClick={() => void open(pet)}>
                  <Card
                    hover
                    className={
                      selected?.id === pet.id
                        ? 'border-brand bg-tint/40 p-4 text-left'
                        : 'p-4 text-left'
                    }
                  >
                    <div className="flex items-start gap-3">
                      <IconFrame name="paw" size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{pet.name}</p>
                        <p className="truncate text-sm text-ink-muted">
                          {speciesLabel(pet.species)}
                          {pet.breed && ` · ${pet.breed}`} · {petAge(pet.birthDate)}
                        </p>
                        <p className="truncate text-xs text-ink-faint">
                          {pet.owner.fullName}
                          {pet.owner.phone && ` · ${pet.owner.phone}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Seçili hasta ── */}
        <div>
          {!selected ? (
            <EmptyState
              icon="file"
              title="Hasta seçin"
              description="Soldaki listeden bir hasta seçerek sağlık geçmişini görüntüleyebilir ve yeni kayıt girebilirsiniz."
            />
          ) : (
            <>
              <Card className="p-6">
                <h2 className="font-sans text-lg font-semibold">
                  {selected.name}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {speciesLabel(selected.species)}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Sahip: {selected.owner.fullName}
                  {selected.owner.phone && ` · ${selected.owner.phone}`}
                </p>
                {selected.microchipNo && (
                  <p className="mt-1 font-mono text-xs text-ink-faint">
                    {selected.microchipNo}
                  </p>
                )}
                {selected.notes && (
                  <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                    {selected.notes}
                  </p>
                )}
              </Card>

              {/* Yeni kayıt */}
              <Card className="mt-4 p-6">
                <h3 className="font-sans text-base font-semibold">
                  Sağlık kaydı ekle
                </h3>
                <form onSubmit={addRecord} className="mt-5 grid gap-4">
                  {error && <ErrorNote>{error}</ErrorNote>}
                  {success && <SuccessNote>{success}</SuccessNote>}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tür" required htmlFor="type">
                      <Select
                        id="type"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        {RECORD_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Hekim" htmlFor="staff">
                      <Select
                        id="staff"
                        value={form.staffId}
                        onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                      >
                        <option value="">Seçilmedi</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Başlık" required htmlFor="title">
                    <Input
                      id="title"
                      required
                      maxLength={120}
                      placeholder="Karma Aşı, Genel Muayene…"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </Field>

                  <Field label="Açıklama" htmlFor="desc">
                    <Textarea
                      id="desc"
                      maxLength={2000}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Uygulama tarihi" required htmlFor="performed">
                      <Input
                        id="performed"
                        type="date"
                        required
                        value={form.performedAt}
                        onChange={(e) =>
                          setForm({ ...form, performedAt: e.target.value })
                        }
                      />
                    </Field>
                    <Field
                      label="Tekrar tarihi"
                      htmlFor="next"
                      hint="Aşılarda hatırlatma için"
                    >
                      <Input
                        id="next"
                        type="date"
                        value={form.nextDueAt}
                        onChange={(e) =>
                          setForm({ ...form, nextDueAt: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <Button type="submit" loading={saving} className="justify-self-start">
                    <Icon name="plus" size={15} /> Kaydet
                  </Button>
                </form>
              </Card>

              {/* Geçmiş */}
              <div className="mt-4">
                <h3 className="mb-3 font-sans text-base font-semibold">
                  Sağlık geçmişi ({records.length})
                </h3>
                {records.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
                    Henüz kayıt yok.
                  </p>
                ) : (
                  <Card className="divide-y divide-line-soft">
                    {records.map((r) => (
                      <div key={r.id} className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="rounded-full bg-tint px-2 py-0.5 text-[0.6875rem] font-medium text-brand">
                              {recordTypeLabel(r.type)}
                            </span>
                            <p className="mt-1.5 font-medium">{r.title}</p>
                          </div>
                          <span className="text-sm text-ink-muted">
                            {formatDate(r.performedAt)}
                          </span>
                        </div>
                        {r.description && (
                          <p className="mt-2 text-sm text-ink-muted">{r.description}</p>
                        )}
                        {r.nextDueAt && (
                          <p className="mt-1.5 text-xs text-brand">
                            Tekrar: {formatDate(r.nextDueAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
