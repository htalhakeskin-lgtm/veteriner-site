import {
  buildDayRange,
  computeAvailability,
  dateKey,
  overlaps,
  type AvailabilityInput,
  type StaffAvailabilityInput,
} from './availability.engine';

/** Yerel saat üretici — testlerde saat dilimi kaymasi olmasın diye. */
const at = (y: number, m: number, d: number, hh = 0, mm = 0) =>
  new Date(y, m - 1, d, hh, mm, 0, 0);

// 2026-10-05 Pazartesi, 2026-10-10 Cumartesi, 2026-10-11 Pazar
const MON = at(2026, 10, 5);
const TUE = at(2026, 10, 6);
const SUN = at(2026, 10, 11);

function staff(
  over: Partial<StaffAvailabilityInput> = {},
): StaffAvailabilityInput {
  return {
    id: 'stf-1',
    name: 'Dr. Ahmet',
    windows: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
    timeOff: [],
    busy: [],
    ...over,
  };
}

function input(over: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    days: [MON],
    durationMinutes: 30,
    stepMinutes: 30,
    leadTimeHours: 0,
    maxDailySlots: 0,
    blockedWeekdays: [0],
    holidays: new Set<string>(),
    // Çok geride bir "şimdi": lead time testleri dışında slotları elemesin.
    now: at(2026, 1, 1),
    staff: [staff()],
    ...over,
  };
}

