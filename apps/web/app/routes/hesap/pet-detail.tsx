import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiError, api } from '~/lib/api';
import {
  formatDate,
  genderLabel,
  petAge,
  recordTypeLabel,
  speciesLabel,
} from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { MedicalRecord, Pet } from '~/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  IconFrame,
  LinkButton,
  Skeleton,
  cx,
} from '~/components/ui';
import { PanelHeader } from '~/components/layout/panel-shell';

export function meta() {
  return buildMeta({
    title: 'Sağlık Kartı',
    description: 'Evcil hayvanınızın sağlık geçmişi.',
    noindex: true,
  });
}

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[] | null>(null);
  const [schedule, setSchedule] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [p, r, s] = await Promise.all([
          api.get<Pet>(`/pets/${id}`),
          api.get<MedicalRecord[]>(`/pets/${id}/medical-records`).catch(() => []),
          api.get<MedicalRecord[]>(`/pets/${id}/vaccination-schedule`).catch(() => []),
        ]);
        setPet(p);
        setRecords(r);
        setSchedule(s);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Kayıt yüklenemedi.',
        );
        setRecords([]);
      }
    })();
  }, [id]);

  async function remove() {
    if (!pet) return;
    if (
      !confirm(
        `${pet.name} kaydını kaldırmak istediğinize emin misiniz? Sağlık geçmişi klinikte saklanmaya devam eder.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await api.delete(`/pets/${pet.id}`);
      navigate('/hesap/hayvanlarim', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <>
        <PanelHeader title="Sağlık kartı" />
        <ErrorNote>{error}</ErrorNote>
        <LinkButton to="/hesap/hayvanlarim" variant="ghost" size="sm" className="mt-5">
          <Icon name="arrow-left" size={15} /> Hayvanlarıma dön
        </LinkButton>
      </>
    );
  }

  if (!pet) {
    return (
      <>
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </>
    );
  }

  return (
    <>
      <Link
        to="/hesap/hayvanlarim"
        className="mb-5 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={15} /> Hayvanlarım
      </Link>

      <PanelHeader
        title={pet.name}
        description={`${speciesLabel(pet.species)}${pet.breed ? ` · ${pet.breed}` : ''} · ${petAge(pet.birthDate)}`}
        action={
          <LinkButton to="/randevu" size="sm">
            <Icon name="calendar" size={15} /> Randevu Al
          </LinkButton>
        }
      />

      {/* ── Kunye ── */}
      <Card className="p-6">
        <h2 className="font-sans text-base font-semibold">Künye</h2>
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Tür" value={speciesLabel(pet.species)} />
          <Detail label="Cins" value={pet.breed ?? '—'} />
          <Detail label="Cinsiyet" value={genderLabel(pet.gender)} />
          <Detail label="Doğum tarihi" value={formatDate(pet.birthDate)} />
          <Detail label="Kilo" value={pet.weightKg ? `${pet.weightKg} kg` : '—'} />
          <Detail label="Renk" value={pet.color ?? '—'} />
          <Detail
            label="Kısırlaştırma"
            value={pet.isNeutered ? 'Yapıldı' : 'Yapılmadı'}
          />
          <Detail label="Mikroçip" value={pet.microchipNo ?? '—'} mono />
        </dl>
        {pet.notes && (
          <p className="mt-5 rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-muted">
            {pet.notes}
          </p>
        )}
      </Card>

      {/* ── Asi takvimi ── */}
      {schedule.length > 0 && (
        <section className="mt-8">
          <h2 className="font-sans text-lg font-semibold">Aşı takvimi</h2>
          <div className="mt-4 grid gap-3">
            {schedule.map((r) => (
              <Card
                key={r.id}
                className={cx(
                  'flex flex-wrap items-center gap-4 p-4',
                  r.isOverdue && 'border-danger/40',
                )}
              >
                <IconFrame
                  name="syringe"
                  size={40}
                  className={r.isOverdue ? 'bg-danger/10 text-danger' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-ink-muted">
                    Son uygulama: {formatDate(r.performedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cx(
                      'text-sm font-medium',
                      r.isOverdue ? 'text-danger' : 'text-brand',
                    )}
                  >
                    {r.isOverdue ? 'Gecikmiş' : 'Sıradaki'}
                  </p>
                  <p className="text-sm text-ink-muted">{formatDate(r.nextDueAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Saglik gecmisi ── */}
      <section className="mt-8">
        <h2 className="font-sans text-lg font-semibold">Sağlık geçmişi</h2>
        <div className="mt-4">
          {records === null ? (
            <Skeleton className="h-40" />
          ) : records.length === 0 ? (
            <EmptyState
              icon="file"
              title="Henüz kayıt yok"
              description="Muayene ve aşı kayıtları klinik tarafından girildikçe burada görünecek."
            />
          ) : (
            /* Zaman cizelgesi: sol tarafta dikey cizgi, her kayit bir nokta */
            <ol className="relative grid gap-5 border-l border-line pl-6">
              {records.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute top-1.5 -left-[1.9rem] grid h-4 w-4 place-items-center rounded-full border-2 border-bg bg-brand" />
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-tint px-2.5 py-1 text-[0.6875rem] font-medium text-brand">
                          {recordTypeLabel(r.type)}
                        </span>
                        <h3 className="mt-2 font-sans text-base font-semibold">
                          {r.title}
                        </h3>
                      </div>
                      <time className="text-sm text-ink-muted">
                        {formatDate(r.performedAt)}
                      </time>
                    </div>
                    {r.description && (
                      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-faint">
                      {r.staff && <span>{r.staff.fullName}</span>}
                      {r.appointment && (
                        <span className="font-mono">{r.appointment.code}</span>
                      )}
                      {r.nextDueAt && (
                        <span>Tekrar: {formatDate(r.nextDueAt)}</span>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="mt-10 border-t border-line pt-6">
        <Button
          variant="quiet"
          size="sm"
          loading={deleting}
          onClick={() => void remove()}
          className="text-danger hover:text-danger"
        >
          <Icon name="trash" size={15} /> Kaydı kaldır
        </Button>
        <p className="mt-2 text-xs text-ink-faint">
          Sağlık geçmişi klinik kayıtlarında saklanmaya devam eder.
        </p>
      </div>
    </>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs tracking-[0.06em] text-ink-faint uppercase">{label}</dt>
      <dd className={cx('mt-0.5 font-medium', mono && 'font-mono text-sm')}>
        {value}
      </dd>
    </div>
  );
}
