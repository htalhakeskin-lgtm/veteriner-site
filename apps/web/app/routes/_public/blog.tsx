import { Link, useSearchParams } from 'react-router';

import { serverFetch } from '~/lib/api';
import { formatDate } from '~/lib/format';
import { breadcrumbJsonLd, buildMeta } from '~/lib/seo';
import type { BlogPost, Paginated } from '~/lib/types';
import { Card, EmptyState, Icon, cx } from '~/components/ui';
import { PageHero } from '~/components/sections/page-hero';
import type { Route } from './+types/blog';

interface Category {
  id: string;
  slug: string;
  name: string;
  _count: { posts: number };
}

export function meta() {
  return buildMeta({
    title: 'Sağlık Rehberi — Evcil Hayvan Bakım Yazıları',
    description:
      'Beslenme, aşı takvimi, diş sağlığı ve acil durumlar. Veteriner hekimlerimizin kaleminden pratik rehberler.',
    path: '/blog',
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('kategori') ?? '';
  const page = url.searchParams.get('sayfa') ?? '1';

  const query = new URLSearchParams({ page, limit: '9' });
  if (category) query.set('category', category);

  const [posts, categories] = await Promise.all([
    serverFetch<Paginated<BlogPost>>(`/blog/posts?${query}`).catch(() => null),
    serverFetch<Category[]>('/blog/categories').catch(() => []),
  ]);

  return { posts, categories, activeCategory: category };
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { posts, categories, activeCategory } = loaderData;
  const [, setSearchParams] = useSearchParams();

  const items = posts?.items ?? [];
  const [featured, ...rest] = items;

  function selectCategory(slug: string) {
    // Kategori değişince sayfa 1'e dön: 5. sayfadayken filtre
    // değiştirmek boş liste gösterirdi.
    setSearchParams(slug ? { kategori: slug } : {});
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        }}
      />

      <PageHero
        eyebrow="Sağlık Rehberi"
        title="Merak ettikleriniz"
        lede="Muayenede en sık sorulan soruları yazıya döktük. Hepsi hekimlerimizin kaleminden."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap">
          {categories.length > 0 && (
            <div className="mb-10 flex flex-wrap gap-2" data-reveal="fade">
              <FilterChip
                active={!activeCategory}
                onClick={() => selectCategory('')}
              >
                Tümü
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={activeCategory === c.slug}
                  onClick={() => selectCategory(c.slug)}
                >
                  {c.name}
                  <span className="ml-1.5 opacity-60">{c._count.posts}</span>
                </FilterChip>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon="file"
              title="Henüz yazı yok"
              description="Bu kategoride yayınlanmış bir yazı bulunmuyor."
            />
          ) : (
            <>
              {/* Öne çıkan yazı: ilk yazı büyük gösterilir */}
              {featured && (
                <Link to={`/blog/${featured.slug}`} className="group block" data-reveal>
                  <Card hover className="grid overflow-hidden lg:grid-cols-2">
                    <div className="aspect-16/10 overflow-hidden bg-tint lg:aspect-auto lg:min-h-80">
                      {featured.coverImageUrl ? (
                        <img
                          src={featured.coverImageUrl}
                          alt=""
                          loading="eager"
                          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-soft group-hover:scale-103"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-brand">
                          <Icon name="file" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-8 lg:p-12">
                      <PostMeta post={featured} />
                      <h2 className="text-[clamp(1.5rem,3vw,2.2rem)]">
                        {featured.title}
                      </h2>
                      <p className="leading-relaxed text-ink-muted">
                        {featured.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-brand">
                        Devamını oku <Icon name="arrow" size={15} />
                      </span>
                    </div>
                  </Card>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-stagger>
                  {rest.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group" data-reveal>
                      <Card hover className="flex h-full flex-col overflow-hidden">
                        <div className="aspect-16/10 overflow-hidden bg-tint">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-[1100ms] ease-soft group-hover:scale-104"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-brand">
                              <Icon name="file" size={32} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-6">
                          <PostMeta post={post} />
                          <h3 className="font-sans text-[1.0625rem] leading-snug font-semibold">
                            {post.title}
                          </h3>
                          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
                            {post.excerpt}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {posts && posts.pageCount > 1 && (
                <nav
                  className="mt-12 flex justify-center gap-2"
                  aria-label="Sayfalama"
                >
                  {Array.from({ length: posts.pageCount }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.set('sayfa', String(n));
                          return next;
                        })
                      }
                      aria-current={posts.page === n ? 'page' : undefined}
                      className={cx(
                        'h-10 w-10 rounded-full border text-sm transition-all duration-300',
                        posts.page === n
                          ? 'border-brand bg-brand text-brand-contrast'
                          : 'border-line bg-surface text-ink-muted hover:border-brand hover:text-brand',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
      {post.category && (
        <span className="rounded-full bg-tint px-2.5 py-1 font-medium text-brand">
          {post.category.name}
        </span>
      )}
      <span>{formatDate(post.publishedAt)}</span>
      <span>·</span>
      <span>{post.readMinutes} dk okuma</span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'rounded-full border px-4.5 py-2 text-sm transition-all duration-300 ease-soft',
        active
          ? 'border-brand bg-brand text-brand-contrast'
          : 'border-line bg-surface text-ink-muted hover:border-brand hover:text-brand',
      )}
    >
      {children}
    </button>
  );
}
