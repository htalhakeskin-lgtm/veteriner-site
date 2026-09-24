import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser, JwtPayload } from '../types/auth.types';

/**
 * Global guard: varsayılan olarak HER uç korumalıdır.
 * Dışarıda kalması gerekenler @Public() ile işaretlenir.
 *
 * Passport kullanılmıyor — tek bir strateji için ek katman gereksiz;
 * JwtService doğrudan yeterli ve hata mesajlarını biz kontrol ediyoruz.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractBearer(req);

    if (isPublic) {
      // Açık uçlarda token ZORUNLU değil ama varsa yine de çözümlenmeli.
      //
      // Aksi halde "hem misafir hem üye kullanabilir" tipindeki uçlar
      // (örneğin randevu oluşturma) giriş yapmış kullanıcıyı göremez:
      // randevu misafir randevusu olarak kaydedilir, "Randevularım"da
      // görünmez ve üyeden boşuna telefon istenir.
      if (token) {
        try {
          req.user = await this.resolve(token);
        } catch {
          // Geçersiz token açık ucu engellemez; misafir olarak devam eder.
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Oturum açmanız gerekiyor.');
    }

    try {
      req.user = await this.resolve(token);
    } catch {
      // Süresi dolmuş ve geçersiz imza aynı mesajı alır:
      // saldırgana hangi durumda olduğunu söylemiyoruz.
      throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
    }
    return true;
  }

  private async resolve(token: string): Promise<AuthUser> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : null;
}
