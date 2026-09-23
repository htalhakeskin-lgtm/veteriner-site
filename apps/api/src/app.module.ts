import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './config/env';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),

    // Genel hiz siniri. Giris, kayit ve sifre sifirlama gibi uclar
    // kendi daha siki limitlerini @Throttle ile ayrica belirtir.
    //
    // skipIf: e2e testlerinde kapatilabilsin diye. Test suiti arka arkaya
    // onlarca giris yapiyor; limit acik kalsaydi olculen sey asil davranis
    // degil 429 olurdu. Hiz sinirinin kendisi ayri bir testte, acik haliyle
    // dogrulanir (throttle.e2e-spec.ts).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
        skipIf: () => config.get<boolean>('THROTTLE_ENABLED') === false,
      }),
    }),

    // Guard'in token dogrulayabilmesi icin global JwtModule.
    JwtModule.register({ global: true }),

    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // SIRA ONEMLI — guard'lar yazildiklari sirayla calisir:
    //  1) ThrottlerGuard : pahali islerden once hiz sinirini uygula
    //  2) JwtAuthGuard   : req.user'i doldur
    //  3) RolesGuard     : req.user'a bakarak rol kontrolu yap
    // RolesGuard once gelseydi req.user hep bos olur ve tum rol
    // kontrolleri sessizce 403 dondururdu.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
