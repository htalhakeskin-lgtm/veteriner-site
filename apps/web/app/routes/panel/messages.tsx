import { useCallback, useEffect, useState } from 'react';

import { api } from '~/lib/api';
import { formatDateTime } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import {
  Button,
  Card,
  EmptyState,
  Icon,
  IconFrame,
  Skeleton,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Mesajlar — Yönetim',
    description: 'İletişim formundan gelen mesajlar.',
    path: '/panel/mesajlar',
    noindex: true,
  });
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminMessages() {
  const [items, setItems] = useState<ContactMessage[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    setItems(null);
    const q = filter === 'unread' ? '?isRead=false' : '';
    try {
      setItems(await api.get<ContactMessage[]>(`/admin/contact-messages${q}`));
    } catch {
      setItems([]);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    // Iyimser güncelleme: liste anlık tepki versin.
    setItems(
      (prev) => prev?.map((m) => (m.id === id ? { ...m, isRead: true } : m)) ?? null,
    );
    await api
      .patch(`/admin/contact-messages/${id}/read`, {})
      .catch(() => void load());
  }

  async function markReplied(id: string) {
    await api
      .patch(`/admin/contact-messages/${id}/replied`, {})
      .catch(() => undefined);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    await api.delete(`/admin/contact-messages/${id}`).catch(() => undefined);
    await load();
  }

  const unread = items?.filter((m) => !m.isRead).length ?? 0;

  return (
    <>
      <PanelHeader
        title="Mesajlar"
        description={unread > 0 ? `${unread} okunmamış mesaj` : 'Tümü okundu'}
      />

      <div className="mb-6 flex gap-2">
        {(
          [
            ['all', 'Tümü'],
            ['unread', 'Okunmamış'],
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
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="mail"
          title="Mesaj yok"
          description="İletişim formundan gelen mesajlar burada görünür."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <Card
              key={m.id}
              className={cx('p-5', !m.isRead && 'border-brand/40 bg-tint/20')}
              onClick={() => !m.isRead && void markRead(m.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <IconFrame name="mail" size={40} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {m.subject}
                      {!m.isRead && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand" />
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {m.name} ·{' '}
                      <a href={`mailto:${m.email}`} className="hover:text-brand">
                        {m.email}
                      </a>
                      {m.phone && (
                        <>
                          {' · '}
                          <a href={`tel:${m.phone}`} className="hover:text-brand">
                            {m.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-ink-faint">
                  {formatDateTime(m.createdAt)}
                </time>
              </div>

              <p className="mt-4 rounded-md bg-surface-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-muted">
                {m.message}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon name="mail" size={14} /> Yanıtla
                </a>
                {m.repliedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1.5 text-xs text-brand">
                    <Icon name="check" size={13} /> Yanıtlandı
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void markReplied(m.id)}
                  >
                    <Icon name="check" size={14} /> Yanıtlandı işaretle
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => void remove(m.id)}
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
