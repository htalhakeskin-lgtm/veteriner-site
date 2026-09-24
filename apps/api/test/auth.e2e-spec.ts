import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const ARGON = { algorithm: 2 as const };

/** Refresh cookie'yi Set-Cookie başlığından çıkarır. */
function refreshCookie(res: request.Response): string | undefined {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.find((c) => c.startsWith('vet_rt='));
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let http: App;

  // Her çalıştırmada benzersiz: testler birbirinin verisine çarpmasın.
  const stamp = Date.now();
  const customerEmail = `e2e-müşteri-${stamp}@ornek.com`;
  const adminEmail = `e2e-admin-${stamp}@ornek.com`;
  const PASSWORD = 'e2e-guclu-sifre';

  beforeAll(async () => {
    // Hız sınırı .env.test içinde THROTTLE_ENABLED=false ile kapalı.
    // overrideGuard(ThrottlerGuard) BURADA ISE YARAMAZ: guard APP_GUARD
    // token'i altında kayıtlı, ThrottlerGuard token'i altında değil.
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // main.ts ile aynı kurulum — testler üretimdeki davranışı olcmeli.
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

    // Rol testleri için hazır bir admin.
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'E2E Admin',
        passwordHash: await hash(PASSWORD, ARGON),
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [customerEmail, adminEmail] } },
    });
    await app.close();
  });

  // ─────────────────────────────────────────
  describe('Kayıt', () => {
    it('geçerli bilgilerle kayıt olur ve token döner', async () => {
      const res = await request(http)
        .post('/api/v1/auth/register')
        .send({
          email: customerEmail,
          fullName: 'E2E Müşteri',
          phone: '0532 111 22 33',
          password: PASSWORD,
        })
        .expect(201);

      expect(res.body.user.email).toBe(customerEmail);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(refreshCookie(res)).toBeDefined();
    });

    it('rolü istemciden ALMAZ - gönderilse bile reddeder', async () => {
      const res = await request(http)
        .post('/api/v1/auth/register')
        .send({
          email: `yetki-${stamp}@ornek.com`,
          fullName: 'Yetki Denemesi',
          password: PASSWORD,
          role: 'ADMIN',
        })
        .expect(400);

      expect(res.body.message).toContain('role');
    });

    it('aynı e-posta ile ikinci kez kayıt olmaz', () =>
      request(http)
        .post('/api/v1/auth/register')
        .send({
          email: customerEmail,
          fullName: 'Kopya Kullanıcı',
          password: PASSWORD,
        })
        .expect(409));

    it('geçersiz alanları reddeder', async () => {
      const res = await request(http)
        .post('/api/v1/auth/register')
        .send({ email: 'bozuk', fullName: 'A', password: 'kisa' })
        .expect(400);

      expect(res.body.message).toMatch(/e-posta/i);
    });
  });

  // ─────────────────────────────────────────
  describe('Giriş', () => {
    it('doğru bilgilerle giriş yapar', async () => {
      const res = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD })
        .expect(200);

      expect(res.body.user.role).toBe('CUSTOMER');
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('refresh cookie httpOnly olarak gelir', async () => {
      const res = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });

      const cookie = refreshCookie(res);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/api/v1/auth');
    });

    it('yanlış şifreyi reddeder', () =>
      request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: 'yanlis-sifre' })
        .expect(401));

    it('olmayan kullanıcı ile var olan kullanıcı AYNI mesajı alır', async () => {
      const yok = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: `yok-${stamp}@ornek.com`, password: 'herhangi' })
        .expect(401);

      const varAma = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: 'yanlis-sifre' })
        .expect(401);

      // Mesaj farklı olsaydı hangi e-postaların kayıtlı olduğu ogrenilebilirdi.
      expect(yok.body.message).toBe(varAma.body.message);
    });
  });

  // ─────────────────────────────────────────
  describe('Korumalı uçlar', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      accessToken = res.body.accessToken;
    });

    it('token olmadan 401 döner', () =>
      request(http).get('/api/v1/users/me').expect(401));

    it('bozuk token ile 401 döner', () =>
      request(http)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer bozuk.token.degeri')
        .expect(401));

    it('geçerli token ile profil döner', async () => {
      const res = await request(http)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(customerEmail);
      // Şifre hash'i ASLA dışarı sizmamali.
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('müşteri admin ucuna erişemez', () =>
      request(http)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403));

    it('admin admin ucuna erisir', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: PASSWORD });

      const res = await request(http)
        .get('/api/v1/users?limit=5')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────
  describe('Token yenileme', () => {
    it('cookie olmadan 401 döner', () =>
      request(http).post('/api/v1/auth/refresh').expect(401));

    it('yeniler ve token ROTASYONU yapar', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      const first = refreshCookie(login)!;

      const res = await request(http)
        .post('/api/v1/auth/refresh')
        .set('Cookie', first)
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(refreshCookie(res)).not.toBe(first);
    });

    it('kullanılmış refresh token ikinci kez ise yaramaz', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      const cookie = refreshCookie(login)!;

      await request(http)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(200);

      // Çalınmış bir token en fazla BIR kez kullanilabilsin.
      await request(http)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('çıkıştan sonra refresh çalışmaz', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      const cookie = refreshCookie(login)!;

      await request(http)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      await request(http)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });
  });

  // ─────────────────────────────────────────
  describe('Şifre işlemleri', () => {
    it('şifre değişimi TÜM oturumları kapatır', async () => {
      const yeniSifre = 'degistirilmis-sifre-99';

      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      const cookie = refreshCookie(login)!;

      await request(http)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ currentPassword: PASSWORD, newPassword: yeniSifre })
        .expect(200);

      // Eski oturum artık yenilenememeli.
      await request(http)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);

      // Yeni şifre çalışmalı.
      await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: yeniSifre })
        .expect(200);

      // Sonraki testler için geri al.
      await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: yeniSifre })
        .then((res) =>
          request(http)
            .patch('/api/v1/users/me/password')
            .set('Authorization', `Bearer ${res.body.accessToken}`)
            .send({ currentPassword: yeniSifre, newPassword: PASSWORD })
            .expect(200),
        );
    });

    it('yanlış mevcut şifre ile değiştirmeyi reddeder', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });

      await request(http)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ currentPassword: 'tamamen-yanlis', newPassword: 'baska-sifre-1' })
        .expect(401);
    });

    it('sıfırlama talebi kullanıcının varligini SIZDIRMAZ', async () => {
      const varOlan = await request(http)
        .post('/api/v1/auth/forgot-password')
        .send({ email: customerEmail })
        .expect(200);

      const olmayan = await request(http)
        .post('/api/v1/auth/forgot-password')
        .send({ email: `kesinlikle-yok-${stamp}@ornek.com` })
        .expect(200);

      expect(varOlan.body.message).toBe(olmayan.body.message);
    });

    it('geçersiz sıfırlama token\'ini reddeder', () =>
      request(http)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'uydurma-token', password: 'yeni-sifre-123' })
        .expect(401));
  });

  // ─────────────────────────────────────────
  describe('Profil', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: PASSWORD });
      accessToken = res.body.accessToken;
    });

    it('ad ve telefon güncellenir', async () => {
      const res = await request(http)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fullName: 'Güncel Ad', phone: '0533 222 33 44' })
        .expect(200);

      expect(res.body.fullName).toBe('Güncel Ad');
    });

    it('e-posta ve rol profilden DEĞİŞTİRİLEMEZ', () =>
      request(http)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'yeni@ornek.com', role: 'ADMIN' })
        .expect(400));
  });
});
