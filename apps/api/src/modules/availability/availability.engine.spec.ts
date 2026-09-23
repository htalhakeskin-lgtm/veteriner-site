import {
  buildDayRange,
  computeAvailability,
  dateKey,
  overlaps,
  type AvailabilityInput,
  type StaffAvailabilityInput,
} from './availability.engine';

/** Yerel saat uretici — testlerde saat dilimi kaymasi olmasin diye. */
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
    // Cok geride bir "simdi": lead time testleri disinda slotlari elemesin.
    now: at(2026, 1, 1),
    staff: [staff()],
    ...over,
  };
}

describe('Musaitlik motoru', () => {
  describe('temel slot uretimi', () => {
    it('calisma penceresini adim adim boler', () => {
      const [day] = computeAvailability(input());
      expect(day.isOpen).toBe(true);
      expect(day.slots.map((s) => s.time)).toEqual([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      ]);
    });

    it('pencereye SIGMAYAN son slotu uretmez', () => {
      // 90 dk'lik hizmet, 09:00-12:00 penceresi: 10:30 baslarsa 12:00'de biter (olur),
      // 11:00 baslarsa 12:30'da biter (olmaz).
      const [day] = computeAvailability(input({ durationMinutes: 90 }));
      expect(day.slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('sure adimdan buyukse slotlar yine adim izgarasinda kalir', () => {
      const [day] = computeAvailability(
        input({ durationMinutes: 45, stepMinutes: 15 }),
      );
      expect(day.slots[0]!.time).toBe('09:00');
      expect(day.slots[1]!.time).toBe('09:15');
      // 11:15 + 45dk = 12:00 -> son gecerli slot
      expect(day.slots.at(-1)!.time).toBe('11:15');
    });
  });

  describe('kapali gunler', () => {
    it('haftalik kapali gunu isaretler', () => {
      const [day] = computeAvailability(input({ days: [SUN] }));
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('WEEKLY_CLOSED');
      expect(day.slots).toEqual([]);
    });

    it('resmi tatili isaretler', () => {
      const [day] = computeAvailability(
        input({ holidays: new Set(['2026-10-05']) }),
      );
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('HOLIDAY');
    });

    it('o gun calisan hekim yoksa kapali sayar', () => {
      // Hekim yalnizca Pazartesi calisiyor, Sali sorgulaniyor.
      const [day] = computeAvailability(input({ days: [TUE] }));
      expect(day.isOpen).toBe(false);
      expect(day.reason).toBe('NO_STAFF_SCHEDULED');
    });
  });

  describe('dolu saatler', () => {
    it('mevcut randevuyla cakisan slotu eler', () => {
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

    it('uzun randevu ALTINDA kalan slotlari da eler', () => {
      // 09:00-10:30 cerrahi: 09:00, 09:30 ve 10:00 kapanmali.
      const [day] = computeAvailability(
        input({
          staff: [
            staff({ busy: [{ start: at(2026, 10, 5, 9, 0), end: at(2026, 10, 5, 10, 30) }] }),
          ],
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['10:30', '11:00', '11:30']);
    });

    it('BITISIK randevu slotu engellemez', () => {
      // 09:00-09:30 dolu; 09:30 slotu serbest kalmali (yari acik aralik).
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

    it('izin araligini eler', () => {
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

  describe('hazirlik payi (lead time)', () => {
    it('cok yakin slotlari eler', () => {
      const [day] = computeAvailability(
        input({
          now: at(2026, 10, 5, 8, 0), // sabah 08:00
          leadTimeHours: 2,           // en erken 10:00
        }),
      );
      expect(day.slots.map((s) => s.time)).toEqual(['10:00', '10:30', '11:00', '11:30']);
    });

    it('gun tamamen gectiyse slot birakmaz ama gunu KAPALI saymaz', () => {
      const [day] = computeAvailability(input({ now: at(2026, 10, 5, 23, 0) }));
      // Klinik o gun calisiyordu; sadece saat gecti.
      expect(day.isOpen).toBe(true);
      expect(day.slots).toEqual([]);
    });
  });

  describe('gunluk randevu siniri', () => {
    it('sinira ulasilinca gunu kapatir', () => {
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

    it('BASKA gunun randevulari sinira sayilmaz', () => {
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

    it('sifir veya negatif sinir "sinirsiz" demektir', () => {
      const [day] = computeAvailability(input({ maxDailySlots: 0 }));
      expect(day.isOpen).toBe(true);
    });
  });

  describe('birden fazla hekim', () => {
    const ikiHekim = [
      staff({ id: 'a', name: 'Dr. A' }),
      staff({ id: 'b', name: 'Dr. B' }),
    ];

    it('ayni saat icin TEK secenek gosterir', () => {
      const [day] = computeAvailability(input({ staff: ikiHekim }));
      const times = day.slots.map((s) => s.time);
      expect(new Set(times).size).toBe(times.length);
    });

    it('bir hekim doluysa digerini onerir', () => {
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

    it('iki hekim de doluysa slot kapanir', () => {
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

    it('farkli calisma saatlerini birlestirir', () => {
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

  describe('gun araligi', () => {
    it('her gun icin bir kayit dondurur', () => {
      const days = buildDayRange(at(2026, 10, 5), at(2026, 10, 11));
      expect(days).toHaveLength(7);
      const sonuc = computeAvailability(input({ days }));
      expect(sonuc.map((d) => d.date)).toEqual([
        '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
        '2026-10-09', '2026-10-10', '2026-10-11',
      ]);
    });

    it('ay sinirini dogru gecer', () => {
      const days = buildDayRange(at(2026, 10, 30), at(2026, 11, 2));
      expect(days.map(dateKey)).toEqual([
        '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02',
      ]);
    });
  });

  describe('cakisma kurali', () => {
    const a1 = at(2026, 10, 5, 9, 0);
    const a2 = at(2026, 10, 5, 10, 0);

    it('ic ice araliklar cakisir', () => {
      expect(overlaps(a1, a2, at(2026, 10, 5, 9, 30), at(2026, 10, 5, 9, 45))).toBe(true);
    });

    it('bitisik araliklar cakismaz', () => {
      expect(overlaps(a1, a2, a2, at(2026, 10, 5, 11, 0))).toBe(false);
    });

    it('ayrik araliklar cakismaz', () => {
      expect(overlaps(a1, a2, at(2026, 10, 5, 14, 0), at(2026, 10, 5, 15, 0))).toBe(false);
    });
  });

  describe('dateKey', () => {
    it('UTC degil YEREL gunu verir', () => {
      // Gece yarisina cok yakin bir an: toISOString() kullanilsaydi
      // saat dilimine gore bir onceki/sonraki gune kayardi.
      expect(dateKey(at(2026, 10, 5, 0, 30))).toBe('2026-10-05');
      expect(dateKey(at(2026, 10, 5, 23, 30))).toBe('2026-10-05');
    });
  });
});
