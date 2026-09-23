import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, type Prisma } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Blog icerigi admin panelinden zengin metin olarak giriliyor.
 * Temizlenmeden saklanirsa panele erisimi olan biri siteye script
 * gomebilir; ziyaretcilerin tarayicisinda calisir (saklanan XSS).
 * Kaydetme aninda temizliyoruz ki veritabaninda hep guvenli hali dursun.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
    'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    // Disa acilan baglantilar sekme calma (tabnabbing) saldirisina acik olmasin.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

const LIST_SELECT = {
  id: true, slug: true, title: true, excerpt: true, coverImageUrl: true,
  publishedAt: true, readMinutes: true, viewCount: true,
  category: { select: { slug: true, name: true, icon: true } },
  author: { select: { fullName: true } },
} satisfies Prisma.BlogPostSelect;

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(params: {
    category?: string; q?: string; page?: number; limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 9));

    const where: Prisma.BlogPostWhereInput = {
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() }, // ileri tarihli yayinlar gorunmesin
      ...(params.category ? { category: { slug: params.category } } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' } },
              { excerpt: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { items, total, page, limit, pageCount: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      include: {
        category: { select: { slug: true, name: true, icon: true } },
        author: { select: { fullName: true } },
      },
    });
    if (!post) throw new NotFoundException('Yazi bulunamadi.');

    // Goruntulenme sayaci: yaziyi dondurmeyi bekletmesin.
    void this.prisma.blogPost
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    const related = await this.prisma.blogPost.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        categoryId: post.categoryId,
        id: { not: post.id },
      },
      select: LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return { ...post, related };
  }

  async categories() {
    const rows = await this.prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { posts: { where: { status: PostStatus.PUBLISHED } } },
        },
      },
    });
    // Icerigi olmayan kategori sitede gosterilmesin: bos sayfaya goturur.
    return rows.filter((c) => c._count.posts > 0);
  }

  // ── Admin ──

  findAllAdmin(params: { status?: string; q?: string }) {
    return this.prisma.blogPost.findMany({
      where: {
        ...(params.status ? { status: params.status as PostStatus } : {}),
        ...(params.q
          ? { title: { contains: params.q, mode: 'insensitive' } }
          : {}),
      },
      include: {
        category: { select: { slug: true, name: true } },
        author: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Yazi bulunamadi.');
    return post;
  }

  createPost(data: Record<string, unknown>, authorId: string) {
    const clean = this.prepare(data);
    return this.prisma.blogPost.create({
      data: {
        ...clean,
        authorId,
        // Yayina alinirken tarih verilmediyse simdiyi kullan.
        publishedAt:
          clean.status === PostStatus.PUBLISHED
            ? ((clean.publishedAt as Date | undefined) ?? new Date())
            : null,
      } as Prisma.BlogPostUncheckedCreateInput,
    });
  }

  async updatePost(id: string, data: Record<string, unknown>) {
    const existing = await this.findOneAdmin(id);
    const clean = this.prepare(data);

    // Taslaktan yayina gecerken yayin tarihi bir kez yazilir.
    const publishedAt =
      clean.status === PostStatus.PUBLISHED && !existing.publishedAt
        ? new Date()
        : ((clean.publishedAt as Date | undefined) ?? undefined);

    return this.prisma.blogPost.update({
      where: { id },
      data: { ...clean, ...(publishedAt ? { publishedAt } : {}) } as Prisma.BlogPostUncheckedUpdateInput,
    });
  }

  async removePost(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.blogPost.delete({ where: { id } });
    return { deleted: true };
  }

  createCategory(data: { slug: string; name: string; icon?: string; sortOrder?: number }) {
    return this.prisma.blogCategory.create({ data });
  }

  async updateCategory(id: string, data: Record<string, unknown>) {
    return this.prisma.blogCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name as string } : {}),
        ...(data.slug !== undefined ? { slug: data.slug as string } : {}),
        ...(data.icon !== undefined ? { icon: data.icon as string } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder as number } : {}),
      },
    });
  }

  async removeCategory(id: string) {
    const count = await this.prisma.blogPost.count({ where: { categoryId: id } });
    if (count > 0) {
      // Silmek yazilari kategorisiz birakirdi; once tasinmalari gerekiyor.
      throw new NotFoundException(
        `Bu kategoride ${count} yazi var. Once yazilari baska kategoriye tasiyin.`,
      );
    }
    await this.prisma.blogCategory.delete({ where: { id } });
    return { deleted: true };
  }

  /** Yazilabilir alanlari suzer, HTML'i temizler, okuma suresini hesaplar. */
  private prepare(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of [
      'slug', 'title', 'excerpt', 'coverImageUrl', 'categoryId',
      'status', 'metaTitle', 'metaDescription',
    ]) {
      if (data[key] !== undefined) out[key] = data[key];
    }

    if (data.contentHtml !== undefined) {
      const clean = sanitizeHtml(String(data.contentHtml), SANITIZE_OPTIONS);
      out.contentHtml = clean;
      // Okuma suresi metinden hesaplaniyor; elle girilmesi gereksiz
      // ve genellikle yanlis oluyor. ~200 kelime/dakika.
      const words = clean.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
      out.readMinutes = Math.max(1, Math.round(words / 200));
    }

    if (data.publishedAt !== undefined && data.publishedAt !== null) {
      out.publishedAt = new Date(String(data.publishedAt));
    }
    return out;
  }
}
