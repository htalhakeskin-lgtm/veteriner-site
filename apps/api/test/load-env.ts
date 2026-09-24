/**
 * Testler .env.test kullanır (ayrı veritabanı).
 * jest.config'in setupFiles'i ile, uygulama modülleri yüklenmeden önce çalışır.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '..', '.env.test'), override: true });
