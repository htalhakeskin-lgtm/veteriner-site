import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { api } from '~/lib/api';
import { useAuth } from '~/lib/auth';
import { formatDate, formatDateTime, speciesLabel } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment, MedicalRecord, Pet } from '~/lib/types';
import {
  Card,
  EmptyState,
  Icon,
  IconFrame,
  LinkButton,
  Skeleton,
  StatusBadge,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Hesabım',
    description: 'Randevularınız ve evcil hayvanlarınız.',
    path: '/hesap',
    noindex: true,
  });
}

interface DueRecord extends MedicalRecord {
  petName?: string;
  petId?: string;
}

export default function AccountDashboard() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [due, setDue] = useState<DueRecord[]>([]);

  useEffect(() => {
    void (async () => {
      const [p, a] = await Promise.all([
        api.get<Pet[]>('/pets').catch(() => []),
        api.get<Appointment[]>('/appointments/me?upcoming=true').catch(() => []),
      ]);
      setPets(p);
      setAppointments(a);

      // Yaklasan asilari her hayvan icin toplayip tek listede gosteriyoruz.
      const schedules = await Promise.all(
        p.map((pet) =>
          api
            .get<MedicalRecord[]>(`/pets/${pet.id}/vaccination-schedule`)
            .then((rows) =>
              rows.map((r) => ({ ...r, petName: pet.name, petId: pet.id })),
            )
            .catch(() => []),
        ),
      );
      const soon = schedules
        .flat()
        .filter((r) => {
          if (!r.nextDueAt) return false;
          const diff = new Date(r.nextDueAt).getTime() - Date.now();
          // Gecikmis olanlar ve onumuzdeki 60 gun icindekiler
          return diff < 60 * 86_400_000;
        })
        .sort(
          (a, b) =>
            new Date(a.nextDueAt!).getTime() - new Date(b.nextDueAt!).getTime(),
        )
        .slice(0, 4);
      setDue(soon);
    })();
  }, []);

  const next = appointments?.[0];
  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <PanelHeader
        title={`Merhaba, ${firstName}`}
        description="Yaklaşan randevularınız ve dostlarınızın durumu."
        action={
          <LinkButton to="/randevu" size="sm">
            <Icon name="plus" size={15} /> Randevu Al
          </LinkButton>
        }
      />

      {/* ── Ozet sayilar ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="calendar"
          label="Yaklaşan randevu"
          value={appointments?.length}
        />
        <StatCard icon="paw" label="Kayıtlı dostunuz" value={pets?.length} />
        <StatCard icon="syringe" label="Yaklaşan aşı" value={due.length} />
      </div>

      {/* ── Sonraki randevu ── */}
      <section className="mt-10">
        <h2 className="font-sans text-lg font-semibold">Sıradaki randevunuz</h2>
        <div className="mt-4">
          {appointments === null ? (
            <Skeleton className="h-32 w-full" />
          ) : next ? (
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <IconFrame name="calendar" size={48} />
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {formatDateTime(next.startAt)}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {next.service.title}
                      {next.staff && ` · ${next.staff.fullName}`}
                      {next.pet && ` · ${next.pet.name}`}
                    </p>
                    <p className="mt-2 font-mono text-xs text-ink-faint">
                      {next.code}
                    </p>
                  </div>
                </div>
                <StatusBadge status={next.status} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line-soft pt-5">
                <LinkButton to="/hesap/randevularim" variant="ghost" size="sm">
                  Tüm randevularım
                </LinkButton>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon="calendar"
              title="Yaklaşan randevunuz yok"
              description="Dostunuz için kontrol zamanı geldiyse hemen randevu alabilirsiniz."
              action={
                <LinkButton to="/randevu" size="sm" className="mt-2">
                  Randevu Al
                </LinkButton>
              }
            />
          )}
        </div>
      </section>

      {/* ── Yaklasan asilar ── */}
      {due.length > 0 && (
        <section className="mt-10">
          <h2 className="font-sans text-lg font-semibold">Yaklaşan aşı ve kontroller</h2>
          <div className="mt-4 grid gap-3">
            {due.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <IconFrame
                  name="syringe"
                  size={40}
                  className={r.isOverdue ? 'bg-danger/10 text-danger' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.petName} — {r.title}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {r.isOverdue ? 'Gecikmiş: ' : 'Tarih: '}
                    {formatDate(r.nextDueAt)}
                  </p>
                </div>
                <LinkButton to="/randevu" variant="ghost" size="sm">
                  Randevu al
                </LinkButton>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Hayvanlarim ── */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sans text-lg font-semibold">Dostlarınız</h2>
          <Link
            to="/hesap/hayvanlarim"
            className="text-sm text-brand transition-opacity hover:opacity-80"
          >
            Tümünü gör
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets === null ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : pets.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon="paw"
                title="Henüz hayvan eklemediniz"
                description="Dostunuzu ekleyin, sağlık geçmişi ve aşı takvimi burada birikmeye başlasın."
                action={
                  <LinkButton to="/hesap/hayvanlarim" size="sm" className="mt-2">
                    Hayvan Ekle
                  </LinkButton>
                }
              />
            </div>
          ) : (
            pets.map((pet) => (
              <Link key={pet.id} to={`/hesap/hayvanlarim/${pet.id}`}>
                <Card hover className="flex h-full items-center gap-4 p-5">
                  <IconFrame name="paw" size={46} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{pet.name}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {speciesLabel(pet.species)}
                      {pet.breed && ` · ${pet.breed}`}
                    </p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | undefined;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <IconFrame name={icon} size={44} />
      <div>
        <div className="font-display text-2xl leading-none font-semibold">
          {value ?? '—'}
        </div>
        <div className="mt-1 text-sm text-ink-muted">{label}</div>
      </div>
    </Card>
  );
}
