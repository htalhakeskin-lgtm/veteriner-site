import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { useAuth } from '~/lib/auth';
import type { SiteSettings } from '~/lib/types';
import { Icon, LinkButton, cx } from '~/components/ui';

const NAV = [
  { to: '/hizmetler', label: 'Hizmetler' },
  { to: '/ekibimiz', label: 'Ekibimiz' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/blog', label: 'Blog' },
  { to: '/iletisim', label: 'İletişim' },
];

export function Header({ settings }: { settings: SiteSettings | null }) {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Sayfa değişince mobil menü kapanmalı; açık kalırsa kullanıcı
  // yeni sayfayi göremez.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menü açıkken arka plan kaymasin.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const clinic = settings?.clinic.name ?? 'Klinik Adı';
  const phone = settings?.contact.phone ?? '';
  const phoneRaw = settings?.contact.phoneRaw ?? '';
  const emergency = settings?.workingHours.emergency;
  const emergencyPhone = settings?.workingHours.emergencyPhone;

  return (
    <>
      {emergency && (
        <div className="bg-deep text-[0.8125rem] text-deep-muted">
          <div className="wrap flex h-9.5 items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              7/24 acil müdahale hattı açık
            </span>
            <a
              href={`tel:${emergencyPhone?.replace(/\s/g, '')}`}
              className="font-medium text-deep-ink transition-colors hover:text-brand"
            >
              <span className="hidden sm:inline">Acil: </span>
              {emergencyPhone}
            </a>
          </div>
        </div>
      )}

      <header
        className={cx(
          'sticky top-0 z-50 border-b backdrop-blur-lg transition-colors duration-500',
          stuck
            ? 'border-line bg-surface/90'
            : 'border-transparent bg-bg/80',
        )}
      >
        <div className="wrap flex h-18 items-center gap-8">
          <Link to="/" className="mr-auto flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand text-brand-contrast">
              <Icon name="paw" size={19} />
            </span>
            <span>
              <span className="block font-display text-[1.0625rem] font-semibold tracking-tight">
                {clinic}
              </span>
              <span className="block text-[0.6875rem] tracking-[0.06em] text-ink-faint uppercase">
                Veteriner Kliniği
              </span>
            </span>
          </Link>

          <nav className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cx(
                        'relative py-1.5 text-[0.9375rem] transition-colors duration-300',
                        'after:absolute after:bottom-0 after:left-0 after:h-px after:w-full',
                        'after:origin-right after:scale-x-0 after:bg-brand after:transition-transform after:duration-500 after:ease-soft',
                        'hover:text-ink hover:after:origin-left hover:after:scale-x-100',
                        isActive
                          ? 'text-ink after:origin-left after:scale-x-100'
                          : 'text-ink-muted',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {phone && (
              <a
                href={`tel:${phoneRaw}`}
                className="text-sm text-ink-muted transition-colors hover:text-brand"
              >
                {phone}
              </a>
            )}
            <LinkButton to={user ? '/hesap' : '/giris'} variant="ghost" size="sm">
              <Icon name="user" size={15} />
              {user ? 'Hesabım' : 'Giriş'}
            </LinkButton>
            <LinkButton to="/randevu" size="sm">
              Randevu Al
            </LinkButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            className="-mr-2.5 grid gap-1.5 p-2.5 lg:hidden"
          >
            <span
              className={cx(
                'h-0.5 w-5 rounded bg-ink transition-transform duration-400 ease-soft',
                open && 'translate-y-2 rotate-45',
              )}
            />
            <span
              className={cx(
                'h-0.5 w-5 rounded bg-ink transition-opacity duration-300',
                open && 'opacity-0',
              )}
            />
            <span
              className={cx(
                'h-0.5 w-5 rounded bg-ink transition-transform duration-400 ease-soft',
                open && '-translate-y-2 -rotate-45',
              )}
            />
          </button>
        </div>
      </header>

      {/* Mobil menü */}
      <div
        className={cx(
          'fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-bg px-6 py-16 transition-all duration-500 ease-soft lg:hidden',
          open
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-3 opacity-0',
        )}
      >
        <div className="wrap">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block border-b border-line-soft py-3 font-display text-2xl"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-6 grid gap-3">
            <LinkButton to="/randevu" className="w-full">
              Online Randevu Al
            </LinkButton>
            <LinkButton to={user ? '/hesap' : '/giris'} variant="ghost" className="w-full">
              {user ? 'Hesabım' : 'Giriş Yap'}
            </LinkButton>
          </div>
        </div>
      </div>
    </>
  );
}
