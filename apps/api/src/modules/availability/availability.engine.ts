/**
 * ═══════════════════════════════════════════════════════════════
 *  MÜSAİTLİK MOTORU — saf hesaplama
 * ═══════════════════════════════════════════════════════════════
 *
 * Bilerek veritabanından tamamen bağımsız: girdi olarak hazır veri alır,
 * çıktı olarak slot listesi döndürür. Sistemin en çok kural içeren ve en
 * çok hata yapmaya müsait parçası burası, bu yüzden veritabanı kurmadan
 * birim testiyle koşturulabilmeli.
 *
 * Çakışma kuralı her yerde YARI AÇIK aralık: [start, end)
 * Yani 09:00-09:30 ile 09:30-10:00 ÇAKIŞMAZ. Veritabanındaki
 * Appointment_no_overlap kısıtı da aynı aralığı kullanıyor; ikisi
 * farklı olsaydı motor "müsait" dediği bir slotu kaydetmeye çalışır
 * ve veritabanı reddederdi.
 */

export interface WorkWindow {
  /** 0 = Pazar ... 6 = Cumartesi (JavaScript getDay() ile aynı) */
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
  /** Haftalık çalışma pencereleri */
  windows: WorkWindow[];
  /** Izin / tatil aralıkları */
  timeOff: Interval[];
  /** Mevcut randevular (yalnızca slotu işgal eden durumlar) */
  busy: Interval[];
}

export interface AvailabilityInput {
  /** Kapsanacak günler (yerel gün başlangıçları) */
  days: Date[];
  /** Hizmetin süresi — slotun ne kadar yer kapladigini belirler */
  durationMinutes: number;
  /** Slot izgarasinin adımı (or. 30 dk) */
  stepMinutes: number;
  /** Bu kadar saatten yakın randevu alınamaz */
  leadTimeHours: number;
  /** Gün başına azami aktif randevu; 0 veya altıysa sınır yok */
  maxDailySlots: number;
  /** Kliniğin tamamen kapalı olduğu haftanin günleri */
  blockedWeekdays: number[];
  /** Resmi tatiller, "YYYY-MM-DD" */
  holidays: Set<string>;
  /** Hesaplama ani — testlerde sabitlenebilsin diye dışarıdan veriliyor */
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
//  Yardımcılar
// ─────────────────────────────────────────────

/** Yerel tarih anahtarı. toISOString() KULLANILMAZ: UTC'ye çevirip günü kaydırır. */
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

/** Yarı açık aralık çakışması: [aStart, aEnd) ile [bStart, bEnd) */
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

    // O gün çalışan hekim var mi?
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

    // Gün başına randevu sınırı: o güne ait mevcut randevular sayılır.
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

    // Slot başlangıcı -> o slotu verebilecek ILK hekim.
    // Map kullanılıyor çünkü aynı saatte birden fazla hekim müsait olabilir;
    // müşteriye tek bir seçenek gösterip arkada hekimi biz atıyoruz.
    const byTime = new Map<number, Slot>();

    for (const member of working) {
      for (const w of member.windows) {
        if (w.dayOfWeek !== day.getDay()) continue;

        const open = minutesOf(w.startTime);
        const close = minutesOf(w.endTime);

        for (let t = open; t + durationMinutes <= close; t += stepMinutes) {
          const start = atMinutes(day, t);
          const end = new Date(start.getTime() + durationMinutes * 60_000);

          // Çok yakın randevular alınamaz (hazırlık payı).
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

    // Gün açık ama hiç slot yoksa isOpen true kalır: klinik çalışıyor,
    // sadece doluyuz. "Kapalı" demek yanlış bilgi olurdu.
    return { date: key, isOpen: true, slots };
  });
}

/** from..to arasındaki yerel gün başlangıçlarını üretir (ikisi de dahil). */
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
