import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { api } from '~/lib/api';
import { formatDateTime } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Notification } from '~/lib/types';
import {
  Button, Card, EmptyState, Icon, IconFrame, Skeleton, cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Bildirimler',
    description: 'Randevu ve aşı hatırlatmaları.',
    path: '/hesap/bildirimler',
    noindex: true,
  });
}

const ICON: Record<string, string> = {
  APPOINTMENT_CREATED: 'calendar',
  APPOINTMENT_CONFIRMED: 'check',
  APPOINTMENT_CANCELLED: 'x',
  APPOINTMENT_REMINDER: 'bell',
  VACCINATION_DUE: 'syringe',
  SYSTEM: 'file',
};

export default function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Notification[]>('/notifications'));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markAll() {
    setBusy(true);
    try {
      await api.patch('/notifications/read-all', {});
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    // Iyimser guncelleme: sunucu yanitini beklemeden isaretliyoruz,
    // liste anlik tepki versin.
    setItems((prev) =>
      prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? null,
    );
    await api.patch(`/notifications/${id}/read`, {}).catch(() => void load());
  }

  const unread = items?.filter((n) => !n.isRead).length ?? 0;

  return (
    <>
      <PanelHeader
        title="Bildirimler"
        description={unread > 0 ? `${unread} okunmamış bildirim` : 'Tümü okundu'}
        action={
          unread > 0 ? (
            <Button size="sm" variant="ghost" loading={busy} onClick={() => void markAll()}>
              <Icon name="check" size={15} /> Tümünü okundu işaretle
            </Button>
          ) : undefined
        }
      />

      {items === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Bildiriminiz yok"
          description="Randevu onayları ve aşı hatırlatmaları burada görünecek."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((n) => {
            const body = (
              <Card
                className={cx(
                  'flex items-start gap-4 p-5 transition-colors',
                  !n.isRead && 'border-brand/40 bg-tint/30',
                )}
              >
                <IconFrame name={ICON[n.type] ?? 'bell'} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-brand" aria-label="Okunmadı" />
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{n.message}</p>
                  <p className="mt-2 text-xs text-ink-faint">{formatDateTime(n.createdAt)}</p>
                </div>
              </Card>
            );

            return (
              <div key={n.id} onClick={() => !n.isRead && void markOne(n.id)}>
                {n.linkUrl ? <Link to={n.linkUrl}>{body}</Link> : body}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
