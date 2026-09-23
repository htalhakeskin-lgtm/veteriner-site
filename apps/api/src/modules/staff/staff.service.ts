import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Admin CRUD'unda yazilmasina IZIN VERILEN alanlar.
 * Govde dogrudan Prisma'ya gecirilseydi id, userId veya iliski alanlari
 * da yazilabilirdi. Beyaz liste bunu bastan keser.
 */
const WRITABLE = [
  'slug', 'fullName', 'title', 'speciality', 'experienceYears',
  'bio', 'education', 'photoUrl', 'isActive', 'sortOrder',
] as const;

function pickWritable(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of WRITABLE) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
}

const PUBLIC_SELECT = {
  id: true, slug: true, fullName: true, title: true, speciality: true,
  experienceYears: true, bio: true, education: true, photoUrl: true, sortOrder: true,
} as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.staffMember.findMany({
      where: { isActive: true },
      select: {
        ...PUBLIC_SELECT,
        services: { select: { id: true, slug: true, title: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { fullName: 'asc' }],
    });
  }

  async findBySlug(slug: string) {
    const member = await this.prisma.staffMember.findFirst({
      where: { slug, isActive: true },
      select: {
        ...PUBLIC_SELECT,
        services: { select: { id: true, slug: true, title: true } },
        schedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    if (!member) throw new NotFoundException('Personel bulunamadi.');
    return member;
  }

  findAllAdmin() {
    return this.prisma.staffMember.findMany({
      orderBy: [{ sortOrder: 'asc' }, { fullName: 'asc' }],
      include: {
        services: { select: { id: true, slug: true, title: true } },
        schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        timeOff: { where: { endAt: { gte: new Date() } }, orderBy: { startAt: 'asc' } },
        _count: { select: { appointments: true } },
      },
    });
  }

  create(data: Record<string, unknown>) {
    const serviceIds = data.serviceIds as string[] | undefined;
    return this.prisma.staffMember.create({
      data: {
        ...pickWritable(data),
        ...(serviceIds?.length
          ? { services: { connect: serviceIds.map((id) => ({ id })) } }
          : {}),
      } as Prisma.StaffMemberCreateInput,
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.ensureExists(id);
    const serviceIds = data.serviceIds as string[] | undefined;
    return this.prisma.staffMember.update({
      where: { id },
      data: {
        ...pickWritable(data),
        // set: tam listeyle degistir; connect olsaydi eski baglar kalirdi.
        ...(serviceIds ? { services: { set: serviceIds.map((i) => ({ id: i })) } } : {}),
      } as Prisma.StaffMemberUpdateInput,
    });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    return this.prisma.staffMember.update({ where: { id }, data: { isActive: false } });
  }

  /** Haftalik takvimi tamamen degistirir. */
  async setSchedule(
    id: string,
    windows: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  ) {
    await this.ensureExists(id);

    for (const w of windows) {
      if (w.dayOfWeek < 0 || w.dayOfWeek > 6) {
        throw new BadRequestException('dayOfWeek 0-6 araliginda olmali.');
      }
      if (!/^\d{2}:\d{2}$/.test(w.startTime) || !/^\d{2}:\d{2}$/.test(w.endTime)) {
        throw new BadRequestException('Saatler "HH:mm" biciminde olmali.');
      }
      if (w.startTime >= w.endTime) {
        // Metin karsilastirmasi "HH:mm" biciminde dogru siralama verir.
        throw new BadRequestException(
          `Bitis saati baslangictan sonra olmali: ${w.startTime}-${w.endTime}`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.staffSchedule.deleteMany({ where: { staffId: id } }),
      this.prisma.staffSchedule.createMany({
        data: windows.map((w) => ({ ...w, staffId: id })),
      }),
    ]);

    return this.prisma.staffSchedule.findMany({
      where: { staffId: id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async addTimeOff(id: string, body: { startAt: string; endAt: string; reason?: string }) {
    await this.ensureExists(id);
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (!(endAt > startAt)) {
      throw new BadRequestException('Izin bitisi baslangictan sonra olmali.');
    }
    return this.prisma.staffTimeOff.create({
      data: { staffId: id, startAt, endAt, reason: body.reason ?? null },
    });
  }

  async removeTimeOff(timeOffId: string) {
    const found = await this.prisma.staffTimeOff.findUnique({ where: { id: timeOffId } });
    if (!found) throw new NotFoundException('Izin kaydi bulunamadi.');
    await this.prisma.staffTimeOff.delete({ where: { id: timeOffId } });
    return { deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.staffMember.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Personel bulunamadi.');
  }
}
