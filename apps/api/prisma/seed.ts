/**
 * Demo verisi yukleyici.
 *
 *   npm run db:seed    -> mevcut veriyi silip yeniden doldurur
 *   npm run db:reset   -> migration'lari sifirlayip seed calistirir
 *
 * Amac: klinige demo yapilirken sistem BOS gorunmesin. Admin paneli
 * dolu bir takvim, gercekci bir musteri listesi ve gecmis kayitlar gostersin.
 *
 * Veri deterministik uretilir (sabit tohumlu PRNG): her calistirmada ayni
 * sonuc cikar, boylece "gecen sefer baska turluydu" sorunu yasanmaz.
 */

import { hash } from '@node-rs/argon2';
import {
  AppointmentStatus,
  Gender,
  PostStatus,
  PrismaClient,
  Species,
  type Pet,
  type Prisma,
  type User,
} from '@prisma/client';

/** Programi ve verdigi hizmetleri birlikte tasiyan personel kaydi. */
type StaffWithRelations = Prisma.StaffMemberGetPayload<{
  include: { schedules: true; services: true };
}>;

import {
  BLOG_CATEGORIES,
  BLOG_POSTS,
  CAT_BREEDS,
  CAT_NAMES,
  CUSTOMER_NAMES,
  DOG_BREEDS,
  DOG_NAMES,
  MEDICAL_TEMPLATES,
  SERVICES,
  STAFF,
  TESTIMONIALS,
} from './seed-data';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
//  Yardimcilar
// ─────────────────────────────────────────────

/** Sabit tohumlu PRNG (mulberry32) — tekrarlanabilir demo verisi icin. */
function makeRandom(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = makeRandom(20260923);

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number): number =>
  Math.floor(rnd() * (max - min + 1)) + min;

/** Bugunun yerel gece yarisi — tum goreli tarihler buna gore uretilir. */
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function at(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h!, m!, 0, 0);
  return d;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
}

