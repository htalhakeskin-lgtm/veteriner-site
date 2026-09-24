import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Hız sınırı testi AYRI dosyada.
 *
 * auth.e2e-spec.ts arka arkaya onlarca giriş yapıyor; orada limit açık
 * olsaydı ölçülen şey asıl davranış değil 429 olurdu. Bu yüzden orada
 * THROTTLE_ENABLED=false. Ama o zaman özellik hiç test edilmemis olurdu —
 * burada açıkça acip doğruluyoruz.
 *
 * AppModule import'u env okunduktan SONRA yapilmali, çünkü ConfigModule
 * değeri açılışta okuyup onbellege aliyor.
 */
describe('Hız sınırı (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  beforeAll(async () => {
    process.env.THROTTLE_ENABLED = 'true';

    // Dinamik import: modül grafiği, env değeri ayarlandıktan sonra kurulsun.
    const { AppModule } = await import('../src/app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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
    http = app.getHttpServer();
  });

  afterAll(async () => {
    process.env.THROTTLE_ENABLED = 'false';
    await app.close();
  });

  it('giriş ucu 5 denemeden sonra 429 döner', async () => {
    const dene = () =>
      request(http)
        .post('/api/v1/auth/login')
        .send({ email: 'yok@ornek.com', password: 'yanlis-sifre' });

    const kodlar: number[] = [];
    for (let i = 0; i < 7; i++) {
      kodlar.push((await dene()).status);
    }

    // Ilk 5 deneme kimlik doğrulamaya ulasir ve 401 alır.
    expect(kodlar.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    // 6. ve sonrası hız sınırına takilir.
    expect(kodlar.slice(5)).toEqual([429, 429]);
  });

  it('sağlık ucu genel limite takilmaz', async () => {
    // /health izleme araclari tarafından sıklıkla cagrilir;
    // giriş limitiyle aynı kovaya girmemeli.
    for (let i = 0; i < 10; i++) {
      await request(http).get('/api/v1/health').expect(200);
    }
  });
});
