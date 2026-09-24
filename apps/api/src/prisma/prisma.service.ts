import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Veritabanı bağlantısı kuruldu');
    } catch (err) {
      // Docker çalışmıyorsa en sık karşılaşılan durum bu.
      // Genel "connect ECONNREFUSED" yerine ne yapılacağını söylüyoruz.
      this.logger.error(
        'Veritabanına bağlanılamadı. Docker Desktop çalışıyor mu? ' +
          'Çalıştırmak için: npm run db:up',
      );

      // Üretimde hızlıca çok: orkestratör yeniden başlatsın.
      // Geliştirmede ayakta kalıyoruz - aksi halde /health ucu hiç cevap
      // veremez ve "neden çalışmıyor" sorusuna bakacak yer kalmaz.
      if (process.env.NODE_ENV === 'production') throw err;

      this.logger.warn(
        'Geliştirme modunda devam ediliyor. /health ucu "degraded" dönecek.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** /health ucunun kullandığı hafif canlılık sorgusu. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