function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function phone(i: number): string {
  return `053${(i % 10)} ${String(100 + i).slice(0, 3)} ${String(10 + (i % 90))} ${String(10 + ((i * 7) % 90))}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function paragraphsToHtml(paras: readonly string[]): string {
  return paras.map((p) => `<p>${p}</p>`).join('\n');
}

// ─────────────────────────────────────────────
//  Varsayilan site ayarlari (config.js'in karsiligi)
// ─────────────────────────────────────────────

const SITE_SETTING: Prisma.SiteSettingCreateInput = {
  id: 'singleton',
  clinic: {
    name: 'Klinik Adi',
    slogan: 'Dostlariniz Icin En Iyi Bakim',
    description:
      'Modern veteriner hizmetleri ile evcil dostlariniza en iyi bakimi sunuyoruz.',
    foundedYear: 2010,
    totalPatients: 27000,
    experienceYears: 15,
    satisfactionRate: 4.9,
    logoUrl: null,
  },
  contact: {
    phone: '0262 000 00 00',
    phoneRaw: '+902620000000',
    whatsapp: '+905000000000',
    whatsappMessage: 'Merhaba, randevu almak istiyorum.',
    email: 'info@klinikadi.com',
    address: {
      full: 'Ornek Mah. Veteriner Cad. No:1 Merkez/Istanbul',
      district: 'Merkez',
      city: 'Istanbul',
      lat: 41.0082,
      lng: 28.9784,
    },
  },
  workingHours: {
    weekdays: { open: '09:00', close: '20:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: { open: null, close: null },
    emergency: true,
    emergencyPhone: '0532 000 00 00',
  },
  theme: { activePreset: 'adacayi', customColors: null, scrollSpeed: 4 },
  features: {
    showEmergencyBanner: true,
    showInstagramFeed: true,
    showBlogSection: true,
    showLiveStats: true,
    showTestimonials: true,
    enableOnlineBooking: true,
    enableRegistration: true,
  },
  appointmentRules: {
    slotDurationMinutes: 30,
    leadTimeHours: 2,
    daysInAdvance: 30,
    cancelBeforeHours: 24,
    autoConfirm: false,
    maxDailySlots: 20,
    blockedWeekdays: [0], // Pazar kapali
  },
  seo: {
    metaTitle: 'Klinik Adi Veteriner Klinigi',
    metaDescription:
      'Modern veteriner hizmetleri, online randevu ve 7/24 acil mudahale.',
    ogImageUrl: null,
    googleMapsEmbedUrl: null,
  },
  socialLinks: {
    instagram: 'https://instagram.com/klinikadi',
    facebook: null,
    twitter: null,
    youtube: null,
  },
  googlePlaceId: null,
};

// ─────────────────────────────────────────────
//  Ana akis
// ─────────────────────────────────────────────

async function clearAll(): Promise<void> {
  // FK sirasina dikkat: bagimli tablolar once.
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.staffSchedule.deleteMany(),
    prisma.staffTimeOff.deleteMany(),
    prisma.clinicHoliday.deleteMany(),
    prisma.pet.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.blogCategory.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.staffMember.deleteMany(),
    prisma.service.deleteMany(),
    prisma.user.deleteMany(),
    prisma.siteSetting.deleteMany(),
  ]);
}

async function main(): Promise<void> {
  const t0 = Date.now();
  console.log('Demo verisi yukleniyor...\n');

  await clearAll();

  // ── Site ayarlari ──
  await prisma.siteSetting.create({ data: SITE_SETTING });

  // ── Hizmetler ──
  const services = await Promise.all(
    SERVICES.map((s, i) =>
      prisma.service.create({
        data: {
          slug: s.slug,
          title: s.title,
          shortDesc: s.shortDesc,
          longDesc: s.longDesc,
          icon: s.icon,
          category: s.category,
          durationMinutes: s.durationMinutes,
          isFeatured: s.isFeatured,
          price: s.price,
          sortOrder: i,
        },
      }),
    ),
  );
  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));
  console.log(`  hizmet            : ${services.length}`);

  // ── Sifreler ──
  // argon2id: plan geregi bcrypt degil. Seed'de 4 hash uretiliyor,
  // hepsi ayni parametrelerle.
  const argonOpts = { algorithm: 2 as const }; // 2 = argon2id
  const adminPass = await hash('admin123', argonOpts);
  const customerPass = await hash('123456', argonOpts);

  // ── Personel + kullanici hesaplari ──
  const staffMembers: StaffWithRelations[] = [];
  for (let i = 0; i < STAFF.length; i++) {
    const s = STAFF[i]!;
    // Bas hekim ayni zamanda admin; digerleri STAFF rolunde.
    const isAdmin = i === 0;
    const user = await prisma.user.create({
      data: {
        email: isAdmin ? 'admin@demo.com' : `${s.slug}@demo.com`,
        passwordHash: adminPass,
        fullName: s.fullName,
        phone: phone(900 + i),
        role: isAdmin ? 'ADMIN' : 'STAFF',
      },
    });

    const linkedServices =
      s.serviceSlugs === null
        ? services
        : s.serviceSlugs.map((slug) => serviceBySlug.get(slug)!);

    const staff = await prisma.staffMember.create({
      data: {
        userId: user.id,
        slug: s.slug,
        fullName: s.fullName,
        title: s.title,
        speciality: s.speciality,
        experienceYears: s.experienceYears,
        education: s.education,
        bio: s.bio,
        sortOrder: i,
        services: { connect: linkedServices.map((sv) => ({ id: sv.id })) },
        schedules: { create: s.schedule.map((sc) => ({ ...sc })) },
      },
      include: { schedules: true, services: true },
    });
    staffMembers.push(staff);
  }
  console.log(`  personel          : ${staffMembers.length}`);

  // ── Musteriler + hayvanlar ──
  const customers: User[] = [];
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const name = CUSTOMER_NAMES[i]!;
    // Ilk musteri sabit demo hesabi
    const email = i === 0 ? 'musteri@demo.com' : `${slugify(name)}@ornek.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: customerPass,
        fullName: name,
        phone: phone(i),
        role: 'CUSTOMER',
        createdAt: addDays(today(), -int(30, 900)),
      },
    });
    customers.push(user);
  }
  console.log(`  musteri           : ${customers.length}`);

  const pets: Pet[] = [];
  for (const owner of customers) {
    const petCount = int(1, 3);
    for (let p = 0; p < petCount; p++) {
      const isCat = rnd() < 0.55;
      const pet = await prisma.pet.create({
        data: {
          ownerId: owner.id,
          name: isCat ? pick(CAT_NAMES) : pick(DOG_NAMES),
          species: isCat ? Species.CAT : Species.DOG,
          breed: isCat ? pick(CAT_BREEDS) : pick(DOG_BREEDS),
          birthDate: addDays(today(), -int(200, 4000)),
          gender: rnd() < 0.5 ? Gender.MALE : Gender.FEMALE,
          weightKg: isCat
            ? Number((3 + rnd() * 4).toFixed(1))
            : Number((8 + rnd() * 30).toFixed(1)),
          isNeutered: rnd() < 0.65,
          microchipNo:
            rnd() < 0.6
              ? `TR-9820${String(int(10000000, 99999999))}`
              : null,
        },
      });
      pets.push(pet);
    }
  }
  console.log(`  hasta (hayvan)    : ${pets.length}`);

  // ── Saglik kayitlari ──
  let recordCount = 0;
  for (const pet of pets) {
    const n = int(2, 5);
    const used = new Set<string>();
    for (let r = 0; r < n; r++) {
      const tpl = pick(MEDICAL_TEMPLATES);
      if (used.has(tpl.title)) continue;
      used.add(tpl.title);

      const performedAt = addDays(today(), -int(20, 700));
      await prisma.medicalRecord.create({
        data: {
          petId: pet.id,
          staffId: pick(staffMembers).id,
          type: tpl.type,
          title: tpl.title,
          description: tpl.description,
          performedAt,
          nextDueAt: tpl.repeatMonths
            ? addMonths(performedAt, tpl.repeatMonths)
            : null,
        },
      });
      recordCount++;
    }
  }
  console.log(`  saglik kaydi      : ${recordCount}`);

  // ── Randevular ──
  // Cifte rezervasyon kisitini seed'in kendisi de ihlal edemez:
  // dolu slotlari takip edip atliyoruz.
  // Hekim basina dolu zaman araliklari. Tek bir "slot anahtari" yetmez:
  // 90 dakikalik bir cerrahi ardindan gelen 09:30 muayenesini de engellemeli.
  const busy = new Map<string, Array<[number, number]>>();

  function isBusy(staffId: string, start: number, end: number): boolean {
    const list = busy.get(staffId);
    if (!list) return false;
    // Yari acik aralik: 09:00-09:30 ile 09:30-10:00 cakismaz.
    return list.some(([bs, be]) => start < be && bs < end);
  }
  const appointments: Prisma.AppointmentCreateManyInput[] = [];
  let seq = 0;

  function tryBook(
    day: Date,
    staff: StaffWithRelations,
    status: AppointmentStatus,
  ): boolean {
    const schedule = staff.schedules.find((s) => s.dayOfWeek === day.getDay());
    if (!schedule) return false;

    const service = pick(services);
    // Hekim bu hizmeti veriyor mu?
    if (!staff.services.some((sv) => sv.id === service.id)) return false;

    const open = toMinutes(schedule.startTime);
    const close = toMinutes(schedule.endTime);
    const slots = Math.floor((close - open) / 30);
    if (slots <= 0) return false;

    const startMin = open + int(0, slots - 1) * 30;
    if (startMin + service.durationMinutes > close) return false;

    const startAt = at(day, fromMinutes(startMin));
    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

    // Slotu isgal eden durumlar. COMPLETED de sayilir: gecmiste de olsa
    // hekim o saatte doluydu — aksi halde seed "ayni anda iki yerde olan
    // hekim" uretir ve takvim demoda ilk bakista sahte gorunur.
    // CANCELLED ve NO_SHOW slotu serbest birakir.
    const blocking =
      status === AppointmentStatus.PENDING ||
      status === AppointmentStatus.CONFIRMED ||
      status === AppointmentStatus.COMPLETED;

    if (blocking) {
      if (isBusy(staff.id, startAt.getTime(), endAt.getTime())) return false;
      const list = busy.get(staff.id) ?? [];
      list.push([startAt.getTime(), endAt.getTime()]);
      busy.set(staff.id, list);
    }

    const owner = pick(customers);
    const ownerPets = pets.filter((p) => p.ownerId === owner.id);
    if (ownerPets.length === 0) return false;
    const pet = pick(ownerPets);

    seq++;
    appointments.push({
      code: `RND-${startAt.getFullYear()}-${String(seq).padStart(4, '0')}`,
      userId: owner.id,
      petId: pet.id,
      serviceId: service.id,
      staffId: staff.id,
      startAt,
      endAt,
      status,
      notes: rnd() < 0.3 ? 'Yillik rutin kontrol' : null,
      cancelledAt:
        status === AppointmentStatus.CANCELLED
          ? addDays(startAt, -2)
          : null,
      cancelReason:
        status === AppointmentStatus.CANCELLED ? 'Musteri iptal etti' : null,
      createdAt: addDays(startAt, -int(1, 20)),
    });
    return true;
  }

  /**
   * tryBook cogu zaman bosa doner: secilen hekim o hizmeti vermiyor olabilir,
   * o gun calismiyor olabilir veya slot dolu olabilir. Tek denemede biraksaydik
   * takvim seyrek kalir, demo sirasinda klinik "bos" gorunurdu.
   * Bu yuzden her randevu icin farkli hekim/slot ile birkac kez deniyoruz.
   */
  function book(day: Date, status: AppointmentStatus, tries = 14): boolean {
    for (let t = 0; t < tries; t++) {
      if (tryBook(day, pick(staffMembers), status)) return true;
    }
    return false;
  }

  const base = today();

  // Gecmis 90 gun: cogu tamamlanmis, bir kismi iptal/gelmedi
  for (let d = 90; d >= 1; d--) {
    const day = addDays(base, -d);
    if (day.getDay() === 0) continue; // Pazar kapali
    for (let k = 0, n = int(1, 4); k < n; k++) {
      const roll = rnd();
      const status =
        roll < 0.82
          ? AppointmentStatus.COMPLETED
          : roll < 0.93
            ? AppointmentStatus.CANCELLED
            : AppointmentStatus.NO_SHOW;
      book(day, status);
    }
  }

  // Bugun: karisik durum — dashboard canli gorunsun
  if (base.getDay() !== 0) {
    for (let k = 0; k < 9; k++) {
      const roll = rnd();
      const status =
        roll < 0.4
          ? AppointmentStatus.COMPLETED
          : roll < 0.8
            ? AppointmentStatus.CONFIRMED
            : AppointmentStatus.PENDING;
      book(base, status);
    }
  }

  // Gelecek 30 gun: onayli + onay bekleyen.
  // Yakin gunler daha dolu, uzak gunler daha seyrek — gercek bir klinik boyle gorunur.
  for (let d = 1; d <= 30; d++) {
    const day = addDays(base, d);
    if (day.getDay() === 0) continue;
    const n = d <= 10 ? int(2, 4) : d <= 20 ? int(1, 3) : int(0, 2);
    for (let k = 0; k < n; k++) {
      const status =
        rnd() < 0.65
          ? AppointmentStatus.CONFIRMED
          : AppointmentStatus.PENDING;
      book(day, status);
    }
  }

  await prisma.appointment.createMany({ data: appointments });
  console.log(`  randevu           : ${appointments.length}`);

  // ── Blog ──
  const categories = await Promise.all(
    BLOG_CATEGORIES.map((c) => prisma.blogCategory.create({ data: { ...c } })),
  );
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  });

  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const p = BLOG_POSTS[i]!;
    await prisma.blogPost.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        contentHtml: paragraphsToHtml(p.body),
        categoryId: catBySlug.get(p.categorySlug)!.id,
        authorId: adminUser?.id ?? null,
        status: PostStatus.PUBLISHED,
        publishedAt: addDays(base, -(i * 9 + 3)),
        readMinutes: p.readMinutes,
        viewCount: int(40, 900),
        metaTitle: p.title,
        metaDescription: p.excerpt,
      },
    });
  }
  console.log(`  blog yazisi       : ${BLOG_POSTS.length}`);

  // ── Yorumlar ──
  for (let i = 0; i < TESTIMONIALS.length; i++) {
    const t = TESTIMONIALS[i]!;
    await prisma.testimonial.create({
      data: {
        authorName: t.authorName,
        petName: t.petName,
        petSpecies: t.petSpecies,
        rating: t.rating,
        text: t.text,
        isApproved: true,
        displayDate: addDays(base, -(i * 21 + 10)),
        sortOrder: i,
      },
    });
  }
  console.log(`  musteri yorumu    : ${TESTIMONIALS.length}`);

  // ── E-bulten ──
  await prisma.newsletterSubscriber.createMany({
    data: customers.slice(0, 12).map((c) => ({ email: c.email })),
  });

  // ── Bildirimler (demo hesabi icin) ──
  const demoUser = customers[0]!;
  const upcoming = await prisma.appointment.findFirst({
    where: { userId: demoUser.id, startAt: { gt: new Date() } },
    orderBy: { startAt: 'asc' },
    include: { pet: true },
  });
  if (upcoming) {
    await prisma.notification.create({
      data: {
        userId: demoUser.id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Randevu hatirlatmasi',
        message: `${upcoming.pet?.name ?? 'Dostunuz'} icin randevunuz yaklasiyor.`,
        channel: 'DATABASE',
      },
    });
  }

  // ── Resmi tatiller ──
  const year = base.getFullYear();
  await prisma.clinicHoliday.createMany({
    data: [
      { date: new Date(`${year}-01-01`), label: 'Yilbasi' },
      { date: new Date(`${year}-04-23`), label: 'Ulusal Egemenlik Bayrami' },
      { date: new Date(`${year}-05-19`), label: 'Genclik ve Spor Bayrami' },
      { date: new Date(`${year}-08-30`), label: 'Zafer Bayrami' },
      { date: new Date(`${year}-10-29`), label: 'Cumhuriyet Bayrami' },
    ],
    skipDuplicates: true,
  });

  console.log(`\nTamamlandi (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);
  console.log('\nDemo girisleri:');
  console.log('  admin    : admin@demo.com    / admin123');
  console.log('  musteri  : musteri@demo.com  / 123456');
}

main()
  .catch((e) => {
    console.error('\nSeed basarisiz:', e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
