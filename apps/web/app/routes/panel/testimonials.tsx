import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatDate, speciesLabel } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Testimonial } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  Skeleton,
  SuccessNote,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Yorumlar — Yönetim',
    description: 'Müşteri yorumlarını onaylayın veya gizleyin.',
    path: '/panel/yorumlar',
    noindex: true,
  });
}

type AdminTestimonial = Testimonial & {
  isApproved: boolean;
  externalId: string | null;
};

export default function AdminTestimonials() {
  const [items, setItems] = useState<AdminTestimonial[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    const q = filter === 'pending' ? '?approved=false' : '';
    try {
      setItems(await api.get<AdminTestimonial[]>(`/admin/testimonials${q}`));
    } catch {
      setItems([]);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(t: AdminTestimonial) {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/admin/testimonials/${t.id}`, { isApproved: !t.isApproved });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    await api.delete(`/admin/testimonials/${id}`).catch(() => undefined);
    await load();
  }

  async function syncGoogle() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<{ synced: number; skipped: boolean }>(
        '/admin/testimonials/sync-google',
      );
      setSuccess(
        res.skipped
          ? 'Google Place ID veya API anahtarı tanımlı değil — senkronizasyon atlandı.'
          : `${res.synced} Google yorumu işlendi.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Senkronizasyon başarısız.');
    } finally {
      setBusy(false);
    }
  }

  const pending = items?.filter((t) => !t.isApproved).length ?? 0;

  return (
    <>
      <PanelHeader
        title="Yorumlar"
        description={
          pending > 0
            ? `${pending} yorum onay bekliyor`
            : 'Tüm yorumlar incelendi'
        }
        action={
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            onClick={() => void syncGoogle()}
          >
            <Icon name="google" size={15} /> Google&apos;dan çek
          </Button>
        }
      />

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {success && (
        <div className="mb-5">
          <SuccessNote>{success}</SuccessNote>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(
          [
            ['all', 'Tümü'],
            ['pending', 'Onay bekleyen'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            aria-pressed={filter === v}
            className={cx(
              'rounded-full border px-4.5 py-2 text-sm transition-all duration-300',
              filter === v
                ? 'border-brand bg-brand text-brand-contrast'
                : 'border-line text-ink-muted hover:border-brand hover:text-brand',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="star" title="Yorum yok" />
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <Card key={t.id} className={cx('p-5', !t.isApproved && 'border-dashed')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-brand">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Icon key={i} name="star" size={14} />
                      ))}
                    </div>
                    {t.source === 'GOOGLE' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-line-soft px-2 py-0.5 text-[0.6875rem] text-ink-muted">
                        <Icon name="google" size={11} /> Google
                      </span>
                    )}
                    {!t.isApproved && (
                      <span className="rounded-full bg-tint px-2 py-0.5 text-[0.6875rem] text-brand">
                        Yayında değil
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium">{t.authorName}</p>
                  {t.petName && (
                    <p className="text-sm text-ink-muted">
                      {t.petName}
                      {t.petSpecies && ` · ${speciesLabel(t.petSpecies)}`}
                    </p>
                  )}
                </div>
                <time className="text-xs text-ink-faint">
                  {formatDate(t.displayDate)}
                </time>
              </div>

              <p className="mt-3 leading-relaxed text-ink-muted">{t.text}</p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                <Button
                  size="sm"
                  variant={t.isApproved ? 'ghost' : 'primary'}
                  loading={busy}
                  onClick={() => void toggle(t)}
                >
                  <Icon name={t.isApproved ? 'x' : 'check'} size={14} />
                  {t.isApproved ? 'Yayından kaldır' : 'Yayınla'}
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => void remove(t.id)}
                  className="ml-auto text-danger hover:text-danger"
                >
                  <Icon name="trash" size={14} /> Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
