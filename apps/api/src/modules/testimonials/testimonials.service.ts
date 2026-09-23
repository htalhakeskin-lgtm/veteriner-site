import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TestimonialSource } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Sitede gosterilen yorumlar — yalnizca onayli olanlar. */
  findApproved(limit = 12) {
    return this.prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: [{ sortOrder: 'asc' }, { displayDate: 'desc' }],
      take: limit,
      select: {
        id: true, source: true, authorName: true, authorPhotoUrl: true,
        petName: true, petSpecies: true, rating: true, text: true,
        sourceUrl: true, displayDate: true,
      },
    });
  }

  /**
   * Arama sonuclarinda yildiz gorunmesi icin AggregateRating verisi.
   * Frontend bunu JSON-LD olarak sayfaya gomer.
   */
  async aggregateRating() {
    const rows = await this.prisma.testimonial.findMany({
      where: { isApproved: true },
      select: { rating: true },
    });
    if (rows.length === 0) return null;

    const sum = rows.reduce((a, r) => a + r.rating, 0);
    return {
      ratingValue: Number((sum / rows.length).toFixed(1)),
      reviewCount: rows.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // ── Admin ──

  findAllAdmin(params: { approved?: boolean; source?: string }) {
    return this.prisma.testimonial.findMany({
      where: {
        ...(params.approved !== undefined ? { isApproved: params.approved } : {}),
        ...(params.source ? { source: params.source as TestimonialSource } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { displayDate: 'desc' }],
    });
  }

  create(data: Record<string, unknown>) {
    return this.prisma.testimonial.create({
      data: {
        source: TestimonialSource.MANUAL,
        authorName: String(data.authorName ?? ''),
        petName: (data.petName as string) ?? null,
        petSpecies: (data.petSpecies as never) ?? null,
        rating: Number(data.rating ?? 5),
        text: String(data.text ?? ''),
        isApproved: data.isApproved === true,
        displayDate: data.displayDate ? new Date(String(data.displayDate)) : new Date(),
        sortOrder: Number(data.sortOrder ?? 0),
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.ensureExists(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.isApproved !== undefined ? { isApproved: data.isApproved as boolean } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) } : {}),
        // Google yorumlarinin metni degistirilemez; degistirilseydi
        // "dogrulanmis yorum" rozeti yalan olurdu.
        ...(data.text !== undefined ? { text: String(data.text) } : {}),
        ...(data.authorName !== undefined ? { authorName: String(data.authorName) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.testimonial.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Google Isletme yorumlarini ceker ve veritabanina yazar (§10b.2).
   *
   * Her sayfa acilisinda API cagirmak yerine gunde bir kez senkronize
   * ediliyor: kota tukenmez, gecikme olmaz ve Google erisilemezse site
   * calismaya devam eder.
   *
   * googlePlaceId bos ise sessizce atlanir; henuz Google kaydi olmayan
   * bir klinige de demo yapilabilsin diye.
   */
  async syncGoogleReviews(): Promise<{ synced: number; skipped: boolean }> {
    const settings = await this.settings.getAll();
    const placeId = settings.googlePlaceId;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!placeId || !apiKey) {
      this.logger.log(
        'Google yorum senkronizasyonu atlandi (googlePlaceId veya API anahtari yok).',
      );
      return { synced: 0, skipped: true };
    }

    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?fields=reviews,rating,userRatingCount&languageCode=tr`;

    let payload: GooglePlaceResponse;
    try {
      const res = await fetch(url, {
        headers: { 'X-Goog-Api-Key': apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      payload = (await res.json()) as GooglePlaceResponse;
    } catch (err) {
      // Google erisilemiyorsa mevcut yorumlar yerinde kalir.
      this.logger.error(`Google yorumlari alinamadi: ${(err as Error).message}`);
      return { synced: 0, skipped: true };
    }

    let synced = 0;
    for (const review of payload.reviews ?? []) {
      const externalId = review.name;
      if (!externalId) continue;

      await this.prisma.testimonial.upsert({
        where: {
          source_externalId: { source: TestimonialSource.GOOGLE, externalId },
        },
        create: {
          source: TestimonialSource.GOOGLE,
          externalId,
          authorName: review.authorAttribution?.displayName ?? 'Google kullanicisi',
          authorPhotoUrl: review.authorAttribution?.photoUri ?? null,
          rating: review.rating ?? 5,
          text: review.originalText?.text ?? review.text?.text ?? '',
          sourceUrl: review.authorAttribution?.uri ?? null,
          // Dusuk puanli yorumlar otomatik yayinlanmaz; admin karar verir.
          isApproved: (review.rating ?? 5) >= 4,
          displayDate: review.publishTime ? new Date(review.publishTime) : new Date(),
        },
        update: {
          // Metin ve puan Google'da degismis olabilir.
          rating: review.rating ?? 5,
          text: review.originalText?.text ?? review.text?.text ?? '',
        },
      });
      synced++;
    }

    this.logger.log(`Google yorum senkronizasyonu: ${synced} yorum islendi.`);
    return { synced, skipped: false };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Yorum bulunamadi.');
  }
}

interface GooglePlaceResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    publishTime?: string;
    authorAttribution?: {
      displayName?: string;
      photoUri?: string;
      uri?: string;
    };
  }>;
}
