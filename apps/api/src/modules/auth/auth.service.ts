import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, verify } from '@node-rs/argon2';
import type { User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/types/auth.types';
import type { ForgotPasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { TokenService, type IssuedTokens } from './token.service';

/** argon2id — plan gereği bcrypt değil. algorithm: 2 = Argon2id. */
const ARGON_OPTS = { algorithm: 2 as const };

/**
 * Var olmayan bir kullanıcı için de argon2 doğrulaması yapılabilsin diye
 * hazır tutulan sahte hash. Amaç: "e-posta kayıtlı mi?" sorusunun cevabını
 * yanıt süresinden sızdırmamak (kullanıcı sayımı saldırısı).
 */
const DUMMY_HASH_PROMISE = hash('nonexistent-user-placeholder', ARGON_OPTS);

export interface AuthResult {
  user: AuthUser & { fullName: string };
  tokens: IssuedTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  private toAuthUser(user: User): AuthUser & { fullName: string } {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }

  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        passwordHash: await hash(dto.password, ARGON_OPTS),
        role: 'CUSTOMER', // Rol istemciden ASLA alınmaz
      },
    });

    return {
      user: this.toAuthUser(user),
      tokens: await this.tokens.issue(user, meta),
    };
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Kullanıcı yoksa da argon2 çalıştırıyoruz: erken dönseydik yanıt
    // süresi farkı "bu e-posta kayıtlı değil" bilgisini ele verirdi.
    const passwordOk = user
      ? await verify(user.passwordHash, dto.password)
      : (await verify(await DUMMY_HASH_PROMISE, dto.password), false);

    const usable =
      user !== null && user.isActive && user.deletedAt === null && passwordOk;

    if (!usable) {
      // Tek ve aynı mesaj: hangi şartın tutmadığı sızdırılmıyor.
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.toAuthUser(user),
      tokens: await this.tokens.issue(user, meta),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      // Token geçerli ama kullanıcı silinmiş/pasife alınmış olabilir.
      throw new UnauthorizedException('Hesap bulunamadı.');
    }
    return user;
  }

  /**
   * Sıfırlama talebi. Kullanıcının var olup olmadığı ASLA sızdırılmaz:
   * her durumda aynı yanıt döner.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });

    if (user) {
      const raw = randomBytes(32).toString('base64url');
      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash: createHash('sha256').update(raw).digest('hex'),
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
        },
      });

      if (this.config.get<boolean>('DEMO_MODE')) {
        // Demo modunda e-posta gönderilmez; bağlantı loga yazılır ki
        // akış uçtan uca denenebilsin.
        this.logger.warn(
          `[DEMO] Şifre sıfırlama bağlantısı: ` +
            `${this.config.get('WEB_ORIGIN')}/sifre-sifirla?token=${raw}`,
        );
      }
      // TODO(Faz 4): DEMO_MODE kapalıyken EmailChannel ile gönder.
    }

    return {
      message:
        'Eğer bu e-posta adresiyle bir hesap varsa, sıfırlama bağlantısı gönderildi.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.usedAt !== null ||
      record.expiresAt <= new Date() ||
      !record.user.isActive ||
      record.user.deletedAt !== null
    ) {
      throw new UnauthorizedException(
        'Sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hash(newPassword, ARGON_OPTS) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Şifre değişti: eski oturumların hepsi kapansın.
    // Hesap ele geçirildiyse saldırganın oturumu da böylece biter.
    await this.tokens.revokeAllForUser(record.userId);
  }
}

/** Sabit zamanli dize karşılaştırması (ileride token karşılaştırmaları için). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
