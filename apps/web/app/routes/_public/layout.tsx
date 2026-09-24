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

  // Kaydırma hızı ayarlardan gelir; klinik kendi tercihini seçebilir.
  useSmoothScroll(settings?.theme.scrollSpeed ?? 4);
  // Sayfa değişince yeni içerik için gözlemciyi yeniden kur.
  useScrollReveal([location.pathname]);

  return (
    <>
      <Header settings={settings} />
      <main id="icerik">
        <Outlet />
      </main>
      <Footer settings={settings} />
      <FloatingActions settings={settings} />
      {/* Demo modunda görünür; gerçek kurulumda features ile kapatılır. */}
      <ThemeSwitcher enabled={settings?.features?.demoMode !== false} />
    </>
  );
}
