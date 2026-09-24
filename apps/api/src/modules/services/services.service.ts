import { Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Admin CRUD'unda yazılmasına izin verilen alanlar (bkz. staff.service.ts). */
const WRITABLE = [
  'slug', 'title', 'shortDesc', 'longDesc', 'icon', 'category',
  'price', 'durationMinutes', 'isFeatured', 'isActive', 'sortOrder',
] as const;

function pickWritable(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of WRITABLE) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { category?: string; featured?: boolean }) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(params.category ? { category: params.category } : {}),
        ...(params.featured !== undefined ? { isFeatured: params.featured } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isActive: true },
      include: {
        staff: {
          where: { isActive: true },
          select: { id: true, slug: true, fullName: true, title: true, photoUrl: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!service) throw new NotFoundException('Hizmet bulunamadı.');
    return service;
  }

  /** Admin: pasif olanlar dahil. */
  findAllAdmin() {
    return this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      include: { _count: { select: { appointments: true } } },
    });
  }

  create(data: Record<string, unknown>) {
    return this.prisma.service.create({
      data: pickWritable(data) as Prisma.ServiceCreateInput,
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.ensureExists(id);
    return this.prisma.service.update({
      where: { id },
      data: pickWritable(data) as Prisma.ServiceUpdateInput,
    });
  }

  /**
   * Silme yerine PASIFE alma.
   * Geçmiş randevular hizmete bağlı (onDelete: Restrict); gerçek silme
   * ya hata verir ya da randevu geçmişini uçururdu.
   */
  async deactivate(id: string) {
    await this.ensureExists(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorder(items: Array<{ id: string; sortOrder: number }>) {
    await this.prisma.$transaction(
      items.map((i) =>
        this.prisma.service.update({
          where: { id: i.id },
          data: { sortOrder: i.sortOrder },
        }),
      ),
    );
    return { updated: items.length };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.service.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Hizmet bulunamadı.');
  }
}
