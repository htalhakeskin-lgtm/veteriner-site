import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SiteSetting } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_APPOINTMENT_RULES,
  type AppointmentRules,
} from './settings.types';

/** Ayarlar her istekte okunuyor; kısa süreli önbellek veritabanını korur. */
const CACHE_MS = 30_000;

@Injectable()
export class SettingsService {
  private cache: { value: SiteSetting; at: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async load(): Promise<SiteSetting> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) {
      return this.cache.value;
    }
    const value = await this.prisma.siteSetting.findUnique({
      where: { id: 'singleton' },
    });
    if (!value) {
      throw new NotFoundException(
        'Site ayarları bulunamadı. Seed çalıştırıldı mi? (npm run db:seed)',
      );
    }
    this.cache = { value, at: Date.now() };
    return value;
  }

  /** Admin: tüm ayarlar. */
  getAll(): Promise<SiteSetting> {
    return this.load();
  }

  /**
   * Herkese açık alt küme. googlePlaceId ve benzeri operasyonel alanlar
   * dışarıda bırakılır: sitede görünmesi gerekmiyor.
   */
  async getPublic() {
    const s = await this.load();
    return {
      clinic: s.clinic,
      contact: s.contact,
      workingHours: s.workingHours,
      theme: s.theme,
      features: s.features,
      seo: s.seo,
      socialLinks: s.socialLinks,
      // Randevu kurallarından yalnızca arayüzün ihtiyacı olanlar
      appointment: {
        daysInAdvance:
          (s.appointmentRules as unknown as AppointmentRules).daysInAdvance,
        cancelBeforeHours:
          (s.appointmentRules as unknown as AppointmentRules).cancelBeforeHours,
      },
    };
  }

  /** Müsaitlik motoru ve randevu servisi bunu kullanır. */
  async getAppointmentRules(): Promise<AppointmentRules> {
    const s = await this.load();
    // Eksik alan olursa varsayılana düşer: ayarlar panelden elle
    // düzenlenebildiği için yarım JSON gelme ihtimali var.
    return {
      ...DEFAULT_APPOINTMENT_RULES,
      ...((s.appointmentRules ?? {}) as Partial<AppointmentRules>),
    };
  }

  async update(patch: Record<string, unknown>) {
    const data: Prisma.SiteSettingUpdateInput = {};
    // Yalnızca bilinen JSON bölümleri güncellenebilir.
    for (const key of [
      'clinic', 'contact', 'workingHours', 'theme', 'features',
      'appointmentRules', 'seo', 'socialLinks',
    ] as const) {
      if (patch[key] !== undefined) {
        (data as Record<string, unknown>)[key] = patch[key];
      }
    }
    if (patch.googlePlaceId !== undefined) {
      data.googlePlaceId = patch.googlePlaceId as string | null;
    }

    const updated = await this.prisma.siteSetting.update({
      where: { id: 'singleton' },
      data,
    });
    this.cache = null; // önbelleği düşür, değişiklik hemen yansısın
    return updated;
  }
}
