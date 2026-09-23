import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { ApiError, api } from '~/lib/api';
import { buildMeta } from '~/lib/seo';
import { Button, Card, ErrorNote, Field, Input, SuccessNote } from '~/components/ui';

export function meta() {
  return buildMeta({
    title: 'Yeni Şifre Belirle',
    description: 'Hesabınız için yeni bir şifre oluşturun.',
    path: '/sifre-sifirla',
    noindex: true,
  });
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== again) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      // Kullaniciyi bilgilendirip giris sayfasina gonderiyoruz.
      setTimeout(() => navigate('/giris', { replace: true }), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.',
      );
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="p-8 md:p-10">
        <h1 className="text-2xl">Geçersiz bağlantı</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Şifre sıfırlama bağlantısı eksik veya bozuk. Lütfen yeniden talep edin.
        </p>
        <Link
          to="/sifremi-unuttum"
          className="mt-6 inline-block text-sm font-medium text-brand underline underline-offset-2"
        >
          Yeni bağlantı iste
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-10">
      <h1 className="text-2xl">Yeni şifre belirleyin</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Güvenliğiniz için diğer cihazlardaki oturumlar kapatılacak.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-5">
        {error && <ErrorNote>{error}</ErrorNote>}
        {done && (
          <SuccessNote>
            Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz…
          </SuccessNote>
        )}

        <Field label="Yeni şifre" required htmlFor="password" hint="En az 8 karakter">
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={done}
          />
        </Field>

        <Field label="Yeni şifre tekrar" required htmlFor="again">
          <Input
            id="again"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            disabled={done}
          />
        </Field>

        <Button type="submit" loading={loading} disabled={done} className="w-full">
          Şifreyi Güncelle
        </Button>
      </form>
    </Card>
  );
}
