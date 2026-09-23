import { createHash, randomBytes } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role, User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/types/auth.types';

/** jsonwebtoken'in expiresIn icin bekledigi bicim: "15m", "2h", "7d". */
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
   * Refresh token'lar JWT DEGIL, 32 baytlik rastgele dize.
   *
   * Sebep: JWT kendi kendini dogrular, yani iptal edilemez — cikis yapmis
   * bir kullanicinin token'i suresi dolana kadar gecerli kalirdi.
   * Veritabaninda tutulan opak token her istekte kontrol edilir ve
   * aninda iptal edilebilir.
   *
   * Hash icin SHA-256 yeterli (argon2 degil): token zaten 256 bit entropiye
   * sahip rastgele bir deger, sozluk saldirisi soz konusu degil. Ustelik
   * hash uzerinden indeksli arama yapilabiliyor; argon2 olsaydi her
   * dogrulamada tum token satirlarini taramak gerekirdi.
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
      // jsonwebtoken duz string kabul etmiyor, "15m" gibi bir sablon tipi
      // bekliyor. Bicim env semasinda regex ile dogrulandigi icin bu
      // donusum guvenli.
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ??
        '15m') as TimeSpan,
    });
  }

  /** Yeni access + refresh cifti uretir ve refresh'i kaydeder. */
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
   * Token rotasyonu: kullanilan refresh token iptal edilir, yenisi verilir.
   * Boylece calinmis bir token en fazla bir kez ise yarar.
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
      throw new UnauthorizedException('Oturum gecersiz. Tekrar giris yapin.');
    }

    // Eski token'i once iptal et, sonra yenisini ver.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(record.user, meta);
  }

  /** Tek oturumu kapatir (cikis). Bilinmeyen token sessizce yok sayilir. */
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Kullanicinin TUM oturumlarini kapatir (sifre degisikligi / sifirlama). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
