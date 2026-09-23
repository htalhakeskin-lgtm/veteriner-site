import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { TestimonialsService } from '../modules/testimonials/testimonials.service';

/**
 * Zamanlanmis gorevler.
 *
 * DEMO_MODE=true iken mesajlar gercekten gonderilmez; SimulatedChannel
 * loga yazip veritabanina "gonderilmemis" olarak isler. Klinik sunumunda
 * yanlislikla mesaj gitmesini engeller.
 */
@Injectable()
export class RemindersJob {
  private readonly logger = new Logger(RemindersJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly testimonials: TestimonialsService,
  ) {}

  /**
   * Randevu hatirlatmasi — saatlik.
   * 24 saat sonrasindaki randevular taranir. reminderSentAt isaretlenir
   * ki saatlik calisan gorev ayni randevuyu tekrar tekrar hatirlatmasin.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'randevu-hatirlatma' })
  async appointmentReminders(): Promise<void> {
    const from = new Date(Date.now() + 23 * 3_600_000);
    const to = new Date(Date.now() + 25 * 3_600_000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startAt: { gte: from, lte: to },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        reminderSentAt: null,
      },
      include: {
        service: { select: { title: true } },
        staff: { select: { fullName: true } },
      },
    });

    if (appointments.length === 0) return;

    for (const appointment of appointments) {
      await this.notifications.appointmentReminder(appointment);
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    }

    this.logger.log(`${appointments.length} randevu hatirlatmasi gonderildi.`);
  }

  /**
   * Asi hatirlatmasi — her gun 09:00.
   * 7 gun icinde tekrari gelen asilar icin sahibine bildirim.
   */
  @Cron('0 9 * * *', { name: 'asi-hatirlatma', timeZone: 'Europe/Istanbul' })
  async vaccinationReminders(): Promise<void> {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 86_400_000);

    const records = await this.prisma.medicalRecord.findMany({
      where: { nextDueAt: { gte: now, lte: inSevenDays } },
      include: {
        pet: { select: { name: true, ownerId: true } },
      },
    });

    let sent = 0;
    for (const record of records) {
      if (!record.nextDueAt) continue;
      await this.notifications.dispatch({
        userId: record.pet.ownerId,
        type: 'VACCINATION_DUE',
        title: 'Asi zamani yaklasiyor',
        message:
          `${record.pet.name} icin "${record.title}" tekrari ` +
          `${record.nextDueAt.toLocaleDateString('tr-TR')} tarihinde. ` +
          'Randevu almak ister misiniz?',
        linkUrl: '/randevu',
      });
      sent++;
    }

    if (sent > 0) this.logger.log(`${sent} asi hatirlatmasi gonderildi.`);
  }

  /**
   * Gecmis randevu temizligi — her gun 00:30.
   * Tarihi gecmis ama hala bekleyen randevular "gelmedi" sayilir;
   * aksi halde admin panelindeki "onay bekleyen" sayaci surekli sisar.
   */
  @Cron('30 0 * * *', { name: 'gecmis-randevu-temizligi', timeZone: 'Europe/Istanbul' })
  async closeStaleAppointments(): Promise<void> {
    const result = await this.prisma.appointment.updateMany({
      where: {
        endAt: { lt: new Date() },
        status: AppointmentStatus.PENDING,
      },
      data: { status: AppointmentStatus.NO_SHOW },
    });
    if (result.count > 0) {
      this.logger.log(`${result.count} gecmis randevu NO_SHOW olarak kapatildi.`);
    }
  }

  /**
   * Suresi dolmus token temizligi — her gun 03:00.
   * Bu satirlar birikirse RefreshToken tablosu sonsuza kadar buyur.
   */
  @Cron('0 3 * * *', { name: 'token-temizligi', timeZone: 'Europe/Istanbul' })
  async cleanupTokens(): Promise<void> {
    const now = new Date();
    const [refresh, reset] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            // Iptal edilmis token'lar denetim icin 30 gun tutulur.
            { revokedAt: { lt: new Date(now.getTime() - 30 * 86_400_000) } },
          ],
        },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
    ]);

    if (refresh.count + reset.count > 0) {
      this.logger.log(
        `Token temizligi: ${refresh.count} oturum, ${reset.count} sifirlama token'i silindi.`,
      );
    }
  }

  /** Google yorumlari — her gun 04:00. */
  @Cron('0 4 * * *', { name: 'google-yorum-senkronu', timeZone: 'Europe/Istanbul' })
  async syncGoogleReviews(): Promise<void> {
    await this.testimonials.syncGoogleReviews();
  }
}
