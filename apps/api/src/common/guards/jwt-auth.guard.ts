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
 * Global guard: varsayilan olarak HER uc korumalidir.
 * Disarida kalmasi gerekenler @Public() ile isaretlenir.
 *
 * Passport kullanilmiyor — tek bir strateji icin ek katman gereksiz;
 * JwtService dogrudan yeterli ve hata mesajlarini biz kontrol ediyoruz.
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
      // Acik uclarda token ZORUNLU degil ama varsa yine de cozumlenmeli.
      //
      // Aksi halde "hem misafir hem uye kullanabilir" tipindeki uclar
      // (ornegin randevu olusturma) giris yapmis kullaniciyi goremez:
      // randevu misafir randevusu olarak kaydedilir, "Randevularim"da
      // gorunmez ve uyeden bosuna telefon istenir.
      if (token) {
        try {
          req.user = await this.resolve(token);
        } catch {
          // Gecersiz token acik ucu engellemez; misafir olarak devam eder.
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Oturum acmaniz gerekiyor.');
    }

    try {
      req.user = await this.resolve(token);
    } catch {
      // Suresi dolmus ve gecersiz imza ayni mesaji alir:
      // saldirgana hangi durumda oldugunu soylemiyoruz.
      throw new UnauthorizedException('Oturum gecersiz veya suresi dolmus.');
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
