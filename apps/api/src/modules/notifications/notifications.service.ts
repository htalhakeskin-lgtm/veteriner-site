import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Appointment, Service, StaffMember } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  DatabaseChannel,
  SimulatedChannel,
  type NotificationChannel,
  type OutboundMessage,
} from './channels/notification-channel';

type AppointmentWithDetails = Appointment & {
  service: Pick<Service, 'title'>;
  staff: Pick<StaffMember, 'fullName'> | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly channels: NotificationChannel[];

  constructor(
    private readonly prisma: PrismaService,
    db: DatabaseChannel,
    simulated: SimulatedChannel,
  ) {
    // Sıra önemli değil; her kanal kendi isEnabled() kontrolünü yapar.
    // Faz ilerledikçe EmailChannel / WhatsappChannel buraya eklenir.
    this.channels = [db, simulated];
  }

  /** Tüm açık kanallara gönderir. Bir kanalın hatası diğerlerini durdurmaz. */
  async dispatch(msg: OutboundMessage): Promise<void> {
    for (const channel of this.channels) {
      if (!channel.isEnabled()) continue;
      try {
        await channel.send(msg);
      } catch (err) {
        // Bildirim gönderilemediği için randevu işlemi başarısız olmamalı.
        this.logger.error(
          `${channel.name} kanalı başarısız: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─────────────────────────────────────────
  //  Randevu yaşam döngüsü mesajları
  // ─────────────────────────────────────────

  private formatDate(d: Date): string {
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private recipient(a: Appointment) {
    return {
      userId: a.userId,
      phone: a.guestPhone,
      email: a.guestEmail,
    };
  }

  async appointmentCreated(a: AppointmentWithDetails): Promise<void> {
    await this.dispatch({
      ...this.recipient(a),
      type: 'APPOINTMENT_CREATED',
      title: 'Randevu talebiniz alındı',
      message:
        `${this.formatDate(a.startAt)} için ${a.service.title} randevu talebiniz alındı. ` +
        `Kod: ${a.code}. Onaylandığında bilgilendirileceksiniz.`,
      linkUrl: `/hesap/randevularim`,
    });
  }

  async appointmentConfirmed(a: AppointmentWithDetails): Promise<void> {
    await this.dispatch({
      ...this.recipient(a),
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Randevunuz onaylandı',
      message:
        `Randevunuz onaylandı: ${this.formatDate(a.startAt)} - ${a.service.title}` +
        (a.staff ? ` (${a.staff.fullName})` : '') +
        `. Kod: ${a.code}`,
      linkUrl: `/hesap/randevularim`,
    });
  }

  async appointmentCancelled(a: AppointmentWithDetails): Promise<void> {
    await this.dispatch({
      ...this.recipient(a),
      type: 'APPOINTMENT_CANCELLED',
      title: 'Randevunuz iptal edildi',
      message:
        `${this.formatDate(a.startAt)} tarihli ${a.service.title} randevunuz iptal edildi. ` +
        `Yeni randevu için sitemizi ziyaret edebilirsiniz.`,
      linkUrl: `/randevu`,
    });
  }

  async appointmentReminder(a: AppointmentWithDetails): Promise<void> {
    await this.dispatch({
      ...this.recipient(a),
      type: 'APPOINTMENT_REMINDER',
      title: 'Randevu hatırlatması',
      message:
        `Yarın ${this.formatDate(a.startAt)} randevunuz var: ${a.service.title}` +
        (a.staff ? ` - ${a.staff.fullName}` : '') +
        '.',
      linkUrl: `/hesap/randevularim`,
    });
  }

  // ─────────────────────────────────────────
  //  Kullanıcı tarafı
  // ─────────────────────────────────────────

  findMine(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    // updateMany + userId: başkasının bildirimini okundu işaretlemeyi engeller.
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Bildirim bulunamadı.');
    return { updated: result.count };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }
}
