import { Outlet } from 'react-router';

import { PanelShell, type NavItem } from '~/components/layout/panel-shell';
import type { Role } from '~/lib/types';

const NAV: NavItem[] = [
  { to: '/hesap', label: 'Özet', icon: 'chart', end: true },
  { to: '/hesap/randevularim', label: 'Randevularım', icon: 'calendar' },
  { to: '/hesap/hayvanlarim', label: 'Hayvanlarım', icon: 'paw' },
  { to: '/hesap/bildirimler', label: 'Bildirimler', icon: 'bell' },
  { to: '/hesap/ayarlar', label: 'Ayarlar', icon: 'settings' },
];

/**
 * Modul sabiti olmali: JSX icinde dizi literali yazilirsa her render'da
 * YENI bir referans uretilir, PanelShell'in useEffect bagimliligi surekli
 * degisir ve sonsuz render dongusune girer.
 * STAFF ve ADMIN de kendi hesap sayfasini gorebilsin.
 */
const ALLOW: Role[] = ['CUSTOMER', 'STAFF', 'ADMIN'];

export default function AccountLayout() {
  return (
    <PanelShell title="Hesabım" nav={NAV} allow={ALLOW}>
      <Outlet />
    </PanelShell>
  );
}
