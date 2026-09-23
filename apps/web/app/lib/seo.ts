import type { SiteSettings } from './types';

export const SITE_URL = 'https://klinikadi.com';

interface MetaInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  /** Uygulama sayfalari (panel, hesap) arama motorlarina kapatilir. */
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedAt?: string | null;
  author?: string | null;
}

type MetaDescriptor = Record<string, string> | { title: string };

/**
 * Sayfa meta etiketleri. Her sayfa kendi baslik ve aciklamasini vermeli:
 * hepsinde ayni metin olursa Google sayfalari birbirinin kopyasi sayar.
 */
export function buildMeta(input: MetaInput): MetaDescriptor[] {
  const url = `${SITE_URL}${input.path ?? ''}`;
  const tags: MetaDescriptor[] = [
    { title: input.title },
    { name: 'description', content: input.description },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:locale', content: 'tr_TR' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: input.description },
    { tagName: 'link', rel: 'canonical', href: url },
  ];

  if (input.image) {
    tags.push({ property: 'og:image', content: input.image });
    tags.push({ name: 'twitter:image', content: input.image });
  }

  if (input.noindex) {
    tags.push({ name: 'robots', content: 'noindex, nofollow' });
  }

  if (input.type === 'article') {
    if (input.publishedAt) {
      tags.push({ property: 'article:published_time', content: input.publishedAt });
    }
    if (input.author) {
      tags.push({ property: 'article:author', content: input.author });
    }
  }

  return tags;
}

/**
 * Klinik icin yapisal veri. Google bunu okuyup arama sonuclarinda
 * adres, telefon, calisma saati ve yildiz puani gosterebilir.
 */
export function clinicJsonLd(
  settings: SiteSettings | null,
  rating?: { ratingValue: number; reviewCount: number } | null,
): string {
  if (!settings) return '';

  const { clinic, contact, workingHours } = settings;
  const hours: Array<Record<string, unknown>> = [];

  if (workingHours.weekdays?.open) {
    hours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: workingHours.weekdays.open,
      closes: workingHours.weekdays.close,
    });
  }
  if (workingHours.saturday?.open) {
    hours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: workingHours.saturday.open,
      closes: workingHours.saturday.close,
    });
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: clinic.name,
    description: clinic.description,
    url: SITE_URL,
    telephone: contact.phone,
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.full,
      addressLocality: contact.address.district,
      addressRegion: contact.address.city,
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: contact.address.lat,
      longitude: contact.address.lng,
    },
    openingHoursSpecification: hours,
    ...(rating && rating.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.ratingValue,
            reviewCount: rating.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  });
}

export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string | null;
  coverImageUrl: string | null;
  author: { fullName: string } | null;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
    ...(post.author ? { author: { '@type': 'Person', name: post.author.fullName } } : {}),
  });
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  });
}
