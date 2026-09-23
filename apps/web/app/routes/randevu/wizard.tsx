import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { ApiError, api } from '~/lib/api';
import { useAuth } from '~/lib/auth';
import {
  SPECIES_OPTIONS,
  dayKey,
  formatDateTime,
  speciesLabel,
  weekdayShort,
} from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type {
  Appointment,
  Availability,
  Pet,
  Service,
  StaffMember,
  Slot,
} from '~/lib/types';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Icon,
  IconFrame,
  Input,
  LinkButton,
  Select,
  Skeleton,
  Textarea,
  cx,
} from '~/components/ui';

export function meta() {
  return buildMeta({
    title: 'Online Randevu Al',
    description:
      'Üç adımda randevunuzu oluşturun. Müsait saatleri canlı görün, hekiminizi seçin.',
    path: '/randevu',
  });
}

const STEPS = ['Hizmet', 'Tarih & Saat', 'Bilgiler', 'Onay'] as const;

export default function Wizard() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [weekStart, setWeekStart] = useState(() => startOfToday());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({
    petId: '',
    guestPetName: '',
    guestPetSpecies: 'CAT',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Appointment | null>(null);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  // ── Baslangic verisi ──
  useEffect(() => {
    void (async () => {
      const [svc, stf] = await Promise.all([
        api.get<Service[]>('/services').catch(() => []),
        api.get<StaffMember[]>('/staff').catch(() => []),
      ]);
      setServices(svc);
      setStaff(stf);

      // Hizmet/hekim sayfa baglantisiyla gelmis olabilir
      // (or. /randevu?hizmet=asilama).
      const svcSlug = params.get('hizmet');
      if (svcSlug) {
        const found = svc.find((s) => s.slug === svcSlug);
        if (found) setServiceId(found.id);
      }
      const staffSlug = params.get('hekim');
      if (staffSlug) {
        const found = stf.find((s) => s.slug === staffSlug);
        if (found) setStaffId(found.id);
      }
    })();
  }, [params]);

  // Uyenin kayitli hayvanlari
  useEffect(() => {
    if (!user) return;
    void api
      .get<Pet[]>('/pets')
      .then((p) => {
        setPets(p);
        if (p.length > 0) setForm((f) => ({ ...f, petId: p[0]!.id }));
      })
      .catch(() => setPets([]));
  }, [user]);

  // ── Musaitlik ──
  const loadAvailability = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const from = dayKey(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const query = new URLSearchParams({ serviceId, from, to: dayKey(end) });
      if (staffId) query.set('staffId', staffId);

      const data = await api.get<Availability>(`/availability?${query}`);
      setAvailability(data);

      // Ilk musait gunu otomatik sec: kullanici bos bir takvime bakmasin.
      const firstOpen = data.days.find((d) => d.isOpen && d.slots.length > 0);
      setSelectedDay(firstOpen?.date ?? null);
    } catch (err) {
      setAvailability(null);
      setError(
        err instanceof ApiError ? err.message : 'Müsait saatler alınamadı.',
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, staffId, weekStart]);

  useEffect(() => {
    if (step === 1) void loadAvailability();
  }, [step, loadAvailability]);

  const dayData = availability?.days.find((d) => d.date === selectedDay);

  // ── Gonderim ──
  async function submit() {
    if (!slot || !service) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        serviceId: service.id,
        startAt: slot.start,
        staffId: slot.staffId,
        notes: form.notes || undefined,
      };

      if (user) {
        if (form.petId) payload.petId = form.petId;
        else {
          payload.guestPetName = form.guestPetName || undefined;
          payload.guestPetSpecies = form.guestPetSpecies;
        }
      } else {
        payload.guestName = form.guestName;
        payload.guestPhone = form.guestPhone;
        payload.guestEmail = form.guestEmail || undefined;
        payload.guestPetName = form.guestPetName || undefined;
        payload.guestPetSpecies = form.guestPetSpecies;
      }

      const created = await api.post<Appointment>('/appointments', payload);
      setResult(created);
      setStep(4);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Randevu oluşturulamadı.';
      setError(message);
      // Slot kapildiysa kullaniciyi saat secimine geri gonder ve
      // listeyi tazele; aksi halde ayni dolu saati tekrar denerdi.
      if (err instanceof ApiError && (err.code === 'SLOT_TAKEN' || err.status === 400)) {
        setSlot(null);
        setStep(1);
        void loadAvailability();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Basari ekrani ──
  if (step === 4 && result) {
    return (
      <section className="py-18 md:py-28">
        <div className="wrap max-w-[620px]">
          <Card className="p-10 text-center">
            <IconFrame name="check" size={64} className="mx-auto" />
            <h1 className="mt-6 text-3xl">Randevunuz oluşturuldu</h1>
            <p className="mt-3 text-ink-muted">
              {result.status === 'CONFIRMED'
                ? 'Randevunuz onaylandı.'
                : 'Klinik onayladığında size haber vereceğiz.'}
            </p>

            <dl className="mt-8 grid gap-3 rounded-md border border-line bg-surface-2 p-6 text-left text-sm">
              <Row label="Randevu kodu" value={result.code} mono />
              <Row label="Hizmet" value={result.service.title} />
              <Row label="Tarih" value={formatDateTime(result.startAt)} />
              {result.staff && <Row label="Hekim" value={result.staff.fullName} />}
            </dl>

            <p className="mt-6 text-sm text-ink-muted">
              Kodunuzu saklayın — üye değilseniz randevunuzu bu kod ve telefon
              numaranızla sorgulayabilirsiniz.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton to={user ? '/hesap/randevularim' : '/randevu-sorgula'}>
                {user ? 'Randevularım' : 'Randevu Sorgula'}
              </LinkButton>
              <LinkButton to="/" variant="ghost">
                Ana sayfaya dön
              </LinkButton>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20">
      <div className="wrap max-w-[860px]">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)]">Online randevu</h1>
        <p className="mt-3 text-ink-muted">
          Müsait saatleri canlı görüyorsunuz. Seçtiğiniz saat anında ayrılır.
        </p>

        {/* ── Adim gostergesi ── */}
        <ol className="mt-10 flex flex-wrap gap-x-2 gap-y-3" aria-label="Adımlar">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={step === i ? 'step' : undefined}
                className={cx(
                  'grid h-7 w-7 place-items-center rounded-full text-xs font-medium transition-colors duration-300',
                  i < step
                    ? 'bg-brand text-brand-contrast'
                    : i === step
                      ? 'bg-brand text-brand-contrast'
                      : 'bg-line-soft text-ink-faint',
                )}
              >
                {i < step ? <Icon name="check" size={13} /> : i + 1}
              </span>
              <span
                className={cx(
                  'text-sm',
                  i === step ? 'font-medium text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 hidden h-px w-8 bg-line sm:block" />
              )}
            </li>
          ))}
        </ol>

        {error && (
          <div className="mt-8">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {/* ── Adim 1: Hizmet ── */}
        {step === 0 && (
          <div className="mt-10">
            <h2 className="font-sans text-lg font-semibold">
              Hangi hizmet için geliyorsunuz?
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  aria-pressed={serviceId === s.id}
                  className={cx(
                    'flex items-start gap-4 rounded-lg border p-5 text-left transition-all duration-300 ease-soft',
                    serviceId === s.id
                      ? 'border-brand bg-tint'
                      : 'border-line bg-surface hover:border-brand',
                  )}
                >
                  <IconFrame name={s.icon ?? 'stethoscope'} size={42} />
                  <span className="flex-1">
                    <span className="block font-medium">{s.title}</span>
                    <span className="mt-1 block text-sm text-ink-muted">
                      {s.shortDesc}
                    </span>
                    <span className="mt-2 inline-block rounded-full bg-line-soft px-2 py-0.5 text-[0.6875rem] text-ink-muted">
                      {s.durationMinutes} dk
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <Field label="Hekim tercihi" htmlFor="hekim" hint="Boş bırakırsanız ilk müsait hekime atanır">
                <Select
                  id="hekim"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">Farketmez</option>
                  {staff
                    .filter(
                      (m) =>
                        !serviceId ||
                        m.services?.some((sv) => sv.id === serviceId),
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} — {m.title}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>

            <div className="mt-8 flex justify-end">
              <Button disabled={!serviceId} onClick={() => setStep(1)}>
                Devam <Icon name="arrow" size={17} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Adim 2: Tarih & Saat ── */}
        {step === 1 && (
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-sans text-lg font-semibold">
                Uygun bir saat seçin
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftWeek(-7)}
                  disabled={dayKey(weekStart) <= dayKey(startOfToday())}
                  aria-label="Önceki hafta"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  <Icon name="arrow-left" size={15} />
                </button>
                <span className="text-sm text-ink-muted tabular-nums">
                  {weekLabel(weekStart)}
                </span>
                <button
                  type="button"
                  onClick={() => shiftWeek(7)}
                  aria-label="Sonraki hafta"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </div>

            {loadingSlots ? (
              <div className="mt-6 grid gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <>
                {/* Gun secici */}
                <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {availability?.days.map((d) => {
                    const date = new Date(`${d.date}T00:00:00`);
                    const usable = d.isOpen && d.slots.length > 0;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        disabled={!usable}
                        onClick={() => setSelectedDay(d.date)}
                        aria-pressed={selectedDay === d.date}
                        className={cx(
                          'grid gap-0.5 rounded-md border px-2 py-3 text-center transition-all duration-300',
                          selectedDay === d.date
                            ? 'border-brand bg-brand text-brand-contrast'
                            : usable
                              ? 'border-line bg-surface hover:border-brand'
                              : 'cursor-not-allowed border-line-soft bg-surface-2 opacity-50',
                        )}
                      >
                        <span className="text-[0.6875rem] uppercase">
                          {weekdayShort(date)}
                        </span>
                        <span className="text-lg font-medium tabular-nums">
                          {date.getDate()}
                        </span>
                        <span className="text-[0.625rem]">
                          {usable ? `${d.slots.length} saat` : 'Kapalı'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Saat secici */}
                <div className="mt-8">
                  {dayData && dayData.slots.length > 0 ? (
                    <>
                      <p className="text-sm text-ink-muted">
                        {service?.durationMinutes} dakikalık{' '}
                        <strong className="font-medium text-ink">
                          {service?.title}
                        </strong>{' '}
                        için müsait saatler:
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                        {dayData.slots.map((sl) => (
                          <button
                            key={sl.start}
                            type="button"
                            onClick={() => setSlot(sl)}
                            aria-pressed={slot?.start === sl.start}
                            title={sl.staffName}
                            className={cx(
                              'rounded-md border py-2.5 text-sm tabular-nums transition-all duration-300',
                              slot?.start === sl.start
                                ? 'border-brand bg-brand text-brand-contrast'
                                : 'border-line bg-surface hover:border-brand hover:text-brand',
                            )}
                          >
                            {sl.time}
                          </button>
                        ))}
                      </div>
                      {slot && (
                        <p className="mt-4 text-sm text-ink-muted">
                          Seçilen: <strong className="text-ink">{slot.time}</strong> ·{' '}
                          {slot.staffName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
                      {availability?.days.every((d) => !d.isOpen)
                        ? 'Bu hafta klinik kapalı. Sonraki haftaya bakın.'
                        : 'Bu gün için müsait saat kalmadı. Başka bir gün seçin.'}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mt-10 flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <Icon name="arrow-left" size={17} /> Geri
              </Button>
              <Button disabled={!slot} onClick={() => setStep(2)}>
                Devam <Icon name="arrow" size={17} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Adim 3: Bilgiler ── */}
        {step === 2 && (
          <div className="mt-10">
            <h2 className="font-sans text-lg font-semibold">
              {user ? 'Hangi dostunuz için?' : 'İletişim bilgileriniz'}
            </h2>

            <div className="mt-6 grid gap-5">
              {user ? (
                pets.length > 0 ? (
                  <Field label="Evcil hayvanınız" htmlFor="pet">
                    <Select
                      id="pet"
                      value={form.petId}
                      onChange={(e) => setForm((f) => ({ ...f, petId: e.target.value }))}
                    >
                      {pets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {speciesLabel(p.species)}
                          {p.breed ? ` (${p.breed})` : ''}
                        </option>
                      ))}
                      <option value="">Listede yok / yeni hayvan</option>
                    </Select>
                  </Field>
                ) : (
                  <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">
                    Kayıtlı hayvanınız yok. Aşağıya bilgilerini yazabilir, sonra
                    hesabınızdan kaydedebilirsiniz.
                  </p>
                )
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Adınız Soyadınız" required htmlFor="ad">
                      <Input
                        id="ad"
                        required
                        value={form.guestName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, guestName: e.target.value }))
                        }
                        autoComplete="name"
                      />
                    </Field>
                    <Field
                      label="Telefon"
                      required
                      htmlFor="tel"
                      hint="Onay mesajı bu numaraya gider"
                    >
                      <Input
                        id="tel"
                        type="tel"
                        required
                        placeholder="0532 000 00 00"
                        value={form.guestPhone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, guestPhone: e.target.value }))
                        }
                        autoComplete="tel"
                      />
                    </Field>
                  </div>
                  <Field label="E-posta" htmlFor="eposta" hint="İsteğe bağlı">
                    <Input
                      id="eposta"
                      type="email"
                      value={form.guestEmail}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, guestEmail: e.target.value }))
                      }
                      autoComplete="email"
                    />
                  </Field>
                </>
              )}

              {(!user || !form.petId) && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Hayvanın adı" htmlFor="hayvan">
                    <Input
                      id="hayvan"
                      value={form.guestPetName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, guestPetName: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Türü" htmlFor="tur">
                    <Select
                      id="tur"
                      value={form.guestPetSpecies}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, guestPetSpecies: e.target.value }))
                      }
                    >
                      {SPECIES_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}

              <Field
                label="Not"
                htmlFor="not"
                hint="Şikâyet, belirti veya bilmemiz gereken bir şey"
              >
                <Textarea
                  id="not"
                  maxLength={500}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>

              {!user && (
                <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">
                  <Icon name="user" size={15} className="mr-1.5 inline text-brand" />
                  Üye olursanız randevularınızı ve sağlık kayıtlarınızı takip
                  edebilirsiniz.{' '}
                  <a href="/kayit" className="text-brand underline underline-offset-2">
                    Hesap oluştur
                  </a>
                </p>
              )}
            </div>

            <div className="mt-10 flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <Icon name="arrow-left" size={17} /> Geri
              </Button>
              <Button
                disabled={!user && (!form.guestName || !form.guestPhone)}
                onClick={() => setStep(3)}
              >
                Devam <Icon name="arrow" size={17} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Adim 4: Onay ── */}
        {step === 3 && slot && service && (
          <div className="mt-10">
            <h2 className="font-sans text-lg font-semibold">Randevu özeti</h2>

            <Card className="mt-6 divide-y divide-line-soft">
              <SummaryRow icon="stethoscope" label="Hizmet" value={service.title} />
              <SummaryRow
                icon="calendar"
                label="Tarih ve saat"
                value={formatDateTime(slot.start)}
              />
              <SummaryRow icon="user" label="Hekim" value={slot.staffName} />
              <SummaryRow icon="clock" label="Süre" value={`${service.durationMinutes} dakika`} />
              <SummaryRow
                icon="paw"
                label="Hasta"
                value={
                  form.petId
                    ? (pets.find((p) => p.id === form.petId)?.name ?? '—')
                    : form.guestPetName || 'Belirtilmedi'
                }
              />
              {!user && (
                <SummaryRow
                  icon="phone"
                  label="İletişim"
                  value={`${form.guestName} · ${form.guestPhone}`}
                />
              )}
              {form.notes && (
                <SummaryRow icon="file" label="Not" value={form.notes} />
              )}
            </Card>

            <p className="mt-5 text-sm leading-relaxed text-ink-muted">
              Randevunuzu onaylamanızla birlikte bu saat sizin adınıza ayrılır.
              Gelemeyecekseniz lütfen önceden haber verin.
            </p>

            <div className="mt-10 flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting}>
                <Icon name="arrow-left" size={17} /> Geri
              </Button>
              <Button onClick={submit} loading={submitting}>
                <Icon name="check" size={17} /> Randevuyu onayla
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  function shiftWeek(days: number) {
    setSlot(null);
    setWeekStart((w) => {
      const next = new Date(w);
      next.setDate(next.getDate() + days);
      const today = startOfToday();
      return next < today ? today : next;
    });
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <IconFrame name={icon} size={38} />
      <div>
        <div className="text-xs tracking-[0.06em] text-ink-faint uppercase">
          {label}
        </div>
        <div className="mt-0.5 font-medium">{value}</div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cx('font-medium', mono && 'font-mono tabular-nums')}>{value}</dd>
    </div>
  );
}
