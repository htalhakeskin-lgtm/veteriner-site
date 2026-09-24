import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateMedicalRecordDto,
  CreatePetDto,
  UpdatePetDto,
} from './dto/pets.dto';

type Requester = { id: string; role: Role };

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(ownerId: string) {
    return this.prisma.pet.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { appointments: true, medicalRecords: true } },
      },
    });
  }

  async findOne(id: string, requester: Requester) {
    const pet = await this.prisma.pet.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });
    if (!pet) throw new NotFoundException('Hayvan bulunamadı.');
    this.assertOwnership(pet.ownerId, requester);
    return pet;
  }

  create(ownerId: string, dto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ownerId,
        name: dto.name,
        species: dto.species,
        breed: dto.breed ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        gender: dto.gender ?? 'UNKNOWN',
        weightKg: dto.weightKg ?? null,
        color: dto.color ?? null,
        isNeutered: dto.isNeutered ?? false,
        microchipNo: dto.microchipNo ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async update(id: string, requester: Requester, dto: UpdatePetDto) {
    await this.findOne(id, requester); // sahiplik kontrolü
    return this.prisma.pet.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.species !== undefined ? { species: dto.species } : {}),
        ...(dto.breed !== undefined ? { breed: dto.breed } : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: new Date(dto.birthDate) }
          : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.weightKg !== undefined ? { weightKg: dto.weightKg } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.isNeutered !== undefined ? { isNeutered: dto.isNeutered } : {}),
        ...(dto.microchipNo !== undefined
          ? { microchipNo: dto.microchipNo }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  /**
   * Yumuşak silme. Gerçek silme, hayvana bağlı randevu ve sağlık
   * geçmişini de götürür; klinik kaydı böyle kaybedilmemeli.
   */
  async remove(id: string, requester: Requester) {
    await this.findOne(id, requester);
    await this.prisma.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async medicalRecords(petId: string, requester: Requester) {
    await this.findOne(petId, requester);
    return this.prisma.medicalRecord.findMany({
      where: { petId },
      include: {
        staff: { select: { id: true, fullName: true, title: true } },
        appointment: { select: { id: true, code: true } },
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  /** Yaklaşan aşı / kontrol takvimi. */
  async vaccinationSchedule(petId: string, requester: Requester) {
    await this.findOne(petId, requester);
    const records = await this.prisma.medicalRecord.findMany({
      where: { petId, nextDueAt: { not: null } },
      select: {
        id: true,
        title: true,
        type: true,
        performedAt: true,
        nextDueAt: true,
      },
      orderBy: { nextDueAt: 'asc' },
    });

    const now = new Date();
    return records.map((r) => ({
      ...r,
      // Tarihi geçmiş tekrarlar işaretleniyor ki arayüz öne çıkarabilsin.
      isOverdue: r.nextDueAt !== null && r.nextDueAt < now,
    }));
  }

  // ── Admin / personel ──

  createMedicalRecord(dto: CreateMedicalRecordDto) {
    return this.prisma.medicalRecord.create({
      data: {
        petId: dto.petId,
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        performedAt: new Date(dto.performedAt),
        nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
        staffId: dto.staffId ?? null,
        appointmentId: dto.appointmentId ?? null,
      },
    });
  }

  async removeMedicalRecord(id: string) {
    const found = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Sağlık kaydı bulunamadı.');
    await this.prisma.medicalRecord.delete({ where: { id } });
    return { deleted: true };
  }

  findAllAdmin(params: { q?: string; ownerId?: string }) {
    return this.prisma.pet.findMany({
      where: {
        deletedAt: null,
        ...(params.ownerId ? { ownerId: params.ownerId } : {}),
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: 'insensitive' as const } },
                { microchipNo: { contains: params.q } },
                {
                  owner: {
                    fullName: {
                      contains: params.q,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        owner: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { appointments: true, medicalRecords: true } },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  private assertOwnership(ownerId: string, requester: Requester): void {
    if (requester.role === 'ADMIN' || requester.role === 'STAFF') return;
    if (ownerId !== requester.id) {
      throw new ForbiddenException('Bu hayvan size ait değil.');
    }
  }
}
