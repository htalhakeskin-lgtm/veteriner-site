import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { ApiError } from '~/lib/api';
import { useAuth } from '~/lib/auth';
import { buildMeta } from '~/lib/seo';
import { Button, Card, ErrorNote, Field, Icon, Input } from '~/components/ui';

export function meta() {
  return buildMeta({
    title: 'Giriş Yap',
    description: 'Hesabınıza giriş yapın.',
    path: '/giris',
    noindex: true, // kişiye özel sayfa
  });
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      // Korumalı bir sayfadan yonlendirildiyse oraya geri dön.
      const next = params.get('devam');
      if (next?.startsWith('/')) navigate(next, { replace: true });
      else navigate(user.role === 'CUSTOMER' ? '/hesap' : '/panel', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Giriş yapılamadı, tekrar deneyin.',
      );
      setLoading(false);
    }
  }

  return (
    <Card className="p-8 md:p-10">
      <h1 className="text-2xl">Giriş yapın</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Randevularınızı ve dostunuzun sağlık kayıtlarını görmek için.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-5">
        {error && <ErrorNote>{error}</ErrorNote>}

        <Field label="E-posta" required htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Şifre" required htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-ink-faint transition-colors hover:text-brand"
            >
              <Icon name={showPassword ? 'x' : 'search'} size={16} />
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            to="/sifremi-unuttum"
            className="text-sm text-ink-muted transition-colors hover:text-brand"
          >
            Şifremi unuttum
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Giriş Yap
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Hesabınız yok mu?{' '}
        <Link to="/kayit" className="font-medium text-brand underline underline-offset-2">
          Kayıt olun
        </Link>
      </p>

      {/* Demo hesapları: kliniklere sunum yaparken hızlı giriş için.
          Gerçek kurulumda bu blok kaldırılmalı. */}
      <div className="mt-8 rounded-md border border-dashed border-line bg-surface-2 p-4">
        <p className="text-xs font-medium tracking-wider text-ink-faint uppercase">
          Demo hesapları
        </p>
        <div className="mt-2.5 grid gap-1.5 text-xs text-ink-muted">
          <button
            type="button"
            onClick={() => {
              setEmail('musteri@demo.com');
              setPassword('123456');
            }}
            className="text-left transition-colors hover:text-brand"
          >
            Müşteri: <code>musteri@demo.com</code> / <code>123456</code>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@demo.com');
              setPassword('admin123');
            }}
            className="text-left transition-colors hover:text-brand"
          >
            Yönetici: <code>admin@demo.com</code> / <code>admin123</code>
          </button>
        </div>
      </div>
    </Card>
  );
}
