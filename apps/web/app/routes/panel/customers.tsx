import { useCallback, useEffect, useState } from 'react';

import { api } from '~/lib/api';
import { formatDate } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { AuthUser, Paginated } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  Skeleton,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Müşteriler — Yönetim',
    description: 'Kayıtlı müşteri listesi.',
    path: '/panel/musteriler',
    noindex: true,
  });
}

type Customer = AuthUser & {
  createdAt: string;
  lastLoginAt: string | null;
  _count: { pets: number; appointments: number };
};

export default function AdminCustomers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Customer> | null>(null);

  const load = useCallback(async () => {
    setData(null);
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (q.trim()) query.set('q', q.trim());
    try {
      setData(await api.get<Paginated<Customer>>(`/users?${query}`));
    } catch {
      setData({ items: [], total: 0, page: 1, limit: 20, pageCount: 0 });
    }
  }, [q, page]);

  useEffect(() => {
    // Arama yazarken her tusa basista istek atmamak icin kisa bekleme.
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      <PanelHeader
        title="Müşteriler"
        description={data ? `${data.total} kayıtlı kullanıcı` : 'Yükleniyor…'}
      />

      <div className="mb-6 max-w-md">
        <Input
          placeholder="İsim, e-posta veya telefon ara…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1); // Yeni aramada 1. sayfaya don
          }}
        />
      </div>

      {data === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="users"
          title="Müşteri bulunamadı"
          description={q ? 'Aramanızla eşleşen kayıt yok.' : 'Henüz kayıtlı müşteri yok.'}
        />
      ) : (
        <>
          {/* Masaustunde tablo, mobilde kart: dar ekranda tablo yatay
              kaydirma gerektirir ve okunmaz hale gelir. */}
          <div className="hidden overflow-hidden rounded-lg border border-line md:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr>
                  <Th>Ad Soyad</Th>
                  <Th>İletişim</Th>
                  <Th>Rol</Th>
                  <Th className="text-center">Hayvan</Th>
                  <Th className="text-center">Randevu</Th>
                  <Th>Üyelik</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2">
                    <Td className="font-medium">{c.fullName}</Td>
                    <Td>
                      <span className="block text-ink-muted">{c.email}</span>
                      {c.phone && (
                        <span className="block text-xs text-ink-faint">{c.phone}</span>
                      )}
                    </Td>
                    <Td>
                      <RoleBadge role={c.role} />
                    </Td>
                    <Td className="text-center tabular-nums">{c._count.pets}</Td>
                    <Td className="text-center tabular-nums">
                      {c._count.appointments}
                    </Td>
                    <Td className="text-ink-muted">{formatDate(c.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {data.items.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.fullName}</p>
                    <p className="truncate text-sm text-ink-muted">{c.email}</p>
                    {c.phone && (
                      <p className="text-xs text-ink-faint">{c.phone}</p>
                    )}
                  </div>
                  <RoleBadge role={c.role} />
                </div>
                <div className="mt-3 flex gap-4 border-t border-line-soft pt-3 text-xs text-ink-muted">
                  <span>{c._count.pets} hayvan</span>
                  <span>{c._count.appointments} randevu</span>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
              </Card>
            ))}
          </div>

          {data.pageCount > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icon name="arrow-left" size={15} /> Önceki
              </Button>
              <span className="text-sm text-ink-muted tabular-nums">
                {data.page} / {data.pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= data.pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki <Icon name="arrow" size={15} />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Müşteri',
  STAFF: 'Personel',
  ADMIN: 'Yönetici',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cx(
        'inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
        role === 'ADMIN'
          ? 'bg-brand text-brand-contrast'
          : role === 'STAFF'
            ? 'bg-tint text-brand'
            : 'bg-line-soft text-ink-muted',
      )}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cx(
        'px-4 py-3 text-xs font-medium tracking-wider text-ink-faint uppercase',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cx('px-4 py-3', className)}>{children}</td>;
}
