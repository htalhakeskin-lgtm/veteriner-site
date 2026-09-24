import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ApiError, api } from '~/lib/api';
import {
  GENDER_OPTIONS,
  SPECIES_OPTIONS,
  petAge,
  speciesLabel,
} from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Pet } from '~/lib/types';
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
  Textarea,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Hayvanlarım',
    description: 'Kayıtlı evcil hayvanlarınız.',
    path: '/hesap/hayvanlarim',
    noindex: true,
  });
}

const EMPTY = {
  name: '',
  species: 'CAT',
  breed: '',
  birthDate: '',
  gender: 'UNKNOWN',
  weightKg: '',
  color: '',
  isNeutered: false,
  microchipNo: '',
  notes: '',
};

export default function MyPets() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPets(await api.get<Pet[]>('/pets'));
    } catch {
      setPets([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/pets', {
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        birthDate: form.birthDate ? `${form.birthDate}T00:00:00.000Z` : undefined,
        gender: form.gender,
        // Boş metin gönderilirse sayı doğrulaması patlar.
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        color: form.color || undefined,
        isNeutered: form.isNeutered,
        microchipNo: form.microchipNo || undefined,
        notes: form.notes || undefined,
      });
      setForm({ ...EMPTY });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PanelHeader
        title="Hayvanlarım"
        description="Her dostunuzun sağlık geçmişi ve aşı takvimi burada tutulur."
        action={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Icon name={showForm ? 'x' : 'plus'} size={15} />
            {showForm ? 'Vazgeç' : 'Hayvan Ekle'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-8 p-6 md:p-8">
          <h2 className="font-sans text-lg font-semibold">Yeni dost ekleyin</h2>
          <form onSubmit={save} className="mt-6 grid gap-5">
            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Adı" required htmlFor="name">
                <Input
                  id="name"
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Türü" required htmlFor="species">
                <Select
                  id="species"
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                >
                  {SPECIES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Cinsi" htmlFor="breed">
                <Input
                  id="breed"
                  maxLength={80}
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                />
              </Field>
              <Field label="Doğum tarihi" htmlFor="birthDate">
                <Input
                  id="birthDate"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Cinsiyet" htmlFor="gender">
                <Select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Kilo (kg)" htmlFor="weight">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="200"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
              </Field>
              <Field label="Rengi" htmlFor="color">
                <Input
                  id="color"
                  maxLength={40}
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Mikroçip numarası" htmlFor="chip">
              <Input
                id="chip"
                maxLength={40}
                placeholder="TR-982..."
                value={form.microchipNo}
                onChange={(e) => setForm({ ...form, microchipNo: e.target.value })}
              />
            </Field>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.isNeutered}
                onChange={(e) => setForm({ ...form, isNeutered: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Kısırlaştırılmış
            </label>

            <Field label="Notlar" htmlFor="notes" hint="Alerji, kronik durum vb.">
              <Textarea
                id="notes"
                maxLength={500}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                Kaydet
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Vazgeç
              </Button>
            </div>
          </form>
        </Card>
      )}

      {pets === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : pets.length === 0 ? (
        <EmptyState
          icon="paw"
          title="Henüz hayvan eklemediniz"
          description="Dostunuzu ekleyin; randevu alırken tekrar tekrar bilgi girmek zorunda kalmazsınız."
          action={
            <Button size="sm" className="mt-2" onClick={() => setShowForm(true)}>
              Hayvan Ekle
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <Link key={pet.id} to={`/hesap/hayvanlarim/${pet.id}`}>
              <Card hover className="h-full p-6">
                <div className="flex items-start gap-4">
                  <IconFrame name="paw" size={48} />
                  <div className="min-w-0">
                    <h2 className="truncate font-sans text-base font-semibold">
                      {pet.name}
                    </h2>
                    <p className="truncate text-sm text-ink-muted">
                      {speciesLabel(pet.species)}
                      {pet.breed && ` · ${pet.breed}`}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-faint">
                      {petAge(pet.birthDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-4 border-t border-line-soft pt-4 text-xs text-ink-muted">
                  <span>{pet._count?.appointments ?? 0} randevu</span>
                  <span>{pet._count?.medicalRecords ?? 0} sağlık kaydı</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
