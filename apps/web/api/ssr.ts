import { createRequestHandler } from '@react-router/express';
import express from 'express';

/**
 * Vercel serverless fonksiyonu — React Router SSR girişi.
 *
 * NEDEN BU DOSYA VAR: "react-router build" (ssr: true) iki şey üretir:
 *   - build/client  : statik varlıklar + ÖNCEDEN render edilmiş HTML'ler
 *                      (react-router.config.ts'teki prerender() listesi)
 *   - build/server/index.js : SSR render motoru (ESM, saf modül — kendi
 *                      başına bir HTTP sunucusu DEĞİL)
 *
 * `react-router-serve` (apps/web/package.json → start) bu ikisini Express
 * ile birleştirip port dinleyen bir sunucu kurar; Vercel'de öyle bir süreç
 * yok. Bu dosya aynı birleştirmeyi (createRequestHandler ile) yapıyor,
 * ama app.listen() yerine Express instance'ı doğrudan handler olarak
 * dışa veriyor. Statik varlıklar BURADA sunulmuyor — onları Vercel'in
 * kendisi vercel.json'daki "filesystem" kuralı sayesinde build/client'tan
 * doğrudan (fonksiyon çalıştırmadan) sunuyor; bu dosyaya yalnızca o
 * eşleşmeyen istekler düşer.
 */

// @ts-expect-error -- derleme zamanında üretilen dosya; tip tanımı yok.
import * as build from '../build/server/index.js';

const app = express();
app.disable('x-powered-by');
// app.all('*', ...) DEĞİL: Express 5'te path-to-regexp çıplak "*"
// kabul etmiyor ("Missing parameter name"). Yol vermeden app.use()
// zaten TÜM metot ve yolları yakalar — tam istediğimiz bu.
app.use(
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  }),
);

export default app;
