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

  // JWT sirlari. Varsayilan YOK ve en az 32 karakter: zayif ya da
  // unutulmus bir sir, tum oturum guvenligini sessizce cokertir.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET en az 32 karakter olmali.'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET en az 32 karakter olmali.'),

  /// "15m", "30s", "2h", "7d" biciminde olmali. Bicim burada dogrulaniyor,
  /// boylece imzalama aninda yapilan tip donusumu gercekten guvenli oluyor.
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_TTL "15m", "2h", "7d" biciminde olmali.')
    .default('15m'),
  /// Refresh token omru (gun). Cookie ve veritabani kaydi bu sureyi kullanir.
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),

  /// Cookie'nin Secure bayragi. HTTPS olmayan yerel gelistirmede false olmali,
  /// aksi halde tarayici cookie'yi hic saklamaz ve refresh sessizce calismaz.
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Demo modunda e-posta / SMS / WhatsApp GERCEKTEN gonderilmez,
  // sadece Notification tablosuna yazilir. Klinik sunumlarinda
  // yanlislikla mesaj gitmesini ve maliyet olusmasini engeller.
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  /// Hiz siniri. Yalnizca e2e testlerinde kapatilir: testlerin cogu
  /// arka arkaya giris yapiyor ve limite takilirsa asil olculmek istenen
  /// davranis yerine 429 olculur. Hiz sinirinin KENDISI ayri bir testte,
  /// bu deger acikken dogrulanir.
  THROTTLE_ENABLED: z
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
