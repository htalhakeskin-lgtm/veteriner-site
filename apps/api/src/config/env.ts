import { z } from 'zod';

/**
 * Ortam değişkenleri uygulama AÇILIRKEN doğrulanır.
 *
 * Amaç: eksik veya hatalı bir değişken yüzünden sistemin saatler sonra,
 * rastgele bir istekte patlamasi yerine, daha başta anlaşılır bir hatayla
 * durması. Özellikle JWT sırları için kritik.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL zorunlu. .env.example dosyasını .env olarak kopyala.'),

  // Frontend'in adresi - CORS sadece buna izin verir
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  // JWT sırları. Varsayılan YOK ve en az 32 karakter: zayıf ya da
  // unutulmuş bir sır, tüm oturum güvenliğini sessizce çökertir.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET en az 32 karakter olmalı.'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET en az 32 karakter olmalı.'),

  /// "15m", "30s", "2h", "7d" biçiminde olmalı. Bicim burada doğrulanıyor,
  /// böylece imzalama anında yapılan tip dönüşümü gerçekten güvenli oluyor.
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_TTL "15m", "2h", "7d" biçiminde olmalı.')
    .default('15m'),
  /// Refresh token ömrü (gün). Cookie ve veritabanı kaydı bu süreyi kullanır.
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),

  /// Cookie'nın Secure bayrağı. HTTPS olmayan yerel geliştirmede false olmalı,
  /// aksi halde tarayıcı cookie'yi hiç saklamaz ve refresh sessizce çalışmaz.
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Demo modunda e-posta / SMS / WhatsApp GERÇEKTEN gönderilmez,
  // sadece Notification tablosuna yazılır. Klinik sunumlarında
  // yanlışlıkla mesaj gitmesini ve maliyet oluşmasını engeller.
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  /// Hız sınırı. Yalnızca e2e testlerinde kapatılır: testlerin çoğu
  /// arka arkaya giriş yapıyor ve limite takılırsa asıl ölçülmek istenen
  /// davranış yerine 429 ölçülür. Hız sınırının KENDISI ayrı bir testte,
  /// bu değer açıkken doğrulanır.
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
      'Ortam değişkenleri geçersiz:\n' +
        satirlar.join('\n') +
        '\n\nCozum: apps/api/.env.example dosyasını .env olarak kopyalayıp doldur.',
    );
  }

  return parsed.data;
}
