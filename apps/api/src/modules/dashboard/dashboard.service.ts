import { Injectable } from '@nestjs/common';
import { AppointmentStatus, PostStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const weekStart = startOfDay(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Pazartesi
    const weekEnd = endOfDay(new Date(weekStart));
    weekEnd.setDate(weekEnd.getDate() + 6);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayAppointments,
      weekAppointments,
      pendingCount,
      totalCustomers,
      totalPets,
      newCustomersThisMonth,
      unreadMessages,
      publishedPosts,
      pendingTestimonials,
    ] = await this.prisma.$transaction([
      this.prisma.appointment.count({
        where: {
          startAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          startAt: { gte: weekStart, lte: weekEnd },
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      this.prisma.pet.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: monthStart } },
      }),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.blogPost.count({ where: { status: PostStatus.PUBLISHED } }),
      this.prisma.testimonial.count({ where: { isApproved: false } }),
    ]);

    return {
      appointments: {
        today: todayAppointments,
        thisWeek: weekAppointments,
        pendingApproval: pendingCount,
      },
      customers: { total: totalCustomers, newThisMonth: newCustomersThisMonth },
      pets: { total: totalPets },
      inbox: { unreadMessages, pendingTestimonials },
      content: { publishedPosts },
    };
  }

  /** Bugunun randevu listesi — dashboard'un ana tablosu. */
  todaySchedule() {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: { startAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      include: {
        service: { select: { title: true, durationMinutes: true } },
        staff: { select: { fullName: true } },
        pet: { select: { name: true, species: true } },
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  /**
   * Son 30 gunun gunluk randevu sayisi — grafik icin.
   * Gruplama SQL tarafinda yapiliyor; 30 gunluk satirlari uygulamaya
   * cekip saymak gereksiz veri transferi olurdu.
   */
  async appointmentTrend(days = 30) {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - days + 1);
    // Ust sinir sart: olmadan gelecekteki randevular da sayilir ve
    // "gecmis egilim" grafigi bugunden sonrasini gosterir.
    const until = endOfDay(new Date());

    const rows = await this.prisma.$queryRaw<
      Array<{ gun: Date; toplam: bigint; iptal: bigint }>
    >`
      SELECT date_trunc('day', "startAt") AS gun,
             count(*) AS toplam,
             count(*) FILTER (WHERE status = 'CANCELLED') AS iptal
      FROM "Appointment"
      WHERE "startAt" >= ${since} AND "startAt" <= ${until}
      GROUP BY 1
      ORDER BY 1
    `;

    // BigInt JSON'a serilestirilmiyor; Number'a ceviriyoruz.
    return rows.map((r) => ({
      date: r.gun.toISOString().slice(0, 10),
      total: Number(r.toplam),
      cancelled: Number(r.iptal),
    }));
  }

  /** En cok tercih edilen hizmetler. */
  async topServices(limit = 5) {
    const rows = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: limit,
    });

    const services = await this.prisma.service.findMany({
      where: { id: { in: rows.map((r) => r.serviceId) } },
      select: { id: true, title: true },
    });
    const byId = new Map(services.map((s) => [s.id, s.title]));

    return rows.map((r) => ({
      serviceId: r.serviceId,
      title: byId.get(r.serviceId) ?? 'Bilinmeyen',
      count: r._count.serviceId,
    }));
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
