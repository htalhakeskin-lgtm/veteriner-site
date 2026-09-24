import { Link } from 'react-router';

import { serverFetch } from '~/lib/api';
import { formatDate } from '~/lib/format';
import { articleJsonLd, breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { BlogPost } from '~/lib/types';
import { Card, Icon, LinkButton } from '~/components/ui';
import type { Route } from './+types/blog-detail';

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) {
    return buildMeta({ title: 'Yazı bulunamadı', description: '', noindex: true });
  }
  const p = data.post;
  return buildMeta({
    title: `${p.title} — Sağlık Rehberi`,
    description: p.excerpt,
    path: `/blog/${p.slug}`,
    image: p.coverImageUrl,
    type: 'article',
    publishedAt: p.publishedAt,
    author: p.author?.fullName ?? null,
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  const post = await serverFetch<BlogPost>(`/blog/posts/${params.slug}`);
  return { post };
}

export default function BlogDetail({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        }}
      />

      <article className="pt-12 pb-18 md:pt-16 md:pb-28">
        <div className="wrap max-w-[760px]">
          <Link
            to="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
          >
            <Icon name="arrow-left" size={15} /> Tüm yazılar
          </Link>

          <header data-reveal>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
              {post.category && (
                <Link
                  to={`/blog?kategori=${post.category.slug}`}
                  className="rounded-full bg-tint px-2.5 py-1 font-medium text-brand transition-opacity hover:opacity-80"
                >
                  {post.category.name}
                </Link>
              )}
              <time dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <span>·</span>
              <span>{post.readMinutes} dk okuma</span>
            </div>

            <h1 className="mt-5 text-[clamp(2rem,4.5vw,3.2rem)]">{post.title}</h1>

            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
              {post.excerpt}
            </p>

            {post.author && (
              <p className="mt-6 flex items-center gap-2.5 text-sm text-ink-muted">
                <Icon name="user" size={16} className="text-brand" />
                {post.author.fullName}
              </p>
            )}
          </header>

          {post.coverImageUrl && (
            <div
              className="mt-10 aspect-16/9 overflow-hidden rounded-xl bg-tint"
              data-reveal
            >
              <img
                src={post.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/*
            contentHtml sunucuda sanitize-html ile temizlenmis halde
            geliyor (bkz. blog.service.ts). Burada tekrar temizlemek
            gerekmiyor; kaydetme anında temizlemek doğru yerdir.
          */}
          <div
            className="prose-vet mt-12"
            data-reveal
            dangerouslySetInnerHTML={{ __html: post.contentHtml ?? '' }}
          />

          <div className="mt-14 rounded-lg border border-line bg-tint/40 p-8 text-center" data-reveal>
            <h2 className="font-sans text-lg font-semibold">
              Dostunuz için bir kontrol zamanı mı?
            </h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-sm text-ink-muted">
              Yazıda geçen konularda emin değilseniz, muayenede birlikte
              değerlendirelim.
            </p>
            <LinkButton to="/randevu" className="mt-6">
              Randevu Al <Icon name="arrow" size={17} />
            </LinkButton>
          </div>

          {post.related && post.related.length > 0 && (
            <div className="mt-16 border-t border-line pt-12" data-reveal>
              <h2 className="font-sans text-lg font-semibold">Benzer yazılar</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {post.related.map((r) => (
                  <Link key={r.id} to={`/blog/${r.slug}`}>
                    <Card hover className="h-full p-5">
                      <span className="text-xs text-ink-faint">
                        {r.readMinutes} dk okuma
                      </span>
                      <h3 className="mt-2 font-sans text-[0.9375rem] leading-snug font-semibold">
                        {r.title}
                      </h3>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
