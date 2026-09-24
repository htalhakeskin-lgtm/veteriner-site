import { createHash, randomBytes } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role, User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/types/auth.types';

/** jsonwebtoken'in expiresIn için bekledigi bicim: "15m", "2h", "7d". */
type TimeSpan = `${number}${'s' | 'm' | 'h' | 'd'}`;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Refresh token'lar JWT DEĞİL, 32 baytlık rastgele dize.
   *
   * Sebep: JWT kendi kendini doğrular, yani iptal edilemez — çıkış yapmış
   * bir kullanıcının token'i süresi dolana kadar geçerli kalırdı.
   * Veritabanında tutulan opak token her istekte kontrol edilir ve
   * anında iptal edilebilir.
   *
   * Hash için SHA-256 yeterli (argon2 değil): token zaten 256 bit entropiye
   * sahip rastgele bir değer, sözlük saldırısı söz konusu değil. Üstelik
   * hash üzerinden indeksli arama yapılabiliyor; argon2 olsaydı her
   * doğrulamada tüm token satırlarını taramak gerekirdi.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccessToken(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      // jsonwebtoken düz string kabul etmiyor, "15m" gibi bir şablon tipi
      // bekliyor. Bicim env şemasında regex ile doğrulandığı için bu
      // dönüşüm güvenli.
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ??
        '15m') as TimeSpan,
    });
  }

  /** Yeni access + refresh çifti üretir ve refresh'i kaydeder. */
  async issue(
    user: Pick<User, 'id' | 'email' | 'role'>,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<IssuedTokens> {
    const accessToken = await this.signAccessToken(user);

    const refreshToken = randomBytes(32).toString('base64url');
    const days = Number(this.config.get('REFRESH_TTL_DAYS') ?? 7);
    const refreshExpiresAt = new Date(Date.now() + days * 86_400_000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: refreshExpiresAt,
        userAgent: meta.userAgent?.slice(0, 255) ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  /**
   * Token rotasyonu: kullanılan refresh token iptal edilir, yenisi verilir.
   * Böylece çalınmış bir token en fazla bir kez ise yarar.
   */
  async rotate(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<IssuedTokens> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });

    const invalid =
      !record ||
      record.revokedAt !== null ||
      record.expiresAt <= new Date() ||
      !record.user.isActive ||
      record.user.deletedAt !== null;

    if (invalid) {
      throw new UnauthorizedException('Oturum geçersiz. Tekrar giriş yapın.');
    }

    // Eski token'i önce iptal et, sonra yenisini ver.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(record.user, meta);
  }

  /** Tek oturumu kapatır (çıkış). Bilinmeyen token sessizce yok sayılır. */
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Kullanıcının TÜM oturumlarını kapatır (şifre değişikliği / sıfırlama). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
