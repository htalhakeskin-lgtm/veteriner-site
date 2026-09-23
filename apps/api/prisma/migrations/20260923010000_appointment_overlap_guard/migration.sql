-- ═══════════════════════════════════════════════════════════════
--  Randevu cakisma korumasi — exclusion constraint
-- ═══════════════════════════════════════════════════════════════
--
-- SORUN: Onceki partial unique index yalnizca AYNI "startAt" degerini
-- yakaliyordu. Ornek: Dr. Ahmet icin 09:00-10:30 cerrahi ve 09:30-10:00
-- muayene farkli startAt tasidigi icin index'ten geciyordu — ama bir
-- hekim ayni anda iki yerde olamaz.
--
-- COZUM: PostgreSQL exclusion constraint. "Ayni hekim VE cakisan zaman
-- araligi" kombinasyonunu tamamen yasaklar; unique index'in yaptigi isi
-- de kapsar, o yuzden eskisi kaldiriliyor.
--
-- Aralik '[)' (yari acik): 09:00-09:30 ile 09:30-10:00 CAKISMAZ.
-- Kapali aralik kullanilsaydi ardisik randevular birbirini bloke ederdi.
--
-- Kapsanan durumlar: PENDING, CONFIRMED, COMPLETED (hekim o saatte dolu).
-- CANCELLED ve NO_SHOW slotu serbest birakir, yeniden satilabilir.

-- GiST index'inin "staffId" gibi skaler kolonlarla = operatoru
-- kullanabilmesi icin gerekli.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP INDEX IF EXISTS "Appointment_staff_slot_unique";

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE (
    "status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')
    AND "staffId" IS NOT NULL
  );
