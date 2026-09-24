import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { TestimonialsService } from '../modules/testimonials/testimonials.service';

/**
 * Zamanlanmış görevler.
 *
 * DEMO_MODE=true iken mesajlar gerçekten gönderilmez; SimulatedChannel
 * loga yazıp veritabanına "gönderilmemiş" olarak işler. Klinik sunumunda
 * yanlışlıkla mesaj gitmesini engeller.
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
   * Randevu hatırlatması — saatlik.
   * 24 saat sonrasındaki randevular taranır. reminderSentAt işaretlenir
   * ki saatlik çalışan görev aynı randevuyu tekrar tekrar hatırlatmasın.
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

    this.logger.log(`${appointments.length} randevu hatırlatması gönderildi.`);
  }

  /**
   * Aşı hatırlatması — her gün 09:00.
   * 7 gün içinde tekrarı gelen aşılar için sahibine bildirim.
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
        title: 'Aşı zamanı yaklaşıyor',
        message:
          `${record.pet.name} için "${record.title}" tekrarı ` +
          `${record.nextDueAt.toLocaleDateString('tr-TR')} tarihinde. ` +
          'Randevu almak ister misiniz?',
        linkUrl: '/randevu',
      });
      sent++;
    }

    if (sent > 0) this.logger.log(`${sent} aşı hatırlatması gönderildi.`);
  }

  /**
   * Geçmiş randevu temizliği — her gün 00:30.
   * Tarihi geçmiş ama hala bekleyen randevular "gelmedi" sayılır;
   * aksi halde admin panelindeki "onay bekleyen" sayacı sürekli şişer.
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
      this.logger.log(`${result.count} geçmiş randevu NO_SHOW olarak kapatıldı.`);
    }
  }

  /**
   * Süresi dolmuş token temizliği — her gün 03:00.
   * Bu satırlar birikirse RefreshToken tablosu sonsuza kadar buyur.
   */
  @Cron('0 3 * * *', { name: 'token-temizligi', timeZone: 'Europe/Istanbul' })
  async cleanupTokens(): Promise<void> {
    const now = new Date();
    const [refresh, reset] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            // Iptal edilmiş token'lar denetim için 30 gün tutulur.
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
        `Token temizliği: ${refresh.count} oturum, ${reset.count} sıfırlama token'i silindi.`,
      );
    }
  }

  /** Google yorumları — her gün 04:00. */
  @Cron('0 4 * * *', { name: 'google-yorum-senkronu', timeZone: 'Europe/Istanbul' })
  async syncGoogleReviews(): Promise<void> {
    await this.testimonials.syncGoogleReviews();
  }
}
