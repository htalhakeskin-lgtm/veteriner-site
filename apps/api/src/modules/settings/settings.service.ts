import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SiteSetting } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_APPOINTMENT_RULES,
  type AppointmentRules,
} from './settings.types';

/** Ayarlar her istekte okunuyor; kisa sureli onbellek veritabanini korur. */
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
        'Site ayarlari bulunamadi. Seed calistirildi mi? (npm run db:seed)',
      );
    }
    this.cache = { value, at: Date.now() };
    return value;
  }

  /** Admin: tum ayarlar. */
  getAll(): Promise<SiteSetting> {
    return this.load();
  }

  /**
   * Herkese acik alt kume. googlePlaceId ve benzeri operasyonel alanlar
   * disarida birakilir: sitede gorunmesi gerekmiyor.
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
      // Randevu kurallarindan yalnizca arayuzun ihtiyaci olanlar
      appointment: {
        daysInAdvance:
          (s.appointmentRules as unknown as AppointmentRules).daysInAdvance,
        cancelBeforeHours:
          (s.appointmentRules as unknown as AppointmentRules).cancelBeforeHours,
      },
    };
  }

  /** Musaitlik motoru ve randevu servisi bunu kullanir. */
  async getAppointmentRules(): Promise<AppointmentRules> {
    const s = await this.load();
    // Eksik alan olursa varsayilana duser: ayarlar panelden elle
    // duzenlenebildigi icin yarim JSON gelme ihtimali var.
    return {
      ...DEFAULT_APPOINTMENT_RULES,
      ...((s.appointmentRules ?? {}) as Partial<AppointmentRules>),
    };
  }

  async update(patch: Record<string, unknown>) {
    const data: Prisma.SiteSettingUpdateInput = {};
    // Yalnizca bilinen JSON bolumleri guncellenebilir.
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
    this.cache = null; // onbellegi dusur, degisiklik hemen yansisin
    return updated;
  }
}
