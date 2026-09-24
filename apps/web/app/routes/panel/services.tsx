import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatPrice } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Service } from '~/lib/types';
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
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Hizmetler — Yönetim',
    description: 'Hizmet ekleme ve düzenleme.',
    path: '/panel/hizmetler',
    noindex: true,
  });
}

type AdminService = Service & {
  isActive: boolean;
  sortOrder: number;
  _count: { appointments: number };
};

const ICONS = [
  'stethoscope', 'syringe', 'scissors', 'scan', 'flask',
  'heart', 'shield', 'smile', 'cpu', 'activity',
];

const EMPTY = {
  slug: '',
  title: '',
  shortDesc: '',
  longDesc: '',
  icon: 'stethoscope',
  category: 'Genel',
  price: '',
  durationMinutes: '30',
  isFeatured: false,
  isActive: true,
};

export default function AdminServices() {
  const [items, setItems] = useState<AdminService[] | null>(null);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<AdminService[]>('/admin/services'));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError(null);
    setSuccess(null);
  }

  function startEdit(s: AdminService) {
    setEditing(s);
    setForm({
      slug: s.slug,
      title: s.title,
      shortDesc: s.shortDesc,
      longDesc: s.longDesc ?? '',
      icon: s.icon ?? 'stethoscope',
      category: s.category,
      price: s.price ?? '',
      durationMinutes: String(s.durationMinutes),
      isFeatured: s.isFeatured,
      isActive: s.isActive,
    });
    setError(null);
    setSuccess(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        slug: form.slug,
        title: form.title,
        shortDesc: form.shortDesc,
        longDesc: form.longDesc || undefined,
        icon: form.icon,
        category: form.category,
        price: form.price ? Number(form.price) : undefined,
        durationMinutes: Number(form.durationMinutes),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/admin/services/${editing.id}`, payload);
        setSuccess('Hizmet güncellendi.');
      } else {
        await api.post('/admin/services', payload);
        setSuccess('Hizmet eklendi.');
        setForm({ ...EMPTY });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(s: AdminService) {
    // Silme degil pasife alma: gecmis randevular bu hizmete bagli.
    if (!confirm(`"${s.title}" hizmetini pasife almak istediğinize emin misiniz?`))
      return;
    try {
      await api.delete(`/admin/services/${s.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız.');
    }
  }

  return (
    <>
      <PanelHeader
        title="Hizmetler"
        description="Sitede görünen hizmetleri buradan yönetin."
        action={
          <Button size="sm" onClick={startNew}>
            <Icon name="plus" size={15} /> Yeni Hizmet
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* ── Liste ── */}
        <div>
          {items === null ? (
            <div className="grid gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon="stethoscope" title="Henüz hizmet yok" />
          ) : (
            <div className="grid gap-3">
              {items.map((s) => (
                <Card
                  key={s.id}
                  className={cx(
                    'p-4',
                    editing?.id === s.id && 'border-brand bg-tint/40',
                    !s.isActive && 'opacity-60',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <IconFrame name={s.icon ?? 'stethoscope'} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{s.title}</p>
                        {s.isFeatured && (
                          <span className="rounded-full bg-tint px-2 py-0.5 text-[0.6875rem] text-brand">
                            Öne çıkan
                          </span>
                        )}
                        {!s.isActive && (
                          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[0.6875rem] text-ink-faint">
                            Pasif
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink-muted">
                        {s.shortDesc}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        {s.category} · {s.durationMinutes} dk ·{' '}
                        {formatPrice(s.price)} · {s._count.appointments} randevu
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        aria-label="Düzenle"
                        className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-brand"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      {s.isActive && (
                        <button
                          type="button"
                          onClick={() => void deactivate(s)}
                          aria-label="Pasife al"
                          className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-danger"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Form ── */}
        <Card className="p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-sans text-lg font-semibold">
            {editing ? `Düzenle: ${editing.title}` : 'Yeni hizmet'}
          </h2>

          <form onSubmit={save} className="mt-5 grid gap-4">
            {error && <ErrorNote>{error}</ErrorNote>}
            {success && <SuccessNote>{success}</SuccessNote>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Başlık" required htmlFor="title">
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      // Yeni kayitta slug'i basliktan turet; duzenlemede
                      // dokunma, degistirmek eski baglantilari kirar.
                      slug: editing ? f.slug : slugify(title),
                    }));
                  }}
                />
              </Field>
              <Field label="URL adresi" required htmlFor="slug" hint="Değiştirmek bağlantıları kırar">
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="font-mono text-sm"
                />
              </Field>
            </div>

            <Field label="Kısa açıklama" required htmlFor="short">
              <Input
                id="short"
                required
                value={form.shortDesc}
                onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
              />
            </Field>

            <Field label="Uzun açıklama" htmlFor="long">
              <Textarea
                id="long"
                value={form.longDesc}
                onChange={(e) => setForm({ ...form, longDesc: e.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategori" required htmlFor="cat">
                <Input
                  id="cat"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </Field>
              <Field label="İkon" htmlFor="icon">
                <Select
                  id="icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  {ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Süre (dakika)"
                required
                htmlFor="dur"
                hint="Randevu slotlarını belirler"
              >
                <Input
                  id="dur"
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                />
              </Field>
              <Field label="Ücret (TL)" htmlFor="price" hint="Boş bırakılabilir">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="50"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-brand)]"
                />
                Ana sayfada göster
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-brand)]"
                />
                Aktif
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                {editing ? 'Güncelle' : 'Ekle'}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={startNew}>
                  Yeni hizmete geç
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

/** Turkce karakterleri URL'e uygun hale getirir. */
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
