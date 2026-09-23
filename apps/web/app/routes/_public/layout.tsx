import { Outlet, useRouteLoaderData } from 'react-router';

import { Footer } from '~/components/layout/footer';
import { FloatingActions, ThemeSwitcher } from '~/components/layout/floating';
import { Header } from '~/components/layout/header';
import { useScrollReveal, useSmoothScroll } from '~/lib/motion';
import type { SiteSettings } from '~/lib/types';
import { useLocation } from 'react-router';

export default function PublicLayout() {
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const settings = root?.settings ?? null;
  const location = useLocation();

  // Kaydirma hizi ayarlardan gelir; klinik kendi tercihini secebilir.
  useSmoothScroll(settings?.theme.scrollSpeed ?? 4);
  // Sayfa degisince yeni icerik icin gozlemciyi yeniden kur.
  useScrollReveal([location.pathname]);

  return (
    <>
      <Header settings={settings} />
      <main id="icerik">
        <Outlet />
      </main>
      <Footer settings={settings} />
      <FloatingActions settings={settings} />
      {/* Demo modunda gorunur; gercek kurulumda features ile kapatilir. */}
      <ThemeSwitcher enabled={settings?.features?.demoMode !== false} />
    </>
  );
}
