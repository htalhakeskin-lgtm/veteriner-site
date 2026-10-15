import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { join } from 'node:path';

import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { bootstrapLogger, configureApp } from './create-app';
import type { Env } from './config/env';

/**
 * Geleneksel sunucu girişi (Docker/VPS, yerel geliştirme). Vercel'de bu
 * dosya KULLANILMAZ — orada apps/api/api/index.ts devreye girer, çünkü
 * serverless fonksiyonlar app.listen() ile port dinleyemez. Paylaşılan
 * kurulum create-app.ts'te; bkz. o dosyanın başındaki not.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const env = process.env as unknown as Env;
  const port = Number(env.PORT ?? 3000);
  const isProd = env.NODE_ENV === 'production';

  configureApp(app);

  // Yüklenen görseller. Bu dizin yalnızca sharp ile yeniden kodlanmış
  // WebP dosyaları içerir (bkz. media.service.ts), yani çalıştırılabilir
  // içerik barındırmaz.
  app.useStaticAssets(join(process.cwd(), env.UPLOAD_DIR ?? './uploads'), {
    prefix: '/uploads/',
    maxAge: '7d',
    index: false,
  });

  await app.listen(port);
  bootstrapLogger.log(`API hazır: http://localhost:${port}/api/v1`);
  bootstrapLogger.log(`Sağlık kontrolü: http://localhost:${port}/api/v1/health`);
  if (!isProd) {
    bootstrapLogger.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
