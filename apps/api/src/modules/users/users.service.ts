import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import type { ChangePasswordDto, UpdateProfileDto } from './dto/users.dto';

const ARGON_OPTS = { algorithm: 2 as const };

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /** Admin: musteri listesi (arama + sayfalama). Admin panelinin temeli. */
  async list(params: { q?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const where = {
      deletedAt: null,
      ...(params.q
        ? {
            OR: [
              { fullName: { contains: params.q, mode: 'insensitive' as const } },
              { email: { contains: params.q, mode: 'insensitive' as const } },
              { phone: { contains: params.q } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...PUBLIC_FIELDS, _count: { select: { pets: true, appointments: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, pageCount: Math.ceil(total / limit) };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundException('Hesap bulunamadi.');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // E-posta ve rol bilerek guncellenmiyor: e-posta degisikligi
    // dogrulama akisi ister, rol ise yetki yukseltme riski tasir.
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      },
      select: PUBLIC_FIELDS,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Hesap bulunamadi.');

    if (!(await verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('Mevcut sifreniz hatali.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(dto.newPassword, ARGON_OPTS) },
    });

    // Sifre degisti: diger cihazlardaki oturumlar da kapansin.
    await this.tokens.revokeAllForUser(userId);

    return { message: 'Sifreniz guncellendi. Diger cihazlardaki oturumlar kapatildi.' };
  }
}
