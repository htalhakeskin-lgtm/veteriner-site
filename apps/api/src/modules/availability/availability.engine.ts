/**
 * ═══════════════════════════════════════════════════════════════
 *  MUSAITLIK MOTORU — saf hesaplama
 * ═══════════════════════════════════════════════════════════════
 *
 * Bilerek veritabanindan tamamen bagimsiz: girdi olarak hazir veri alir,
 * cikti olarak slot listesi dondurur. Sistemin en cok kural iceren ve en
 * cok hata yapmaya musait parcasi burasi, bu yuzden veritabani kurmadan
 * birim testiyle kosturulabilmeli.
 *
 * Cakisma kurali her yerde YARI ACIK aralik: [start, end)
 * Yani 09:00-09:30 ile 09:30-10:00 CAKISMAZ. Veritabanindaki
 * Appointment_no_overlap kisiti da ayni araligi kullaniyor; ikisi
 * farkli olsaydi motor "musait" dedigi bir slotu kaydetmeye calisir
 * ve veritabani reddederdi.
 */

export interface WorkWindow {
  /** 0 = Pazar ... 6 = Cumartesi (JavaScript getDay() ile ayni) */
  dayOfWeek: number;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

export interface Interval {
  start: Date;
  end: Date;
}

export interface StaffAvailabilityInput {
  id: string;
  name: string;
  /** Haftalik calisma pencereleri */
  windows: WorkWindow[];
  /** Izin / tatil araliklari */
  timeOff: Interval[];
  /** Mevcut randevular (yalnizca slotu isgal eden durumlar) */
  busy: Interval[];
}

export interface AvailabilityInput {
  /** Kapsanacak gunler (yerel gun baslangiclari) */
  days: Date[];
  /** Hizmetin suresi — slotun ne kadar yer kapladigini belirler */
  durationMinutes: number;
  /** Slot izgarasinin adimi (or. 30 dk) */
  stepMinutes: number;
  /** Bu kadar saatten yakin randevu alinamaz */
  leadTimeHours: number;
  /** Gun basina azami aktif randevu; 0 veya altiysa sinir yok */
  maxDailySlots: number;
  /** Klinigin tamamen kapali oldugu haftanin gunleri */
  blockedWeekdays: number[];
  /** Resmi tatiller, "YYYY-MM-DD" */
  holidays: Set<string>;
  /** Hesaplama ani — testlerde sabitlenebilsin diye disaridan veriliyor */
  now: Date;
  staff: StaffAvailabilityInput[];
}

export type ClosedReason =
  | 'HOLIDAY'
  | 'WEEKLY_CLOSED'
  | 'NO_STAFF_SCHEDULED'
  | 'DAILY_LIMIT_REACHED';

export interface Slot {
  /** "HH:mm" */
  time: string;
  start: Date;
  end: Date;
  staffId: string;
  staffName: string;
}

export interface AvailabilityDay {
  /** "YYYY-MM-DD" */
  date: string;
  isOpen: boolean;
  reason?: ClosedReason;
  slots: Slot[];
}

// ─────────────────────────────────────────────
//  Yardimcilar
// ─────────────────────────────────────────────

/** Yerel tarih anahtari. toISOString() KULLANILMAZ: UTC'ye cevirip gunu kaydirir. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function atMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

/** Yari acik aralik cakismasi: [aStart, aEnd) ile [bStart, bEnd) */
export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ─────────────────────────────────────────────
//  Ana hesaplama
// ─────────────────────────────────────────────

export function computeAvailability(
  input: AvailabilityInput,
): AvailabilityDay[] {
  const {
    days,
    durationMinutes,
    stepMinutes,
    leadTimeHours,
    maxDailySlots,
    blockedWeekdays,
    holidays,
    now,
    staff,
  } = input;

  const earliest = new Date(now.getTime() + leadTimeHours * 3_600_000);
  const blocked = new Set(blockedWeekdays);

  return days.map((day): AvailabilityDay => {
    const key = dateKey(day);

    if (holidays.has(key)) {
      return { date: key, isOpen: false, reason: 'HOLIDAY', slots: [] };
    }
    if (blocked.has(day.getDay())) {
      return { date: key, isOpen: false, reason: 'WEEKLY_CLOSED', slots: [] };
    }

    // O gun calisan hekim var mi?
    const working = staff.filter((s) =>
      s.windows.some((w) => w.dayOfWeek === day.getDay()),
    );
    if (working.length === 0) {
      return {
        date: key,
        isOpen: false,
        reason: 'NO_STAFF_SCHEDULED',
        slots: [],
      };
    }

    // Gun basina randevu siniri: o gune ait mevcut randevular sayilir.
    if (maxDailySlots > 0) {
      const bookedToday = staff.reduce(
        (sum, s) =>
          sum + s.busy.filter((b) => dateKey(b.start) === key).length,
        0,
      );
      if (bookedToday >= maxDailySlots) {
        return {
          date: key,
          isOpen: false,
          reason: 'DAILY_LIMIT_REACHED',
          slots: [],
        };
      }
    }

    // Slot baslangici -> o slotu verebilecek ILK hekim.
    // Map kullaniliyor cunku ayni saatte birden fazla hekim musait olabilir;
    // musteriye tek bir secenek gosterip arkada hekimi biz atiyoruz.
    const byTime = new Map<number, Slot>();

    for (const member of working) {
      for (const w of member.windows) {
        if (w.dayOfWeek !== day.getDay()) continue;

        const open = minutesOf(w.startTime);
        const close = minutesOf(w.endTime);

        for (let t = open; t + durationMinutes <= close; t += stepMinutes) {
          const start = atMinutes(day, t);
          const end = new Date(start.getTime() + durationMinutes * 60_000);

          // Cok yakin randevular alinamaz (hazirlik payi).
          if (start < earliest) continue;

          const busy =
            member.timeOff.some((o) => overlaps(start, end, o.start, o.end)) ||
            member.busy.some((b) => overlaps(start, end, b.start, b.end));
          if (busy) continue;

          const stamp = start.getTime();
          if (!byTime.has(stamp)) {
            byTime.set(stamp, {
              time: hhmm(start),
              start,
              end,
              staffId: member.id,
              staffName: member.name,
            });
          }
        }
      }
    }

    const slots = [...byTime.values()].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    // Gun acik ama hic slot yoksa isOpen true kalir: klinik calisiyor,
    // sadece doluyuz. "Kapali" demek yanlis bilgi olurdu.
    return { date: key, isOpen: true, slots };
  });
}

/** from..to arasindaki yerel gun baslangiclarini uretir (ikisi de dahil). */
export function buildDayRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(to);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
