import { z } from 'zod';

/**
 * Ortam degiskenleri uygulama ACILIRKEN dogrulanir.
 *
 * Amac: eksik veya hatali bir degisken yuzunden sistemin saatler sonra,
 * rastgele bir istekte patlamasi yerine, daha basta anlasilir bir hatayla
 * durmasi. Ozellikle JWT sirlari icin kritik.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL zorunlu. .env.example dosyasini .env olarak kopyala.'),

  // Frontend'in adresi - CORS sadece buna izin verir
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  // Demo modunda e-posta / SMS / WhatsApp GERCEKTEN gonderilmez,
  // sadece Notification tablosuna yazilir. Klinik sunumlarinda
  // yanlislikla mesaj gitmesini ve maliyet olusmasini engeller.
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(5),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const satirlar = parsed.error.issues.map(
      (i) => `  - ${i.path.join('.') || '(kok)'}: ${i.message}`,
    );
    throw new Error(
      'Ortam degiskenleri gecersiz:\n' +
        satirlar.join('\n') +
        '\n\nCozum: apps/api/.env.example dosyasini .env olarak kopyalayip doldur.',
    );
  }

  return parsed.data;
}
