import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import type { ContactMessageDto, SubscribeDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  //  İletişim formu
  // ─────────────────────────────────────────

  async submit(dto: ContactMessageDto, ipAddress?: string) {
    // Honeypot: gerçek kullanıcının görmediği, botların doldurduğu alan.
    // Doluysa başarılı gibi yanıt veriyoruz ki bot yeniden denemesin.
    if (dto.website) {
      return { message: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.' };
    }

    await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        ipAddress: ipAddress ?? null,
      },
    });

    return { message: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.' };
  }

  findAllAdmin(params: { isRead?: boolean }) {
    return this.prisma.contactMessage.findMany({
      where: params.isRead !== undefined ? { isRead: params.isRead } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async unreadCount() {
    const count = await this.prisma.contactMessage.count({ where: { isRead: false } });
    return { count };
  }

  async markRead(id: string) {
    const found = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Mesaj bulunamadı.');
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markReplied(id: string) {
    const found = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Mesaj bulunamadı.');
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true, repliedAt: new Date() },
    });
  }

  async removeMessage(id: string) {
    const found = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Mesaj bulunamadı.');
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }

  // ─────────────────────────────────────────
  //  E-bülten
  // ─────────────────────────────────────────

  async subscribe(dto: SubscribeDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        // "Zaten kayıtlısınız" demek, hangi e-postaların abone olduğunu
        // ele verir. Aynı yanıtı dönüyoruz.
        return { message: 'Aboneliğiniz oluşturuldu.' };
      }
      // Daha önce çıkmış biri yeniden abone olabilmeli.
      await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true, unsubscribedAt: null, subscribedAt: new Date() },
      });
      return { message: 'Aboneliğiniz oluşturuldu.' };
    }

    await this.prisma.newsletterSubscriber.create({
      data: { email, unsubscribeToken: randomBytes(24).toString('base64url') },
    });
    return { message: 'Aboneliğiniz oluşturuldu.' };
  }

  async unsubscribe(token: string) {
    const sub = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
    if (!sub) {
      throw new BadRequestException('Abonelik bağlantısı geçersiz.');
    }
    if (sub.isActive) {
      await this.prisma.newsletterSubscriber.update({
        where: { id: sub.id },
        data: { isActive: false, unsubscribedAt: new Date() },
      });
    }
    return { message: 'Abonelikten çıkarıldınız.' };
  }

  listSubscribers() {
    return this.prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
      select: { id: true, email: true, subscribedAt: true },
    });
  }

  /** CSV dışa aktarma — admin panelindeki "listeyi indir" için. */
  async exportSubscribersCsv(): Promise<string> {
    const rows = await this.listSubscribers();
    const header = 'email,abonelik_tarihi';
    const body = rows
      .map((r) => `${csvEscape(r.email)},${r.subscribedAt.toISOString()}`)
      .join('\n');
    return `${header}\n${body}\n`;
  }
}

/**
 * CSV enjeksiyonu koruması: "=" ile başlayan bir hücre Excel'de
 * formül olarak çalışır. Başına tırnak koyarak metne zorluyoruz.
 */
function csvEscape(value: string): string {
  const risky = /^[=+\-@]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return `"${risky ? "'" : ''}${escaped}"`;
}
