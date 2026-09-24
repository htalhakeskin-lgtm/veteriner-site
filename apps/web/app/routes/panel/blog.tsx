import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatDate } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { BlogPost } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
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
    title: 'Blog — Yönetim',
    description: 'Blog yazılarını ekleyin ve düzenleyin.',
    path: '/panel/blog',
    noindex: true,
  });
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

type AdminPost = BlogPost & {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

const EMPTY = {
  slug: '',
  title: '',
  excerpt: '',
  contentHtml: '',
  coverImageUrl: '',
  categoryId: '',
  status: 'DRAFT',
  metaTitle: '',
  metaDescription: '',
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api.get<AdminPost[]>('/admin/blog/posts'),
        api.get<Category[]>('/blog/categories').catch(() => []),
      ]);
      setPosts(p);
      setCategories(c);
    } catch {
      setPosts([]);
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

  async function startEdit(post: AdminPost) {
    setError(null);
    setSuccess(null);
    try {
      // Liste yanıtı contentHtml içermiyor; düzenlemek için tam kaydı çekiyoruz.
      const full = await api.get<AdminPost>(`/admin/blog/posts/${post.id}`);
      setEditing(full);
      setForm({
        slug: full.slug,
        title: full.title,
        excerpt: full.excerpt,
        contentHtml: full.contentHtml ?? '',
        coverImageUrl: full.coverImageUrl ?? '',
        categoryId: full.categoryId ?? '',
        status: full.status,
        metaTitle: full.metaTitle ?? '',
        metaDescription: full.metaDescription ?? '',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yazı yüklenemedi.');
    }
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
        excerpt: form.excerpt,
        contentHtml: form.contentHtml,
        coverImageUrl: form.coverImageUrl || undefined,
        categoryId: form.categoryId || undefined,
        status: form.status,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      };

      if (editing) {
        await api.patch(`/admin/blog/posts/${editing.id}`, payload);
        setSuccess('Yazı güncellendi.');
      } else {
        await api.post('/admin/blog/posts', payload);
        setSuccess('Yazı oluşturuldu.');
        setForm({ ...EMPTY });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(post: AdminPost) {
    if (!confirm(`"${post.title}" yazısını silmek istediğinize emin misiniz?`))
      return;
    try {
      await api.delete(`/admin/blog/posts/${post.id}`);
      if (editing?.id === post.id) startNew();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
    }
  }

  return (
    <>
      <PanelHeader
        title="Blog"
        description="Yazılarınızı ekleyin, düzenleyin ve yayınlayın."
        action={
          <Button size="sm" onClick={startNew}>
            <Icon name="plus" size={15} /> Yeni Yazı
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ── Liste ── */}
        <div>
          {posts === null ? (
            <div className="grid gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState icon="file" title="Henüz yazı yok" />
          ) : (
            <div className="grid max-h-[75vh] gap-3 overflow-y-auto pr-1">
              {posts.map((p) => (
                <Card
                  key={p.id}
                  className={cx('p-4', editing?.id === p.id && 'border-brand bg-tint/40')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void startEdit(p)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip status={p.status} />
                        {p.category && (
                          <span className="text-[0.6875rem] text-ink-faint">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 font-medium">{p.title}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {p.publishedAt ? formatDate(p.publishedAt) : 'Taslak'} ·{' '}
                        {p.readMinutes} dk · {p.viewCount} görüntülenme
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(p)}
                      aria-label="Sil"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:text-danger"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Form ── */}
        <Card className="p-6">
          <h2 className="font-sans text-lg font-semibold">
            {editing ? 'Yazıyı düzenle' : 'Yeni yazı'}
          </h2>

          <form onSubmit={save} className="mt-5 grid gap-4">
            {error && <ErrorNote>{error}</ErrorNote>}
            {success && <SuccessNote>{success}</SuccessNote>}

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
                    // Yayındaki bir yazının adresi değişirse eski bağlantılar
                    // kırılır; slug yalnızca yeni yazıda otomatik üretilir.
                    slug: editing ? f.slug : slugify(title),
                  }));
                }}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="URL adresi"
                required
                htmlFor="slug"
                hint="Değiştirmek eski bağlantıları kırar"
              >
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="font-mono text-sm"
                />
              </Field>
              <Field label="Kategori" htmlFor="cat">
                <Select
                  id="cat"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Seçilmedi</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Özet"
              required
              htmlFor="excerpt"
              hint="Liste sayfasında ve arama sonuçlarında görünür"
            >
              <Textarea
                id="excerpt"
                required
                maxLength={300}
                className="min-h-20"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </Field>

            <Field
              label="İçerik (HTML)"
              required
              htmlFor="content"
              hint="Kaydederken güvenli olmayan etiketler temizlenir"
            >
              <Textarea
                id="content"
                required
                className="min-h-64 font-mono text-sm"
                placeholder="<p>Yazınızın ilk paragrafı…</p>"
                value={form.contentHtml}
                onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
              />
            </Field>

            <Field label="Kapak görseli adresi" htmlFor="cover">
              <Input
                id="cover"
                type="url"
                placeholder="https://…"
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              />
            </Field>

            <details className="rounded-md border border-line px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                Arama motoru ayarları
              </summary>
              <div className="mt-4 grid gap-4">
                <Field label="Meta başlık" htmlFor="metaTitle" hint="Boşsa yazı başlığı kullanılır">
                  <Input
                    id="metaTitle"
                    maxLength={70}
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  />
                </Field>
                <Field
                  label="Meta açıklama"
                  htmlFor="metaDesc"
                  hint="Boşsa özet kullanılır"
                >
                  <Textarea
                    id="metaDesc"
                    maxLength={160}
                    className="min-h-16"
                    value={form.metaDescription}
                    onChange={(e) =>
                      setForm({ ...form, metaDescription: e.target.value })
                    }
                  />
                </Field>
              </div>
            </details>

            <Field label="Durum" htmlFor="status">
              <Select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="DRAFT">Taslak (sitede görünmez)</option>
                <option value="PUBLISHED">Yayında</option>
                <option value="ARCHIVED">Arşiv</option>
              </Select>
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={saving}>
                {editing ? 'Güncelle' : 'Oluştur'}
              </Button>
              {editing && (
                <>
                  <Button type="button" variant="ghost" onClick={startNew}>
                    Yeni yazıya geç
                  </Button>
                  {editing.status === 'PUBLISHED' && (
                    <a
                      href={`/blog/${editing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-brand hover:text-brand"
                    >
                      <Icon name="arrow" size={14} /> Sitede gör
                    </a>
                  )}
                </>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cx(
        'rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
        status === 'PUBLISHED'
          ? 'bg-brand text-brand-contrast'
          : status === 'DRAFT'
            ? 'bg-tint text-brand'
            : 'bg-line-soft text-ink-faint',
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

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
