import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';

import { useAuth } from '~/lib/auth';
import type { Role } from '~/lib/types';
import { Icon, Spinner, cx } from '~/components/ui';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

/**
 * Musteri ve yonetim panellerinin ortak kabugu.
 *
 * Yetki kontrolu burada tek yerde: her sayfanin kendi kontrolunu
 * yazmasi, birini unutunca sessiz bir acik birakirdi.
 */
export function PanelShell({
  title,
  nav,
  allow,
  children,
}: {
  title: string;
  nav: NavItem[];
  allow: Role[];
  children: ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Giristen sonra kullanici geldigi sayfaya donsun.
      navigate(`/giris?devam=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
    } else if (!allow.includes(user.role)) {
      // Yetkisi yetmiyorsa kendi paneline yonlendir.
      navigate(user.role === 'CUSTOMER' ? '/hesap' : '/panel', { replace: true });
    }
  }, [user, loading, allow, navigate, location.pathname]);

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-muted">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Ust bar ── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-lg">
        <div className="wrap flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-brand-contrast">
              <Icon name="paw" size={17} />
            </span>
            <span className="font-display text-base font-semibold">{title}</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:block">
              {user.fullName}
            </span>
            <button
              type="button"
              onClick={() => void logout().then(() => navigate('/'))}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              <Icon name="logout" size={15} />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Menü"
              className="grid h-9 w-9 place-items-center rounded-full border border-line lg:hidden"
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="wrap grid gap-8 py-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* ── Yan menu ── */}
        <nav
          className={cx(
            'lg:sticky lg:top-24 lg:block lg:self-start',
            menuOpen ? 'block' : 'hidden',
          )}
        >
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-all duration-300',
                      isActive
                        ? 'bg-tint font-medium text-brand'
                        : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                    )
                  }
                >
                  <Icon name={item.icon} size={17} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

/** Panel sayfalarinin ortak basligi. */
export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
