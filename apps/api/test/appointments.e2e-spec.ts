import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const ARGON = { algorithm: 2 as const };

/** Yerel gün anahtarı — toISOString() UTC'ye çevirip günü kaydırır. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('Randevular (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let http: App;

  const stamp = Date.now();
  const email = `e2e-randevu-${stamp}@ornek.com`;
  const PASSWORD = 'e2e-guclu-sifre';

  let token: string;
  let userId: string;
  let serviceId: string;
  let staffId: string;
  let day: string;
  const created: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    http = app.getHttpServer();

    const user = await prisma.user.create({
      data: {
        email,
        fullName: 'E2E Randevu Müşterisi',
        phone: '0532 777 88 99',
        passwordHash: await hash(PASSWORD, ARGON),
        role: 'CUSTOMER',
      },
    });
    userId = user.id;

    const login = await request(http)
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD });
    token = login.body.accessToken;

    // Test veritabanı boş olabilir; gerekli kayıtları kendimiz kuruyoruz.
    const service = await prisma.service.upsert({
      where: { slug: `e2e-muayene-${stamp}` },
      create: {
        slug: `e2e-muayene-${stamp}`,
        title: 'E2E Muayene',
        shortDesc: 'test',
        category: 'Genel',
        durationMinutes: 30,
      },
      update: {},
    });
    serviceId = service.id;

    // Pazartesi-Cumartesi çalışan tek hekim.
    const staff = await prisma.staffMember.create({
      data: {
        slug: `e2e-hekim-${stamp}`,
        fullName: 'E2E Hekim',
        title: 'Veteriner Hekim',
        services: { connect: { id: service.id } },
        schedules: {
          create: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
          })),
        },
      },
    });

    // Ayarlar satırı yoksa oluştur (müsaitlik motoru buna bağımlı).
    await prisma.siteSetting.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        clinic: {}, contact: {}, workingHours: {}, theme: {}, features: {},
        appointmentRules: {
          slotDurationMinutes: 30, leadTimeHours: 2, daysInAdvance: 30,
          cancelBeforeHours: 24, autoConfirm: false, maxDailySlots: 0,
          blockedWeekdays: [0],
        },
        seo: {}, socialLinks: {},
      },
      update: {},
    });

    const d = new Date();
    d.setDate(d.getDate() + 7);
    while (d.getDay() === 0) d.setDate(d.getDate() + 1);
    day = dayKey(d);

    staffId = staff.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { id: { in: created } } });
    await prisma.appointment.deleteMany({ where: { serviceId } });
    await prisma.staffSchedule.deleteMany({ where: { staffId } });
    await prisma.staffMember.deleteMany({
      where: { slug: `e2e-hekim-${stamp}` },
    });
    await prisma.service.deleteMany({ where: { id: serviceId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  async function firstSlot(): Promise<{ start: string; time: string }> {
    const res = await request(http)
      .get(`/api/v1/availability?serviceId=${serviceId}&from=${day}&to=${day}`)
      .expect(200);
    const slots = res.body.days[0].slots;
    expect(slots.length).toBeGreaterThan(0);
    return slots[0];
  }

  describe('Müsaitlik', () => {
    it('hizmet süresine göre slot üretir', async () => {
      const res = await request(http)
        .get(`/api/v1/availability?serviceId=${serviceId}&from=${day}&to=${day}`)
        .expect(200);

      expect(res.body.durationMinutes).toBe(30);
      expect(res.body.days[0].isOpen).toBe(true);
      // 09:00-17:00, 30 dakikalık adım -> 16 slot
      expect(res.body.days[0].slots).toHaveLength(16);
    });

    it('Pazar günü kapalı döner', async () => {
      const sunday = new Date();
      sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));
      const res = await request(http)
        .get(
          `/api/v1/availability?serviceId=${serviceId}&from=${dayKey(sunday)}&to=${dayKey(sunday)}`,
        )
        .expect(200);

      expect(res.body.days[0].isOpen).toBe(false);
      expect(res.body.days[0].reason).toBe('WEEKLY_CLOSED');
    });

    it('randevu penceresi disini açıklamayla reddeder', async () => {
      const far = new Date();
      far.setDate(far.getDate() + 200);
      const res = await request(http)
        .get(
          `/api/v1/availability?serviceId=${serviceId}&from=${dayKey(far)}&to=${dayKey(far)}`,
        )
        .expect(400);

      // Sessizce boş liste dönmek "bozuk mu, dolu mu?" belirsizliği yaratıyordu.
      expect(res.body.message).toMatch(/gün sonrası için randevu/i);
    });
  });

  describe('Randevu oluşturma', () => {
    it('GİRİŞ YAPMIŞ kullanıcıyı misafir saymaz', async () => {
      // Regresyon: /appointments @Public() olduğu için guard token'a hiç
      // bakmiyordu. Üye randevusu misafir randevusu olarak kaydediliyor,
      // "Randevularım"da görünmüyor ve boşuna telefon isteniyordu.
      const slot = await firstSlot();
      const res = await request(http)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId, startAt: slot.start })
        .expect(201);

      created.push(res.body.id);
      expect(res.body.userId).toBe(userId);
      expect(res.body.code).toMatch(/^RND-\d{4}-\d{4}$/);
      expect(res.body.status).toBe('PENDING');
    });

    it('üye randevusu "Randevularım" listesinde çıkar', async () => {
      const res = await request(http)
        .get('/api/v1/appointments/me?upcoming=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.map((a: { id: string }) => a.id)).toContain(created[0]);
    });

    it('bildirim üretir', async () => {
      const notifications = await prisma.notification.findMany({
        where: { userId, type: 'APPOINTMENT_CREATED' },
      });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('misafir randevusunda telefon ister', async () => {
      const slot = await firstSlot();
      await request(http)
        .post('/api/v1/appointments')
        .send({ serviceId, startAt: slot.start, guestName: 'Telefonsuz' })
        .expect(400);
    });

    it('dolu slota ikinci randevuyu reddeder', async () => {
      // Tek hekim var; ilk test o saati aldı.
      const taken = created[0]!;
      const appointment = await prisma.appointment.findUnique({
        where: { id: taken },
      });

      await request(http)
        .post('/api/v1/appointments')
        .send({
          serviceId,
          startAt: appointment!.startAt.toISOString(),
          guestName: 'Ikinci Kişi',
          guestPhone: '0533 111 22 33',
        })
        .expect(400); // SLOT_UNAVAILABLE
    });

    it('alınan slot müsaitlik listesinden düşer', async () => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: created[0]! },
      });
      const res = await request(http)
        .get(`/api/v1/availability?serviceId=${serviceId}&from=${day}&to=${day}`)
        .expect(200);

      const times = res.body.days[0].slots.map((s: { start: string }) => s.start);
      expect(times).not.toContain(appointment!.startAt.toISOString());
    });
  });

  describe('Randevu sorgulama', () => {
    it('kod + doğru telefon ile bulunur', async () => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: created[0]! },
      });
      const res = await request(http)
        .get(
          `/api/v1/appointments/lookup?code=${appointment!.code}&phone=0532 777 88 99`,
        )
        .expect(200);
      expect(res.body.code).toBe(appointment!.code);
    });

    it('yanlış telefonla bulunamaz', async () => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: created[0]! },
      });
      // Rastgele kod deneyerek başkasının randevusu ogrenilememeli.
      await request(http)
        .get(
          `/api/v1/appointments/lookup?code=${appointment!.code}&phone=0500 000 00 00`,
        )
        .expect(404);
    });
  });

  describe('Iptal', () => {
    it('müşteri kendi randevusunu iptal eder', async () => {
      const res = await request(http)
        .patch(`/api/v1/appointments/${created[0]}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Test' })
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
    });

    it('iptal edilen saat yeniden satılabilir', async () => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: created[0]! },
      });
      const res = await request(http)
        .get(`/api/v1/availability?serviceId=${serviceId}&from=${day}&to=${day}`)
        .expect(200);

      const times = res.body.days[0].slots.map((s: { start: string }) => s.start);
      expect(times).toContain(appointment!.startAt.toISOString());
    });

    it('kapanmış randevu tekrar iptal edilemez', async () => {
      await request(http)
        .patch(`/api/v1/appointments/${created[0]}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });
});
