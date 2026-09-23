import { Link, Outlet, useRouteLoaderData } from 'react-router';

import type { SiteSettings } from '~/lib/types';
import { Icon } from '~/components/ui';

/**
 * Kimlik dogrulama sayfalarinin sade duzeni.
 * Header/footer yok: kullaniciyi tek bir isten (giris yapmak)
 * uzaklastiracak baglanti gostermiyoruz.
 */
export default function AuthLayout() {
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const clinic = root?.settings?.clinic.name ?? 'Klinik Adı';

  return (
    <div className="grid min-h-screen place-items-center px-6 py-14">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mb-10 flex items-center justify-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-contrast">
            <Icon name="paw" size={21} />
          </span>
          <span className="text-center">
            <span className="block font-display text-lg font-semibold">{clinic}</span>
            <span className="block text-[0.6875rem] tracking-[0.06em] text-ink-faint uppercase">
              Veteriner Kliniği
            </span>
          </span>
        </Link>

        <Outlet />

        <p className="mt-8 text-center text-sm">
          <Link
            to="/"
            className="text-ink-muted transition-colors hover:text-brand"
          >
            ← Siteye dön
          </Link>
        </p>
      </div>
    </div>
  );
}
