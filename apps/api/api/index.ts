import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/create-app';

/**
 * Vercel serverless fonksiyonu girişi.
 *
 * NEDEN BU DOSYA VAR: main.ts bir kere çalışıp sonsuza kadar port dinleyen
 * geleneksel bir sunucu kurar (app.listen). Vercel'de öyle bir süreç yok —
 * her istek (ya da soğuk başlangıçta ilk istek) bu fonksiyonu çağırır,
 * yanıt dönünce süreç dondurulabilir/öldürülebilir. Bu yüzden:
 *   - app.listen() YOK; Express instance'ı doğrudan handler olarak kullanılır.
 *   - Nest uygulaması bir kere kurulup (soğuk başlangıçta) modül seviyesinde
 *     ÖNBELLEĞE alınır; sıcak çağrılarda yeniden kurulmaz.
 *   - Eşzamanlı ilk istekler aynı promise'i bekler (yarış durumu yok).
 *
 * KASITLI OLARAK EKLENMEDİ — statik görsel servisi (useStaticAssets):
 * Vercel serverless fonksiyonlarında dosya sistemi /tmp dışında salt
 * okunurdur, /tmp ise her çağrıda/soğuk başlangıçta sıfırlanabilir ve
 * fonksiyon örnekleri arasında PAYLAŞILMAZ. Yani bir görseli bu süreçte
 * yazıp başka bir isteğe (farklı örnek olabilir) güvenilir şekilde
 * sunamayız. Medya yükleme bu kurulumda çalışmaz; bkz. README "Bilinen
 * eksikler". Kalıcı depolama gerekirse Vercel Blob/S3 gibi bir servis
 * eklenmeli — kapsam dışı tutuldu (ücretli/ekstra kurulum gerektirir).
 */

const server = express();

let appReady: Promise<void> | null = null;

async function init(): Promise<void> {
  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  configureApp(app);
  await app.init();
}

export default async function handler(req: Request, res: Response): Promise<void> {
  // Modül seviyesinde BAŞLATMAK yerine burada (ve promise'i önbelleğe
  // alarak) kurmak kasıtlı: eşzamanlı gelen ilk istekler Nest henüz hazır
  // değilken route bulamayıp 404 dönebilirdi. Bu şekilde hepsi aynı
  // kurulumu bekler.
  if (!appReady) appReady = init();
  await appReady;
  server(req, res);
}
