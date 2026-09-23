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
      this.logger.log('Veritabani baglantisi kuruldu');
    } catch (err) {
      // Docker calismiyorsa en sik karsilasilan durum bu.
      // Genel "connect ECONNREFUSED" yerine ne yapilacagini soyluyoruz.
      this.logger.error(
        'Veritabanina baglanilamadi. Docker Desktop calisiyor mu? ' +
          'Calistirmak icin: npm run db:up',
      );

      // Uretimde hizlica cok: orkestrator yeniden baslatsin.
      // Gelistirmede ayakta kaliyoruz - aksi halde /health ucu hic cevap
      // veremez ve "neden calismiyor" sorusuna bakacak yer kalmaz.
      if (process.env.NODE_ENV === 'production') throw err;

      this.logger.warn(
        'Gelistirme modunda devam ediliyor. /health ucu "degraded" donecek.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** /health ucunun kullandigi hafif canlilik sorgusu. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
