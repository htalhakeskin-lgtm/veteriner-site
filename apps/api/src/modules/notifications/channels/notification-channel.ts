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
  /** Uye olmayan alicilar icin */
  phone?: string | null;
  email?: string | null;
}

/**
 * Bildirim kanali arayuzu.
 *
 * Randevu ve cron kodu yalnizca bu arayuzu bilir; saglayici degisse bile
 * (Resend -> Postmark, Twilio -> NetGSM) is mantigi degismez.
 */
export interface NotificationChannel {
  readonly name: string;
  isEnabled(): boolean;
  send(msg: OutboundMessage): Promise<void>;
}

/**
 * Her zaman acik kanal: bildirimi veritabanina yazar.
 * Musteri panelindeki bildirim listesi ve admin panelindeki
 * "gonderilecek mesaj" onizlemesi bunu okur.
 */
@Injectable()
export class DatabaseChannel implements NotificationChannel {
  readonly name = 'DATABASE';

  constructor(private readonly prisma: PrismaService) {}

  isEnabled(): boolean {
    return true;
  }

  async send(msg: OutboundMessage): Promise<void> {
    // Misafir randevularinda userId yok; veritabani bildirimi
    // bir kullaniciya bagli oldugu icin atlanir.
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
 * DEMO_MODE=true iken e-posta / SMS / WhatsApp yerine gecen kanal.
 *
 * Gercekten mesaj GONDERMEZ: ne yazacagini loga dusurur ve veritabanina
 * "gonderilmemis" olarak isler. Klinik sunumunda yanlislikla gercek
 * mesaj gitmesini ve maliyet olusmasini engeller; buna ragmen akisin
 * uctan uca denenebilmesini saglar.
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
    this.logger.log(`[SIMULASYON] -> ${hedef}: ${msg.title} | ${msg.message}`);

    if (!msg.userId) return;
    await this.prisma.notification.create({
      data: {
        userId: msg.userId,
        type: msg.type,
        title: msg.title,
        message: msg.message,
        linkUrl: msg.linkUrl ?? null,
        channel: 'WHATSAPP_SIMULATED',
        // sentAt bilerek BOS: gercekten gonderilmedi. Admin paneli
        // bunlari "gonderilecek" olarak gosterebilir.
        sentAt: null,
      },
    });
  }
}

/**
 * WhatsApp derin baglantisi uretici.
 * Saglayici (Meta Cloud API / Twilio) gerekmez; sitedeki WhatsApp
 * butonlari ve admin panelindeki "WhatsApp'tan yaz" baglantisi bunu kullanir.
 */
export function buildWhatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  // Turkiye numaralari: 0532... -> 90532...
  const intl = digits.startsWith('90')
    ? digits
    : digits.startsWith('0')
      ? `90${digits.slice(1)}`
      : `90${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
