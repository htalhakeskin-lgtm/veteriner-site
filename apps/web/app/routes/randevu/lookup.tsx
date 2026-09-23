import { useState } from 'react';

import { ApiError, api } from '~/lib/api';
import { formatDateTime } from '~/lib/format';
import { buildMeta } from '~/lib/seo';
import type { Appointment } from '~/lib/types';
import {
  Button, Card, ErrorNote, Field, Icon, IconFrame, Input, LinkButton, StatusBadge,
} from '~/components/ui';
import { PageHero } from '~/components/sections/page-hero';

export function meta() {
  return buildMeta({
    title: 'Randevu Sorgula',
    description: 'Randevu kodunuz ve telefon numaranızla randevunuzu sorgulayın.',
    path: '/randevu-sorgula',
  });
}

export default function Lookup() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Appointment | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const q = new URLSearchParams({ code: code.trim(), phone: phone.trim() });
      setResult(await api.get<Appointment>(`/appointments/lookup?${q}`));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Randevu bulunamadı. Kod ve telefonu kontrol edin.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Randevu"
        title="Randevunuzu sorgulayın"
        lede="Üye değilseniz, randevu kodunuz ve telefon numaranızla durumunu görebilirsiniz."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap max-w-[560px]">
          <Card className="p-8">
            <form onSubmit={submit} className="grid gap-5">
              {error && <ErrorNote>{error}</ErrorNote>}

              <Field label="Randevu kodu" required htmlFor="code" hint="Örn: RND-2026-0042">
                <Input
                  id="code"
                  required
                  autoFocus
                  placeholder="RND-2026-0042"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </Field>

              <Field label="Telefon numaranız" required htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="0532 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>

              <Button type="submit" loading={loading}>
                <Icon name="search" size={17} /> Sorgula
              </Button>
            </form>
          </Card>

          {result && (
            <Card className="mt-6 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <IconFrame name="calendar" size={48} />
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {formatDateTime(result.startAt)}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {result.service.title}
                      {result.staff && ` · ${result.staff.fullName}`}
                    </p>
                    <p className="mt-2 font-mono text-xs text-ink-faint">{result.code}</p>
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </div>

              {result.status === 'CANCELLED' && (
                <p className="mt-5 border-t border-line-soft pt-5 text-sm text-ink-muted">
                  Bu randevu iptal edilmiş. Yeni bir randevu oluşturabilirsiniz.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-line-soft pt-5">
                <LinkButton to="/randevu" variant="ghost" size="sm">
                  Yeni randevu al
                </LinkButton>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-ink-faint">
                Randevunuzu iptal etmek veya değiştirmek için lütfen kliniği arayın.
              </p>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
