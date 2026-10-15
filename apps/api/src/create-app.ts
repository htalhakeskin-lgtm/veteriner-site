import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import type { Env } from './config/env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * main.ts (uzun ömürlü sunucu) ve api/index.ts (Vercel serverless fonksiyonu)
 * ARASINDA PAYLAŞILAN uygulama kurulumu.
 *
 * Statik dosya servisi (yüklenen görseller) ve app.listen() BİLEREK burada
 * değil: biri sadece geleneksel sunucuda, diğeri hiçbir yerde anlamlı değil.
 * Bkz. api/index.ts başındaki not.
 */
export function configureApp(app: NestExpressApplication): void {
  const env = process.env as unknown as Env;
  const webOrigin = env.WEB_ORIGIN ?? 'http://localhost:5173';
  const isProd = env.NODE_ENV === 'production';

  app.use(
    helmet({
      // Swagger arayüzü inline script kullanıyor; üretimde zaten kapalı.
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );
  app.use(cookieParser());

  // Refresh token httpOnly cookie ile taşındığı için credentials şart.
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [],
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımsız alanları at
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
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
}

export const bootstrapLogger = new Logger('Bootstrap');
