import { useState } from 'react';
import { Link } from 'react-router';

import { ApiError, api } from '~/lib/api';
import { buildMeta } from '~/lib/seo';
import { Button, Card, ErrorNote, Field, IconFrame, Input } from '~/components/ui';

export function meta() {
  return buildMeta({
    title: 'Şifremi Unuttum',
    description: 'Şifre sıfırlama bağlantısı isteyin.',
    path: '/sifremi-unuttum',
    noindex: true,
  });
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      await api.post('/auth/forgot-password', { email });
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof ApiError ? err.message : 'İstek gönderilemedi.');
    }
  }

  if (state === 'done') {
    return (
      <Card className="p-8 text-center md:p-10">
        <IconFrame name="mail" size={56} className="mx-auto" />
        <h1 className="mt-6 text-2xl">Bağlantı gönderildi</h1>
        {/*
          Kullanicinin var olup olmadigi bilerek sizdirilmiyor:
          "boyle bir hesap yok" demek, hangi e-postalarin kayitli
          oldugunu ogrenmeye yarardi.
        */}
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Eğer bu e-posta adresiyle bir hesap varsa, şifre sıfırlama bağlantısı
          gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
        </p>
        <Link
          to="/giris"
          className="mt-8 inline-block text-sm font-medium text-brand underline underline-offset-2"
        >
          Giriş sayfasına dön
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-10">
      <h1 className="text-2xl">Şifrenizi mi unuttunuz?</h1>
      <p className="mt-2 text-sm text-ink-muted">
        E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-5">
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="E-posta" required htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={state === 'sending'} className="w-full">
          Sıfırlama Bağlantısı Gönder
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/giris" className="font-medium text-brand underline underline-offset-2">
          Giriş sayfasına dön
        </Link>
      </p>
    </Card>
  );
}
