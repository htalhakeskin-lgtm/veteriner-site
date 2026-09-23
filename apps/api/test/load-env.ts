/**
 * Testler .env.test kullanir (ayri veritabani).
 * jest.config'in setupFiles'i ile, uygulama modulleri yuklenmeden once calisir.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '..', '.env.test'), override: true });
