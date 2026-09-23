import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  // ConfigService yerine dogrudan process.env: validateEnv zaten
  // ConfigModule acilisinda calisti, buraya gelindiyse degerler gecerli.
  const env = process.env as unknown as Env;
  const port = Number(env.PORT ?? 3000);
  const webOrigin = env.WEB_ORIGIN ?? 'http://localhost:5173';
  const isProd = env.NODE_ENV === 'production';

  app.use(helmet({
    // Swagger arayuzu inline script kullaniyor; uretimde zaten kapali.
    contentSecurityPolicy: isProd ? undefined : false,
  }));
  app.use(cookieParser());

  // Refresh token httpOnly cookie ile tasindigi icin credentials sart.
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // DTO'da tanimsiz alanlari at
      forbidNonWhitelisted: true, // ve gonderildiyse hata ver
      transform: true,
    }),
  );

  // Swagger sadece uretim disinda: uc listesini herkese acmayalim.
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Veteriner Klinik API')
      .setDescription('Randevu, hasta ve klinik yonetimi API dokumantasyonu')
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
  logger.log(`API hazir: http://localhost:${port}/api/v1`);
  logger.log(`Saglik kontrolu: http://localhost:${port}/api/v1/health`);
  if (!isProd) {
    logger.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
