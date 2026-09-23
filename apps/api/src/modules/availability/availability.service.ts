import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  buildDayRange,
  computeAvailability,
  dateKey,
  type AvailabilityDay,
  type StaffAvailabilityInput,
} from './availability.engine';

/** Slotu fiilen isgal eden randevu durumlari. */
const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED'] as const;

export interface AvailabilityQuery {
  serviceId?: string;
  serviceSlug?: string;
  staffId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getAvailability(q: AvailabilityQuery): Promise<{
    serviceId: string;
    serviceTitle: string;
    durationMinutes: number;
    days: AvailabilityDay[];
  }> {
    const rules = await this.settings.getAppointmentRules();

    // ── Hizmet ──
    const service = await this.prisma.service.findFirst({
      where: {
        isActive: true,
        ...(q.serviceId ? { id: q.serviceId } : {}),
        ...(q.serviceSlug ? { slug: q.serviceSlug } : {}),
      },
    });
    if (!service) {
      throw new NotFoundException('Hizmet bulunamadi veya pasif.');
    }

    // ── Tarih araligi ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = q.from ? startOfDay(q.from) : today;
    const maxTo = new Date(today);
    maxTo.setDate(maxTo.getDate() + rules.daysInAdvance);

    let to = q.to ? startOfDay(q.to) : maxTo;

    if (from < today) {
      throw new BadRequestException('Gecmis tarihler icin musaitlik sorgulanamaz.');
    }
    if (to < from) {
      throw new BadRequestException('Bitis tarihi baslangictan once olamaz.');
    }
    // Baslangicin kendisi randevu penceresinin disindaysa aciklama ile
    // reddet. Sessizce bos liste donmek "sistem bozuk mu, klinik dolu mu?"
    // belirsizligi yaratiyordu.
    if (from > maxTo) {
      throw new BadRequestException(
        `En fazla ${rules.daysInAdvance} gun sonrasi icin randevu alinabilir ` +
          `(son tarih: ${dateKey(maxTo)}).`,
      );
    }
    // Bitis tarihi pencereyi asiyorsa sessizce kirpilir: kullanici
    // "onumuzdeki 3 ay" sorsa bile kliniğin kurali uygulanir.
    if (to > maxTo) to = maxTo;

    const days = buildDayRange(from, to);
    if (days.length === 0) {
      return {
        serviceId: service.id,
        serviceTitle: service.title,
        durationMinutes: service.durationMinutes,
        days: [],
      };
    }

    // ── Hekimler ──
    // Yalnizca BU hizmeti verebilen aktif hekimler. Hizmet baglantisi
    // olmayan hekim, o hizmet icin slot uretmemeli.
    const staffMembers = await this.prisma.staffMember.findMany({
      where: {
        isActive: true,
        services: { some: { id: service.id } },
        ...(q.staffId ? { id: q.staffId } : {}),
      },
      include: { schedules: true },
    });

    if (staffMembers.length === 0) {
      // Hekim yoksa gunler "personel yok" olarak isaretlensin;
      // bos dizi donmek arayuzde "hata mi, dolu mu?" belirsizligi yaratir.
      return {
        serviceId: service.id,
        serviceTitle: service.title,
        durationMinutes: service.durationMinutes,
        days: days.map((d) => ({
          date: dateKey(d),
          isOpen: false,
          reason: 'NO_STAFF_SCHEDULED' as const,
          slots: [],
        })),
      };
    }

    const staffIds = staffMembers.map((s) => s.id);

    // ── Mevcut randevular ve izinler ──
    // Aralik ucu: son gunun SONUNU kapsamali, yoksa o gunun randevulari
    // hesaba katilmaz ve dolu saatler musait gorunur.
    const rangeStart = days[0]!;
    const rangeEnd = new Date(days.at(-1)!);
    rangeEnd.setHours(23, 59, 59, 999);

    const [appointments, timeOffs, holidays] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          staffId: { in: staffIds },
          status: { in: [...BLOCKING_STATUSES] },
          // Aralikla KESISEN randevular: tamamen icinde olmasi gerekmiyor,
          // araligin basina sarkan uzun bir operasyon da slot kapatir.
          startAt: { lte: rangeEnd },
          endAt: { gte: rangeStart },
        },
        select: { staffId: true, startAt: true, endAt: true },
      }),
      this.prisma.staffTimeOff.findMany({
        where: {
          staffId: { in: staffIds },
          startAt: { lte: rangeEnd },
          endAt: { gte: rangeStart },
        },
        select: { staffId: true, startAt: true, endAt: true },
      }),
      this.prisma.clinicHoliday.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        select: { date: true },
      }),
    ]);

    const staffInput: StaffAvailabilityInput[] = staffMembers.map((m) => ({
      id: m.id,
      name: m.fullName,
      windows: m.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      timeOff: timeOffs
        .filter((t) => t.staffId === m.id)
        .map((t) => ({ start: t.startAt, end: t.endAt })),
      busy: appointments
        .filter((a) => a.staffId === m.id)
        .map((a) => ({ start: a.startAt, end: a.endAt })),
    }));

    const result = computeAvailability({
      days,
      durationMinutes: service.durationMinutes,
      stepMinutes: rules.slotDurationMinutes,
      leadTimeHours: rules.leadTimeHours,
      maxDailySlots: rules.maxDailySlots,
      blockedWeekdays: rules.blockedWeekdays,
      holidays: new Set(holidays.map((h) => dateKey(h.date))),
      now: new Date(),
      staff: staffInput,
    });

    return {
      serviceId: service.id,
      serviceTitle: service.title,
      durationMinutes: service.durationMinutes,
      days: result,
    };
  }

  /**
   * Randevu servisi icin: verilen an gercekten musait mi?
   * Musteri "farketmez" dediginde atanacak hekimi de dondurur.
   */
  async resolveSlot(params: {
    serviceId: string;
    startAt: Date;
    staffId?: string;
  }): Promise<{ staffId: string; staffName: string; endAt: Date }> {
    const { days } = await this.getAvailability({
      serviceId: params.serviceId,
      staffId: params.staffId,
      from: dateKey(params.startAt),
      to: dateKey(params.startAt),
    });

    const day = days[0];
    const slot = day?.slots.find(
      (s) => s.start.getTime() === params.startAt.getTime(),
    );

    if (!slot) {
      throw new BadRequestException({
        message: 'Secilen saat musait degil. Lutfen baska bir saat secin.',
        code: 'SLOT_UNAVAILABLE',
      });
    }

    return { staffId: slot.staffId, staffName: slot.staffName, endAt: slot.end };
  }
}

/** "YYYY-MM-DD" veya ISO metnini yerel gun baslangicina cevirir. */
function startOfDay(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) {
    throw new BadRequestException('Tarih "YYYY-MM-DD" biciminde olmali.');
  }
  // new Date("2026-10-05") UTC olarak yorumlanir ve saat dilimine gore
  // bir onceki gune kayabilir; parcalardan kurmak bunu onler.
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}
