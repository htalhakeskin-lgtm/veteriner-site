import { SITE_URL } from '~/lib/seo';

export function loader() {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Kisiye ozel sayfalar taranmasin',
    'Disallow: /hesap',
    'Disallow: /panel',
    'Disallow: /api',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
