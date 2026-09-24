import { serverFetch } from '~/lib/api';
import { SITE_URL } from '~/lib/seo';
import type { BlogPost, Paginated, Service } from '~/lib/types';

/**
 * Dinamik site haritasi.
 * Blog yazısı ve hizmet eklendikce elle güncelleme gerekmesin diye
 * içerik API'den çekiliyor.
 */
export async function loader() {
  const [services, posts] = await Promise.all([
    serverFetch<Service[]>('/services').catch(() => []),
    serverFetch<Paginated<BlogPost>>('/blog/posts?limit=200').catch(() => null),
  ]);

  const staticPages = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    { loc: '/hizmetler', priority: '0.9', freq: 'monthly' },
    { loc: '/ekibimiz', priority: '0.8', freq: 'monthly' },
    { loc: '/hakkimizda', priority: '0.7', freq: 'yearly' },
    { loc: '/blog', priority: '0.8', freq: 'weekly' },
    { loc: '/iletisim', priority: '0.7', freq: 'yearly' },
    { loc: '/randevu', priority: '0.9', freq: 'monthly' },
    { loc: '/kvkk', priority: '0.3', freq: 'yearly' },
  ];

  const urls = [
    ...staticPages.map((p) => entry(p.loc, p.priority, p.freq)),
    ...services.map((s) => entry(`/hizmetler/${s.slug}`, '0.7', 'monthly')),
    ...(posts?.items ?? []).map((p) =>
      entry(`/blog/${p.slug}`, '0.6', 'monthly', p.publishedAt),
    ),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function entry(path: string, priority: string, freq: string, lastmod?: string | null) {
  return (
    `  <url><loc>${SITE_URL}${path}</loc>` +
    (lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : '') +
    `<changefreq>${freq}</changefreq><priority>${priority}</priority></url>`
  );
}
