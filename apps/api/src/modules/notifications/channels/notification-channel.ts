import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

export interface OutboundMessage {
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  /** Üye olmayan alicilar için */
  phone?: string | null;
  email?: string | null;
}

/**
 * Bildirim kanalı arayüzü.
 *
 * Randevu ve cron kodu yalnızca bu arayüzü bilir; sağlayıcı değişse bile
 * (Resend -> Postmark, Twilio -> NetGSM) is mantığı değişmez.
 */
export interface NotificationChannel {
  readonly name: string;
  isEnabled(): boolean;
  send(msg: OutboundMessage): Promise<void>;
}

/**
 * Her zaman açık kanal: bildirimi veritabanına yazar.
 * Müşteri panelindeki bildirim listesi ve admin panelindeki
 * "gönderilecek mesaj" önizlemesi bunu okur.
 */
@Injectable()
export class DatabaseChannel implements NotificationChannel {
  readonly name = 'DATABASE';

  constructor(private readonly prisma: PrismaService) {}

  isEnabled(): boolean {
    return true;
  }

  async send(msg: OutboundMessage): Promise<void> {
    // Misafir randevularında userId yok; veritabanı bildirimi
    // bir kullanıcıya bağlı olduğu için atlanır.
    if (!msg.userId) return;

    await this.prisma.notification.create({
      data: {
        userId: msg.userId,
        type: msg.type,
        title: msg.title,
        message: msg.message,
        linkUrl: msg.linkUrl ?? null,
        channel: this.name,
        sentAt: new Date(),
      },
    });
  }
}

/**
 * DEMO_MODE=true iken e-posta / SMS / WhatsApp yerine geçen kanal.
 *
 * Gerçekten mesaj GÖNDERMEZ: ne yazacağını loga düşürür ve veritabanına
 * "gönderilmemiş" olarak işler. Klinik sunumunda yanlışlıkla gerçek
 * mesaj gitmesini ve maliyet oluşmasını engeller; buna rağmen akışın
 * uçtan uca denenebilmesini sağlar.
 */
@Injectable()
export class SimulatedChannel implements NotificationChannel {
  readonly name = 'SIMULATED';
  private readonly logger = new Logger('BildirimSimulasyonu');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('DEMO_MODE') !== false;
  }

  async send(msg: OutboundMessage): Promise<void> {
    const hedef = msg.phone ?? msg.email ?? msg.userId ?? 'bilinmeyen';
    this.logger.log(`[SİMÜLASYON] -> ${hedef}: ${msg.title} | ${msg.message}`);

    if (!msg.userId) return;
    await this.prisma.notification.create({
      data: {
        userId: msg.userId,
        type: msg.type,
        title: msg.title,
        message: msg.message,
        linkUrl: msg.linkUrl ?? null,
        channel: 'WHATSAPP_SIMULATED',
        // sentAt bilerek BOŞ: gerçekten gönderilmedi. Admin paneli
        // bunları "gönderilecek" olarak gösterebilir.
        sentAt: null,
      },
    });
  }
}

/**
 * WhatsApp derin bağlantısı üretici.
 * Sağlayıcı (Meta Cloud API / Twilio) gerekmez; sitedeki WhatsApp
 * butonları ve admin panelindeki "WhatsApp'tan yaz" bağlantısı bunu kullanır.
 */
export function buildWhatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  // Türkiye numaraları: 0532... -> 90532...
  const intl = digits.startsWith('90')
    ? digits
    : digits.startsWith('0')
      ? `90${digits.slice(1)}`
      : `90${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
