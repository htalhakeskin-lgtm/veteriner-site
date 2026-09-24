import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './config/env';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { BlogModule } from './modules/blog/blog.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MediaModule } from './modules/media/media.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PetsModule } from './modules/pets/pets.module';
import { ServicesModule } from './modules/services/services.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StaffModule } from './modules/staff/staff.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),

    // Genel hız sınırı. Giriş, kayıt ve şifre sıfırlama gibi uçlar
    // kendi daha sıkı limitlerini @Throttle ile ayrıca belirtir.
    //
    // skipIf: e2e testlerinde kapatılabilsin diye. Test suiti arka arkaya
    // onlarca giriş yapıyor; limit açık kalsaydı ölçülen şey asıl davranış
    // değil 429 olurdu. Hız sınırının kendisi ayrı bir testte, açık haliyle
    // doğrulanır (throttle.e2e-spec.ts).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
        skipIf: () => config.get<boolean>('THROTTLE_ENABLED') === false,
      }),
    }),

    // Guard'in token doğrulayabilmesi için global JwtModule.
    JwtModule.register({ global: true }),

    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    ServicesModule,
    StaffModule,
    AvailabilityModule,
    AppointmentsModule,
    PetsModule,
    NotificationsModule,
    BlogModule,
    TestimonialsModule,
    ContactModule,
    MediaModule,
    DashboardModule,
    ScheduleModule.forRoot(),
    JobsModule,
  ],
  providers: [
    // SIRA ÖNEMLİ — guard'lar yazıldıkları sırayla çalışır:
    //  1) ThrottlerGuard : pahalı işlerden önce hız sınırını uygula
    //  2) JwtAuthGuard   : req.user'i doldur
    //  3) RolesGuard     : req.user'a bakarak rol kontrolü yap
    // RolesGuard önce gelseydi req.user hep boş olur ve tüm rol
    // kontrolleri sessizce 403 döndürürdü.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
