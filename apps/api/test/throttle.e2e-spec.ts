import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Hiz siniri testi AYRI dosyada.
 *
 * auth.e2e-spec.ts arka arkaya onlarca giris yapiyor; orada limit acik
 * olsaydi olculen sey asil davranis degil 429 olurdu. Bu yuzden orada
 * THROTTLE_ENABLED=false. Ama o zaman ozellik hic test edilmemis olurdu —
 * burada acikca acip dogruluyoruz.
 *
 * AppModule import'u env okunduktan SONRA yapilmali, cunku ConfigModule
 * degeri acilista okuyup onbellege aliyor.
 */
describe('Hiz siniri (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  beforeAll(async () => {
    process.env.THROTTLE_ENABLED = 'true';

    // Dinamik import: modul grafigi, env degeri ayarlandiktan sonra kurulsun.
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

  it('giris ucu 5 denemeden sonra 429 doner', async () => {
    const dene = () =>
      request(http)
        .post('/api/v1/auth/login')
        .send({ email: 'yok@ornek.com', password: 'yanlis-sifre' });

    const kodlar: number[] = [];
    for (let i = 0; i < 7; i++) {
      kodlar.push((await dene()).status);
    }

    // Ilk 5 deneme kimlik dogrulamaya ulasir ve 401 alir.
    expect(kodlar.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    // 6. ve sonrasi hiz sinirina takilir.
    expect(kodlar.slice(5)).toEqual([429, 429]);
  });

  it('saglik ucu genel limite takilmaz', async () => {
    // /health izleme araclari tarafindan siklikla cagrilir;
    // giris limitiyle ayni kovaya girmemeli.
    for (let i = 0; i < 10; i++) {
      await request(http).get('/api/v1/health').expect(200);
    }
  });
});
