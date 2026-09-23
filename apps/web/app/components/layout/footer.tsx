import { useState } from 'react';
import { Link } from 'react-router';

import { api } from '~/lib/api';
import type { SiteSettings } from '~/lib/types';
import { Icon, Spinner } from '~/components/ui';

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const clinic = settings?.clinic.name ?? 'Klinik Adı';
  const contact = settings?.contact;
  const social = settings?.socialLinks;
  const year = new Date().getFullYear();

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      await api.post('/newsletter/subscribe', { email });
      setState('done');
      setEmail('');
    } catch {
      setState('error');
    }
  }

  return (
    <footer className="bg-deep pt-24 pb-8 text-deep-muted">
      <div className="wrap grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand text-brand-contrast">
              <Icon name="paw" size={19} />
            </span>
            <span>
              <span className="block font-display text-[1.0625rem] font-semibold text-deep-ink">
                {clinic}
              </span>
              <span className="block text-[0.6875rem] tracking-[0.06em] uppercase">
                Veteriner Kliniği
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed">
            {settings?.clinic.description ??
              'Dostlarınıza acele ettirmeden, anlatarak ve şeffaf fiyatla bakıyoruz.'}
          </p>
          <div className="mt-6 flex gap-2.5">
            {social?.instagram && (
              <SocialLink href={social.instagram} label="Instagram" icon="instagram" />
            )}
            {contact?.whatsapp && (
              <SocialLink
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                label="WhatsApp"
                icon="chat"
              />
            )}
            {contact?.phoneRaw && (
              <SocialLink href={`tel:${contact.phoneRaw}`} label="Telefon" icon="phone" />
            )}
          </div>
        </div>

        <FooterColumn
          title="Klinik"
          links={[
            { to: '/hizmetler', label: 'Hizmetler' },
            { to: '/ekibimiz', label: 'Ekibimiz' },
            { to: '/hakkimizda', label: 'Hakkımızda' },
            { to: '/blog', label: 'Blog' },
          ]}
        />

        <FooterColumn
          title="Hesap"
          links={[
            { to: '/randevu', label: 'Randevu Al' },
            { to: '/randevu-sorgula', label: 'Randevu Sorgula' },
            { to: '/giris', label: 'Giriş Yap' },
            { to: '/kvkk', label: 'KVKK' },
          ]}
        />

        <div>
          <h4 className="mb-4 text-xs font-medium tracking-[0.12em] text-deep-ink uppercase">
            Aşı hatırlatması
          </h4>
          <p className="text-sm leading-relaxed">
            Ayda bir, evcil dostunuz için sade bir bakım bülteni.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              E-posta adresiniz
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              disabled={state === 'sending' || state === 'done'}
              className="min-w-0 flex-1 rounded-full border border-deep-line bg-transparent px-4 py-3 text-sm text-deep-ink placeholder:text-deep-muted focus:border-brand focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={state === 'sending' || state === 'done'}
              className="grid place-items-center rounded-full bg-brand px-5 py-3 text-sm font-medium text-brand-contrast transition-colors duration-300 hover:bg-brand-hover disabled:opacity-70"
            >
              {state === 'sending' ? (
                <Spinner size={15} />
              ) : state === 'done' ? (
                'Kaydedildi'
              ) : (
                'Abone Ol'
              )}
            </button>
          </form>
          {state === 'error' && (
            <p role="alert" className="mt-2 text-xs text-danger">
              Kaydedilemedi, lütfen tekrar deneyin.
            </p>
          )}
        </div>
      </div>

      <div className="wrap mt-16 flex flex-wrap justify-between gap-4 border-t border-deep-line pt-6 text-[0.8125rem]">
        <span>
          © {year} {clinic} Veteriner Kliniği
        </span>
        {contact?.address && <span>{contact.address.full}</span>}
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ to: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-medium tracking-[0.12em] text-deep-ink uppercase">
        {title}
      </h4>
      <ul className="grid gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="transition-colors hover:text-brand">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9.5 w-9.5 place-items-center rounded-full border border-deep-line transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:border-brand hover:text-brand"
    >
      <Icon name={icon} size={16} />
    </a>
  );
}