describe('Müsaitlik motoru', () => {
  describe('temel slot üretimi', () => {
    it('çalışma penceresini adım adım böler', () => {
      const [day] = computeAvailability(input());
      expect(day.isOpen).toBe(true);
      expect(day.slots.map((s) => s.time)).toEqual([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      ]);
    });

    it('pencereye SIGMAYAN son slotu üretmez', () => {
      // 90 dk'lik hizmet, 09:00-12:00 penceresi: 10:30 başlarsa 12:00'de biter (olur),
      // 11:00 başlarsa 12:30'da biter (olmaz).
      const [day] = computeAvailability(input({ durationMinutes: 90 }));
      expect(day.slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('süre adımdan büyükse slotlar yine adım ızgarasında kalır', () => {
      const [day] = computeAvailability(
        input({ durationMinutes: 45, stepMinutes: 15 }),
      );
      expect(day.slots[0]!.time).toBe('09:00');
      expect(day.slots[1]!.time).toBe('09:15');
      // 11:15 + 45dk = 12:00 -> son geçerli slot
      expect(day.slots.at(-1)!.time).toBe('11:15');
    });
  });

  describe('kapalı günler', () => {
    it('haftalık kapalı günü işaretler', () => {
      const [day] = computeAvailability(input({ days: [SUN] }));
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('WEEKLY_CLOSED');
      expect(day.slots).toEqual([]);
    });

    it('resmi tatili işaretler', () => {
      const [day] = computeAvailability(
        input({ holidays: new Set(['2026-10-05']) }),
      );
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('HOLIDAY');
    });

    it('o gün çalışan hekim yoksa kapalı sayar', () => {
      // Hekim yalnızca Pazartesi çalışıyor, Salı sorgulanıyor.
      const [day] = computeAvailability(input({ days: [TUE] }));
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('NO_STAFF_SCHEDULED');
    });
  });

  describe('dolu saatler', () => {
    it('mevcut randevuyla çakışan slotu eler', () => {
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ busy: [{ start: at(2026, 10, 5, 10, 0), end: at(2026, 10, 5, 10, 30) }] }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).not.toContain('10:00');
      expect(day.slots.map((s) => s.time)).toContain('09:30');
    });

    it('uzun randevu ALTINDA kalan slotları da eler', () => {
      // 09:00-10:30 cerrahi: 09:00, 09:30 ve 10:00 kapanmalı.
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ busy: [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 10, 30) }] }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['10:30', '11:00', '11:30']);
    });

    it('BİTİŞİK randevu slotu engellemez', () => {
      // 09:00-09:30 dolu; 09:30 slotu serbest kalmalı (yarı açık aralık).
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ busy: [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 9, 30) }] }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).toContain('09:30');
      expect(day.slots.map((s) => s.time)).not.toContain('09:00');
    });

    it('izin aralığını eler', () => {
      const [day] = computeAvailability(
        input({
          staff: [
            staff({
              timeOff: [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 11, 0) }],
            }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['11:00', '11:30']);
    });
  });

  describe('hazırlık payı (lead time)', () => {
    it('çok yakın slotları eler', () => {
      const [day] = computeAvailability(
        input({
          now: at(2026, 10, 5, 8, 0), // sabah 08:00
          leadTimeHours: 2,           // en erken 10:00
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['10:00', '10:30', '11:00', '11:30']);
    });

    it('gün tamamen geçtiyse slot bırakmaz ama günü KAPALI saymaz', () => {
      const [day] = computeAvailability(input({ now: at(2026, 10, 5, 23, 0) }));
      // Klinik o gün çalışıyordu; sadece saat geçti.
      expect(day.isOpen).toBe(true);
      expect(day.slots).toEqual([]);
    });
  });

  describe('günlük randevu sınırı', () => {
    it('sınıra ulaşılınca günü kapatır', () => {
      const busy = [
        { start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 9, 30) },
        { start: at(2026, 10, 5, 10, 0), end: at(2026, 10, 5, 10, 30) },
      ];
      const [day] = computeAvailability(
        input({ maxDailySlots: 2, staff: [staff({ busy })] }),
      );
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('DAILY_LIMIT_REACHED');
    });

    it('BAŞKA günün randevuları sınıra sayılmaz', () => {
      const busy = [
        { start: at(2026, 10, 12, 9, 0), end: at(2026, 10, 12, 9, 30) },
        { start: at(2026, 10, 12, 10, 0), end: at(2026, 10, 12, 10, 30) },
      ];
      const [day] = computeAvailability(
        input({ maxDailySlots: 2, staff: [staff({ busy })] }),
      );
      expect(day.isOpen).toBe(true);
      expect(day.slots.length).toBeGreaterThan(0);
    });

    it('sıfır veya negatif sınır "sınırsız" demektir', () => {
      const [day] = computeAvailability(input({ maxDailySlots: 0 }));
      expect(day.isOpen).toBe(true);
    });
  });

  describe('birden fazla hekim', () => {
    const ikiHekim = [
      staff({ id: 'a', name: 'Dr. A' }),
      staff({ id: 'b', name: 'Dr. B' }),
    ];

    it('aynı saat için TEK seçenek gösterir', () => {
      const [day] = computeAvailability(input({ staff: ikiHekim }));
      const times = day.slots.map((s) => s.time);
      expect(new Set(times).size).toBe(times.length);
    });

    it('bir hekim doluysa diğerini önerir', () => {
      const [day] = computeAvailability(
        input({
          staff: [
            staff({
              id: 'a',
              name: 'Dr. A',
              busy: [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 9, 30) }],
            }),
            staff({ id: 'b', name: 'Dr. B' }),
          ],
        }),
      );
      const dokuz = day.slots.find((s) => s.time === '09:00');
      expect(dokuz).toBeDefined();
      expect(dokuz!.staffId).toBe('b');
    });

    it('iki hekim de doluysa slot kapanır', () => {
      const dolu = [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 9, 30) }];
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ id: 'a', name: 'Dr. A', busy: dolu }),
            staff({ id: 'b', name: 'Dr. B', busy: dolu }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).not.toContain('09:00');
    });

    it('farklı çalışma saatlerini birleştirir', () => {
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ id: 'a', name: 'Dr. A', windows: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }] }),
            staff({ id: 'b', name: 'Dr. B', windows: [{ dayOfWeek: 1, startTime: '14:00', endTime: '15:00' }] }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['09:00', '09:30', '14:00', '14:30']);
    });
  });

  describe('gün aralığı', () => {
    it('her gün için bir kayıt döndürür', () => {
      const days = buildDayRange(at(2026, 10, 5), at(2026, 10, 11));
      expect(days).toHaveLength(7);
      const sonuc = computeAvailability(input({ days }));
      expect(sonuc.map((d) => d.date)).toEqual([
        '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
        '2026-10-09', '2026-10-10', '2026-10-11',
      ]);
    });

    it('ay sınırını doğru geçer', () => {
      const days = buildDayRange(at(2026, 10, 30), at(2026, 11, 2));
      expect(days.map(dateKey)).toEqual([
        '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02',
      ]);
    });
  });

  describe('çakışma kuralı', () => {
    const a1 = at(2026, 10, 5, 9, 0);
    const a2 = at(2026, 10, 5, 10, 0);

    it('iç içe aralıklar çakışır', () => {
      expect(overlaps(a1, a2, at(2026, 10, 5, 9, 30), at(2026, 10, 5, 9, 45))).toBe(true);
    });

    it('bitişik aralıklar çakışmaz', () => {
      expect(overlaps(a1, a2, a2, at(2026, 10, 5, 11, 0))).toBe(false);
    });

    it('ayrık aralıklar çakışmaz', () => {
      expect(overlaps(a1, a2, at(2026, 10, 5, 14, 0), at(2026, 10, 5, 15, 0))).toBe(false);
    });
  });

  describe('dateKey', () => {
    it('UTC değil YEREL günü verir', () => {
      // Gece yarısına çok yakın bir an: toISOString() kullanılsaydı
      // saat dilimine göre bir önceki/sonraki güne kayardı.
      expect(dateKey(at(2026, 10, 5, 0, 30))).toBe('2026-10-05');
      expect(dateKey(at(2026, 10, 5, 23, 30))).toBe('2026-10-05');
    });
  });
});
