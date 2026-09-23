import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';

import { AuthProvider } from '~/lib/auth';
import { serverFetch } from '~/lib/api';
import type { SiteSettings } from '~/lib/types';
import type { Route } from './+types/root';
import './styles/app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Lora:wght@400;500;600&display=swap',
  },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'manifest', href: '/manifest.webmanifest' },
];

/**
 * Site ayarlari KOK loader'da cekiliyor.
 * Boylece klinik adi, tema ve iletisim bilgileri her sayfada hazir olur;
 * her bilesen ayri ayri istek atmak zorunda kalmaz.
 */
export async function loader() {
  try {
    const settings = await serverFetch<SiteSettings>('/settings');
    return { settings };
  } catch {
    // API kapaliyken bile site acilabilmeli: iskelet gorunur,
    // veriye bagli bolumler bos kalir.
    return { settings: null };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="adacayi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#5A7D6A" />
        <Meta />
        <Links />
        {/*
          Tema, React devreye girmeden UYGULANMALI. Aksi halde koyu tema
          secen kullanici ilk karede acik temayi gorur (flash).
          Bu betik senkron calisir ve <body> boyanmadan biter.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('vet_theme');
              if(t)document.documentElement.setAttribute('data-theme',t);
              var m=localStorage.getItem('vet_motion');
              if(m)document.documentElement.setAttribute('data-motion',m);
            }catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  let baslik = 'Bir şeyler ters gitti';
  let mesaj = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      baslik = 'Sayfa bulunamadı';
      mesaj = 'Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.';
    } else {
      baslik = `${error.status} hatası`;
      mesaj = error.statusText || mesaj;
    }
  }

  return (
    <main className="wrap flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="eyebrow">Hata</p>
      <h1 className="text-4xl">{baslik}</h1>
      <p className="max-w-md text-ink-muted">{mesaj}</p>
      <a
        href="/"
        className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-hover"
      >
        Ana sayfaya dön
      </a>
    </main>
  );
}
