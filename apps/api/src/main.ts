import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { join } from 'node:path';

import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

  // ConfigService yerine doğrudan process.env: validateEnv zaten
  // ConfigModule açılışında çalıştı, buraya gelindiyse değerler geçerli.
  const env = process.env as unknown as Env;
  const port = Number(env.PORT ?? 3000);
  const webOrigin = env.WEB_ORIGIN ?? 'http://localhost:5173';
  const isProd = env.NODE_ENV === 'production';

  app.use(helmet({
    // Swagger arayüzü inline script kullanıyor; üretimde zaten kapalı.
    contentSecurityPolicy: isProd ? undefined : false,
  }));
  app.use(cookieParser());

  // Refresh token httpOnly cookie ile taşındığı için credentials şart.
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Yüklenen görseller. Bu dizin yalnızca sharp ile yeniden kodlanmış
  // WebP dosyaları içerir (bkz. media.service.ts), yani çalıştırılabilir
  // içerik barındırmaz.
  app.useStaticAssets(join(process.cwd(), env.UPLOAD_DIR ?? './uploads'), {
    prefix: '/uploads/',
    maxAge: '7d',
    index: false,
  });

  app.setGlobalPrefix('api/v1', {
    // Statik dosyalar ve sağlık kontrolü prefix dışında kalsın.
    exclude: [],
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // DTO'da tanımsız alanları at
      forbidNonWhitelisted: true, // ve gönderildiyse hata ver
      transform: true,
    }),
  );

  // Swagger sadece üretim dışında: uç listesini herkese açmayalım.
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Veteriner Klinik API')
      .setDescription('Randevu, hasta ve klinik yönetimi API dokümantasyonu')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, config),
    );
  }

  await app.listen(port);
  logger.log(`API hazır: http://localhost:${port}/api/v1`);
  logger.log(`Sağlık kontrolü: http://localhost:${port}/api/v1/health`);
  if (!isProd) {
    logger.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
