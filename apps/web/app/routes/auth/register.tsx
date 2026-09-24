import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { ApiError } from '~/lib/api';
import { useAuth } from '~/lib/auth';
import { buildMeta } from '~/lib/seo';
import { Button, Card, ErrorNote, Field, Input } from '~/components/ui';

export function meta() {
  return buildMeta({
    title: 'Hesap Oluştur',
    description: 'Randevularınızı ve sağlık kayıtlarınızı takip edin.',
    path: '/kayit',
    noindex: true,
  });
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    passwordAgain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Sunucu bunu kontrol etmiyor (tek şifre alanı aliyor); burada
    // yakalamak kullanıcıyı yanlış şifreyle kayıtlı kalmaktan korur.
    if (form.password !== form.passwordAgain) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      navigate('/hesap', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Kayıt oluşturulamadı.',
      );
      setLoading(false);
    }
  }

  return (
    <Card className="p-8 md:p-10">
      <h1 className="text-2xl">Hesap oluşturun</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Randevu geçmişiniz, aşı takvimi ve sağlık kayıtları tek yerde.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-5">
        {error && <ErrorNote>{error}</ErrorNote>}

        <Field label="Ad Soyad" required htmlFor="fullName">
          <Input
            id="fullName"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            autoFocus
            value={form.fullName}
            onChange={update('fullName')}
          />
        </Field>

        <Field label="E-posta" required htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />
        </Field>

        <Field
          label="Telefon"
          htmlFor="phone"
          hint="Randevu hatırlatmaları için — isteğe bağlı"
        >
          <Input
            id="phone"
            type="tel"
            placeholder="0532 000 00 00"
            autoComplete="tel"
            value={form.phone}
            onChange={update('phone')}
          />
        </Field>

        <Field label="Şifre" required htmlFor="password" hint="En az 8 karakter">
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
        </Field>

        <Field label="Şifre tekrar" required htmlFor="passwordAgain">
          <Input
            id="passwordAgain"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.passwordAgain}
            onChange={update('passwordAgain')}
          />
        </Field>

        <Button type="submit" loading={loading} className="w-full">
          Hesap Oluştur
        </Button>

        <p className="text-xs leading-relaxed text-ink-faint">
          Kayıt olarak{' '}
          <Link to="/kvkk" className="text-brand underline underline-offset-2">
            KVKK aydınlatma metnini
          </Link>{' '}
          okuduğunuzu kabul etmiş olursunuz.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Zaten hesabınız var mı?{' '}
        <Link to="/giris" className="font-medium text-brand underline underline-offset-2">
          Giriş yapın
        </Link>
      </p>
    </Card>
  );
}
