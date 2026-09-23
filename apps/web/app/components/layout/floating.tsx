import { useEffect, useState } from 'react';

import { whatsappLink } from '~/lib/format';
import type { SiteSettings } from '~/lib/types';
import { Icon, cx } from '~/components/ui';

const THEMES = [
  { id: 'adacayi', label: 'Adaçayı', color: '#5A7D6A' },
  { id: 'okyanus', label: 'Okyanus', color: '#2C6E9B' },
  { id: 'lavanta', label: 'Lavanta', color: '#7A6BA8' },
  { id: 'kurumsal', label: 'Kurumsal', color: '#1F3A5F' },
  { id: 'toprak', label: 'Toprak', color: '#B0765A' },
  { id: 'gece', label: 'Gece', color: '#7FB3A5' },
];

/** Hizli iletisim butonlari — her sayfada sag altta. */
export function FloatingActions({ settings }: { settings: SiteSettings | null }) {
  const [open, setOpen] = useState(false);
  const contact = settings?.contact;
  if (!contact) return null;

  const wa = contact.whatsapp
    ? whatsappLink(contact.whatsapp, contact.whatsappMessage)
    : null;

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col-reverse items-center gap-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Hızlı iletişim"
        className="grid h-12.5 w-12.5 place-items-center rounded-full bg-brand text-brand-contrast shadow-lg transition-transform duration-400 ease-soft hover:scale-107"
      >
        <Icon
          name="plus"
          size={21}
          className={cx('transition-transform duration-400 ease-soft', open && 'rotate-45')}
        />
      </button>

      {wa && (
        <FabChild href={wa} label="WhatsApp" icon="chat" open={open} delay={60} />
      )}
      {contact.phoneRaw && (
        <FabChild
          href={`tel:${contact.phoneRaw}`}
          label="Telefon"
          icon="phone"
          open={open}
          delay={120}
        />
      )}
    </div>
  );
}

function FabChild({
  href,
  label,
  icon,
  open,
  delay,
}: {
  href: string;
  label: string;
  icon: string;
  open: boolean;
  delay: number;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      aria-label={label}
      tabIndex={open ? 0 : -1}
      style={{ transitionDelay: `${open ? delay : 0}ms` }}
      className={cx(
        'grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-brand',
        'transition-all duration-400 ease-soft',
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-80 opacity-0',
      )}
    >
      <Icon name={icon} size={19} />
    </a>
  );
}

/**
 * Demo tema degistirici.
 *
 * Gercek sitede bu panel GORUNMEZ: tema admin panelinden secilir ve
 * veritabanina kaydedilir. Burasi yalnizca kliniklere sunum yaparken
 * "renginizi degistirebiliriz" demek icin.
 */
export function ThemeSwitcher({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('adacayi');
  const [motionOn, setMotionOn] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.getAttribute('data-theme') ?? 'adacayi');
    setMotionOn(root.getAttribute('data-motion') !== 'off');
  }, []);

  if (!enabled) return null;

  function applyTheme(id: string) {
    document.documentElement.setAttribute('data-theme', id);
    setTheme(id);
    try {
      localStorage.setItem('vet_theme', id);
    } catch {
      /* gizli sekmede localStorage yazilamaz; tema yine de uygulanir */
    }
  }

  function applyMotion(on: boolean) {
    document.documentElement.setAttribute('data-motion', on ? 'on' : 'off');
    setMotionOn(on);
    try {
      localStorage.setItem('vet_motion', on ? 'on' : 'off');
    } catch {
      /* yoksay */
    }
    // Lenis ve IntersectionObserver kurulumu yeniden yapilmali.
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Tema değiştir"
        className="fixed bottom-5 left-5 z-50 grid h-11.5 w-11.5 place-items-center rounded-full border border-line bg-surface text-ink shadow-md transition-transform duration-400 ease-soft hover:scale-107"
      >
        <Icon name="palette" size={19} />
      </button>

      <div
        className={cx(
          'fixed bottom-20 left-5 z-50 w-[min(300px,calc(100vw-40px))] rounded-lg border border-line bg-surface p-6 shadow-lg transition-all duration-500 ease-soft',
          open
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible translate-y-3 scale-97 opacity-0',
        )}
      >
        <h4 className="mb-3 text-xs font-medium tracking-[0.1em] text-ink-faint uppercase">
          Tema
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(t.id)}
              aria-pressed={theme === t.id}
              className={cx(
                'grid justify-items-center gap-1.5 rounded-md border px-1.5 py-2.5 text-[0.6875rem] transition-all duration-300',
                theme === t.id
                  ? 'border-brand bg-tint font-medium text-brand'
                  : 'border-line text-ink-muted hover:border-brand',
              )}
            >
              <span
                className="block h-5.5 w-5.5 rounded-full border border-black/10"
                style={{ background: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label className="flex items-center justify-between text-xs font-medium tracking-wider text-ink-faint uppercase">
            Yumuşak kaydırma
            <input
              type="checkbox"
              checked={motionOn}
              onChange={(e) => applyMotion(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-brand)]"
            />
          </label>
        </div>

        <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-faint">
          Gerçek sistemde bu ayarlar admin panelinden yapılır ve veritabanına
          kaydedilir — tüm ziyaretçiler için geçerli olur.
        </p>
      </div>
    </>
  );
}
