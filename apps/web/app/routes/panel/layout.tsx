import { Outlet } from 'react-router';

import { PanelShell, type NavItem } from '~/components/layout/panel-shell';
import type { Role } from '~/lib/types';

const NAV: NavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'chart', end: true },
  { to: '/panel/randevular', label: 'Randevular', icon: 'calendar' },
  { to: '/panel/musteriler', label: 'Müşteriler', icon: 'users' },
  { to: '/panel/hastalar', label: 'Hastalar', icon: 'paw' },
  { to: '/panel/hizmetler', label: 'Hizmetler', icon: 'stethoscope' },
  { to: '/panel/personel', label: 'Personel', icon: 'user' },
  { to: '/panel/blog', label: 'Blog', icon: 'file' },
  { to: '/panel/yorumlar', label: 'Yorumlar', icon: 'star' },
  { to: '/panel/mesajlar', label: 'Mesajlar', icon: 'mail' },
  { to: '/panel/ayarlar', label: 'Ayarlar', icon: 'settings' },
];

/** Modul sabiti — bkz. hesap/layout.tsx acikalamasi. */
const ALLOW: Role[] = ['ADMIN', 'STAFF'];

export default function AdminLayout() {
  return (
    <PanelShell title="Yönetim" nav={NAV} allow={ALLOW}>
      <Outlet />
    </PanelShell>
  );
}
