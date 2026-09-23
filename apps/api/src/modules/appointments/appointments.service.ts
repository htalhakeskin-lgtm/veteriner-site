import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, type Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import type { CreateAppointmentDto } from './dto/appointments.dto';

/** Postgres exclusion_violation. Unique ihlalindeki P2002 DEGIL. */
const PG_EXCLUSION_VIOLATION = '23P01';

const DETAIL_INCLUDE = {
  service: { select: { id: true, slug: true, title: true, durationMinutes: true } },
  staff: { select: { id: true, slug: true, fullName: true, title: true } },
  pet: { select: { id: true, name: true, species: true, breed: true } },
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─────────────────────────────────────────
  //  Olusturma
  // ─────────────────────────────────────────

  async create(dto: CreateAppointmentDto, userId?: string) {
    const rules = await this.settings.getAppointmentRules();
    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Gecersiz tarih/saat.');
    }

    // Uye randevusuysa hayvanin gercekten bu kullaniciya ait oldugunu dogrula.
    if (dto.petId) {
      if (!userId) {
        throw new BadRequestException(
          'Kayitli hayvan secmek icin giris yapmalisiniz.',
        );
      }
      const pet = await this.prisma.pet.findFirst({
        where: { id: dto.petId, ownerId: userId, deletedAt: null },
      });
      if (!pet) {
        // Baskasinin hayvani icin randevu alinmasini engeller.
        throw new ForbiddenException('Bu hayvan size ait degil.');
      }
    }

    // Misafir randevusunda iletisim bilgisi sart: onay gonderilemezse
    // randevunun kimseye faydasi yok.
    if (!userId && !dto.guestPhone) {
      throw new BadRequestException(
        'Uye olmadan randevu alirken telefon numarasi zorunludur.',
      );
    }

    // ⭐ Musaitlik motoru son sozu soyler ve "farketmez" durumunda
    // hekimi SOMUT olarak atar. Atanmazsa veritabanindaki cakisma
    // kisiti devreye giremez (kisit staffId IS NULL satirlarini kapsamiyor).
    const slot = await this.availability.resolveSlot({
      serviceId: dto.serviceId,
      startAt,
      staffId: dto.staffId,
    });

    const code = await this.nextCode(startAt);

    try {
      const created = await this.prisma.appointment.create({
        data: {
          code,
          userId: userId ?? null,
          petId: dto.petId ?? null,
          guestName: dto.guestName ?? null,
          guestPhone: dto.guestPhone ?? null,
          guestEmail: dto.guestEmail ?? null,
          guestPetName: dto.guestPetName ?? null,
          guestPetSpecies: dto.guestPetSpecies ?? null,
          serviceId: dto.serviceId,
          staffId: slot.staffId,
          startAt,
          endAt: slot.endAt,
          status: rules.autoConfirm
            ? AppointmentStatus.CONFIRMED
            : AppointmentStatus.PENDING,
          notes: dto.notes ?? null,
        },
        include: DETAIL_INCLUDE,
      });

      // Bildirim gonderimi randevunun olusmasini engellememeli:
      // dispatch kendi icinde hata yutuyor.
      await this.notifications.appointmentCreated(created);
      if (created.status === AppointmentStatus.CONFIRMED) {
        await this.notifications.appointmentConfirmed(created);
      }
      return created;
    } catch (err) {
      // Yaris durumu: motor "musait" dedi ama aradaki milisaniyelerde
      // baska biri ayni slotu aldi. Veritabani son savunma hatti.
      if (isExclusionViolation(err)) {
        throw new ConflictException({
          message: 'Bu saat az once doldu. Lutfen baska bir saat secin.',
          code: 'SLOT_TAKEN',
        });
      }
      throw err;
    }
  }

  /**
   * RND-2026-0042. Yil basina sirali.
   * Not: yogun trafikte iki istek ayni sayiyi uretebilir; code alani
   * unique oldugu icin veritabani ikinciyi reddeder. Tek klinikli bir
   * sistemde bu olasilik ihmal edilebilir; sorun olursa Postgres
   * sequence'ine tasinir.
   */
  private async nextCode(startAt: Date): Promise<string> {
    const year = startAt.getFullYear();
    const count = await this.prisma.appointment.count({
      where: { code: { startsWith: `RND-${year}-` } },
    });
    return `RND-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ─────────────────────────────────────────
  //  Okuma
  // ─────────────────────────────────────────

  async findMine(userId: string, params: { status?: string; upcoming?: boolean }) {
    return this.prisma.appointment.findMany({
      where: {
        userId,
        ...(params.status ? { status: params.status as AppointmentStatus } : {}),
        ...(params.upcoming ? { startAt: { gte: new Date() } } : {}),
      },
      include: DETAIL_INCLUDE,
      orderBy: { startAt: params.upcoming ? 'asc' : 'desc' },
    });
  }

  /** Uye olmayanlarin randevu sorgusu: kod + telefon birlikte dogrulanir. */
  async lookup(code: string, phone: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { code },
      include: { ...DETAIL_INCLUDE, user: { select: { phone: true } } },
    });

    const digits = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '');
    const given = digits(phone);
    const matches =
      appointment !== null &&
      given.length >= 10 &&
      (digits(appointment.guestPhone).endsWith(given.slice(-10)) ||
        digits(appointment.user?.phone).endsWith(given.slice(-10)));

    if (!matches) {
      // Kod dogru ama telefon yanlissa da ayni mesaj: rastgele kod
      // deneyerek baskasinin randevusu ogrenilemesin.
      throw new NotFoundException('Randevu bulunamadi. Kod ve telefonu kontrol edin.');
    }

    const { user: _user, ...rest } = appointment;
    return rest;
  }

  async findOne(id: string, requester: { id: string; role: Role }) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!appointment) throw new NotFoundException('Randevu bulunamadi.');
    this.assertOwnership(appointment.userId, requester);
    return appointment;
  }

  // ─────────────────────────────────────────
  //  Degisiklikler
  // ─────────────────────────────────────────

  async cancel(id: string, requester: { id: string; role: Role }, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Randevu bulunamadi.');
    this.assertOwnership(appointment.userId, requester);

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException('Bu randevu zaten kapanmis.');
    }

    // Iptal suresi kurali yalnizca MUSTERI icin. Admin telefonla gelen
    // iptalleri her zaman isleyebilmeli.
    if (requester.role === 'CUSTOMER') {
      const rules = await this.settings.getAppointmentRules();
      const limit = new Date(
        appointment.startAt.getTime() - rules.cancelBeforeHours * 3_600_000,
      );
      if (new Date() > limit) {
        throw new BadRequestException(
          `Randevular en gec ${rules.cancelBeforeHours} saat oncesine kadar iptal edilebilir. ` +
            'Lutfen klinigi arayin.',
        );
      }
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason ?? null,
      },
      include: DETAIL_INCLUDE,
    });
    await this.notifications.appointmentCancelled(cancelled);
    return cancelled;
  }

  async reschedule(
    id: string,
    requester: { id: string; role: Role },
    body: { startAt: string; staffId?: string },
  ) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Randevu bulunamadi.');
    this.assertOwnership(appointment.userId, requester);

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException('Kapanmis randevu ertelenemez.');
    }

    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Gecersiz tarih/saat.');
    }

    // Randevu kendi eski slotunu isgal ettigi icin motor onu "dolu" gorur.
    // Once iptal isaretleyip sonra tasimak yerine, gecici olarak slottan
    // cikariyoruz: boylece ayni saate erteleme de calisir.
    await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    try {
      const slot = await this.availability.resolveSlot({
        serviceId: appointment.serviceId,
        startAt,
        staffId: body.staffId,
      });

      return await this.prisma.appointment.update({
        where: { id },
        data: {
          startAt,
          endAt: slot.endAt,
          staffId: slot.staffId,
          status: appointment.status, // onceki durumu geri koy
        },
        include: DETAIL_INCLUDE,
      });
    } catch (err) {
      // Basarisizsa randevuyu eski haline dondur — musteri randevusuz kalmasin.
      await this.prisma.appointment.update({
        where: { id },
        data: { status: appointment.status },
      });
      if (isExclusionViolation(err)) {
        throw new ConflictException({
          message: 'Bu saat az once doldu. Lutfen baska bir saat secin.',
          code: 'SLOT_TAKEN',
        });
      }
      throw err;
    }
  }

  // ─────────────────────────────────────────
  //  Admin
  // ─────────────────────────────────────────

  async findAllAdmin(params: {
    from?: string; to?: string; status?: string; staffId?: string; q?: string;
  }) {
    const where: Prisma.AppointmentWhereInput = {
      ...(params.status ? { status: params.status as AppointmentStatus } : {}),
      ...(params.staffId ? { staffId: params.staffId } : {}),
      ...(params.from || params.to
        ? {
            startAt: {
              ...(params.from ? { gte: dayStart(params.from) } : {}),
              ...(params.to ? { lte: dayEnd(params.to) } : {}),
            },
          }
        : {}),
      ...(params.q
        ? {
            OR: [
              { code: { contains: params.q, mode: 'insensitive' } },
              { guestName: { contains: params.q, mode: 'insensitive' } },
              { guestPhone: { contains: params.q } },
              { user: { fullName: { contains: params.q, mode: 'insensitive' } } },
              { pet: { name: { contains: params.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    return this.prisma.appointment.findMany({
      where,
      include: {
        ...DETAIL_INCLUDE,
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 500,
    });
  }

  async setStatus(id: string, status: AppointmentStatus, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Randevu bulunamadi.');

    try {
      const updated = await this.prisma.appointment.update({
        where: { id },
        data: {
          status,
          ...(status === AppointmentStatus.CANCELLED
            ? { cancelledAt: new Date(), cancelReason: reason ?? null }
            : {}),
        },
        include: DETAIL_INCLUDE,
      });

      // Durum degisimi musteriyi ilgilendiriyorsa haber ver.
      if (status === AppointmentStatus.CONFIRMED) {
        await this.notifications.appointmentConfirmed(updated);
      } else if (status === AppointmentStatus.CANCELLED) {
        await this.notifications.appointmentCancelled(updated);
      }
      return updated;
    } catch (err) {
      // Iptal edilmis bir randevuyu geri acarken slot baskasina verilmis olabilir.
      if (isExclusionViolation(err)) {
        throw new ConflictException({
          message: 'Bu saat artik dolu; randevu yeniden acilamiyor.',
          code: 'SLOT_TAKEN',
        });
      }
      throw err;
    }
  }

  // ─────────────────────────────────────────

  private assertOwnership(
    ownerId: string | null,
    requester: { id: string; role: Role },
  ): void {
    if (requester.role === 'ADMIN' || requester.role === 'STAFF') return;
    if (ownerId !== requester.id) {
      throw new ForbiddenException('Bu randevuya erisim yetkiniz yok.');
    }
  }
}

function isExclusionViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma ham Postgres kodunu meta.code icinde tasir.
    const meta = err.meta as { code?: string } | undefined;
    if (meta?.code === PG_EXCLUSION_VIOLATION) return true;
  }
  return (
    err instanceof Error && err.message.includes('Appointment_no_overlap')
  );
}

function dayStart(v: string): Date {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayEnd(v: string): Date {
  const d = new Date(v);
  d.setHours(23, 59, 59, 999);
  return d;
}
