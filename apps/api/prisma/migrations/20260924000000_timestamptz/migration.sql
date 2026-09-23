-- ═══════════════════════════════════════════════════════════════
--  Zaman kolonlari timestamp -> timestamptz
-- ═══════════════════════════════════════════════════════════════
--
-- SORUN: "timestamp without time zone" kullanilirken Prisma, yerel bir
-- Date'i UTC'ye cevirip saat dilimi bilgisini atiyordu. Seed yerel 09:00
-- yazdiginda veritabaninda 06:00 goruluyordu. Uygulama icinden okurken
-- tutarli gorunuyordu (ayni donusum tersine calisiyor) ama SQL tarafinda
-- degil: raporlar ve "startAt"::date = CURRENT_DATE gibi filtreler
-- 3 saat kayik calisiyordu.
--
-- USING ... AT TIME ZONE 'UTC' SART: USING olmadan Postgres mevcut naive
-- degeri OTURUM saat diliminde (Europe/Istanbul) yorumlar ve her kaydi
-- 3 saat geri kaydirirdi. Degerler UTC ani olarak yazildigi icin dogru
-- yorum 'UTC'dir.

-- Exclusion constraint tsrange kullaniyor; tsrange timestamp ister.
-- Kolon tipi degismeden once kaldirilip sonra tstzrange ile kurulmali.
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_no_overlap";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "startAt" SET DATA TYPE TIMESTAMPTZ(3) USING "startAt" AT TIME ZONE 'UTC',
ALTER COLUMN "endAt" SET DATA TYPE TIMESTAMPTZ(3) USING "endAt" AT TIME ZONE 'UTC',
ALTER COLUMN "cancelledAt" SET DATA TYPE TIMESTAMPTZ(3) USING "cancelledAt" AT TIME ZONE 'UTC',
ALTER COLUMN "reminderSentAt" SET DATA TYPE TIMESTAMPTZ(3) USING "reminderSentAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "BlogPost" ALTER COLUMN "publishedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "publishedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "ContactMessage" ALTER COLUMN "repliedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "repliedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "MedicalRecord" ALTER COLUMN "performedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "performedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "nextDueAt" SET DATA TYPE TIMESTAMPTZ(3) USING "nextDueAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "subscribedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "subscribedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "unsubscribedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "unsubscribedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMPTZ(3) USING "readAt" AT TIME ZONE 'UTC',
ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMPTZ(3) USING "sentAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "PasswordResetToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "usedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Pet" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "deletedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "revokedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "StaffMember" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "StaffTimeOff" ALTER COLUMN "startAt" SET DATA TYPE TIMESTAMPTZ(3) USING "startAt" AT TIME ZONE 'UTC',
ALTER COLUMN "endAt" SET DATA TYPE TIMESTAMPTZ(3) USING "endAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Testimonial" ALTER COLUMN "displayDate" SET DATA TYPE TIMESTAMPTZ(3) USING "displayDate" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastLoginAt" SET DATA TYPE TIMESTAMPTZ(3) USING "lastLoginAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "deletedAt" AT TIME ZONE 'UTC';

-- Cakisma korumasi geri kuruluyor, bu kez tstzrange ile.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE (
    "status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')
    AND "staffId" IS NOT NULL
  );
