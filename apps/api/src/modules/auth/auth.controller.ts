import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../../common/types/auth.types';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { TokenService, type IssuedTokens } from './token.service';

/** Refresh token'in taşındığı cookie adı. */
export const REFRESH_COOKIE = 'vet_rt';

/**
 * Oturum ipucu çerezi. SIR İÇERMEZ, sadece "bir oturum var" bayrağı.
 *
 * Refresh token httpOnly olduğu için JavaScript onu göremez; bu yüzden
 * istemci her sayfa açılışında körlemesine /auth/refresh çağırmak
 * zorunda kalıyordu. Misafir ziyaretçide bu her seferinde 401 üretiyor,
 * konsolu kirletiyor ve gereksiz bir istek atıyordu.
 * Bu çerez okunabilir olduğu için istemci önce bakıp karar verebiliyor.
 */
export const SESSION_HINT_COOKIE = 'vet_session';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Refresh token httpOnly cookie ile taşınır.
   *
   * Neden localStorage değil: localStorage'daki bir token, sayfada çalışan
   * herhangi bir XSS ile okunabilir. httpOnly cookie'ye JavaScript erişemez.
   * Access token ise kısa ömürlü ve bellekte tutuluyor.
   *
   * path kısıtlı: cookie yalnızca /auth uçlarına gönderilir, her isteğe değil.
   */
  private cookieOptions(expiresAt?: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE') ?? false,
      sameSite: 'lax', // CSRF'e karşı; frontend aynı siteden çağırıyor
      path: '/api/v1/auth',
      ...(expiresAt ? { expires: expiresAt } : {}),
    };
  }

  private setRefreshCookie(res: Response, tokens: IssuedTokens): void {
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      this.cookieOptions(tokens.refreshExpiresAt),
    );
    // Ipucu çerezi: httpOnly DEĞİL (istemci okuyabilmeli) ve tüm yollara
    // gönderilir. İçinde sır yok, yalnızca "1".
    res.cookie(SESSION_HINT_COOKIE, '1', {
      httpOnly: false,
      secure: this.config.get<boolean>('COOKIE_SECURE') ?? false,
      sameSite: 'lax',
      path: '/',
      expires: tokens.refreshExpiresAt,
    });
  }

  private clearSessionCookies(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    res.clearCookie(SESSION_HINT_COOKIE, {
      httpOnly: false,
      secure: this.config.get<boolean>('COOKIE_SECURE') ?? false,
      sameSite: 'lax',
      path: '/',
    });
  }

  private meta(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } }) // saatte 5 kayıt / IP
  @ApiOperation({ summary: 'Yeni müşteri hesabı oluştur' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.register(dto, this.meta(req));
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Kaba kuvvet denemesine karşı: IP başına 15 dakikada 5 deneme.
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @ApiOperation({ summary: 'Giriş yap' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto, this.meta(req));
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access token yenile (cookie ile)' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Oturum bulunamadı. Giriş yapın.');
    }

    let tokens: IssuedTokens;
    try {
      tokens = await this.tokens.rotate(token, this.meta(req));
    } catch (err) {
      // Geçersiz cookie'yi tarayıcıdan temizle, aksi halde her istekte
      // aynı hata tekrar eder ve kullanıcı kısır döngüye girer.
      this.clearSessionCookies(res);
      throw err;
    }

    this.setRefreshCookie(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Çıkış yap' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await this.tokens.revoke(token);
    this.clearSessionCookies(res);
    return { message: 'Oturum kapatıldı.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Aktif kullanıcı bilgisi' })
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama bağlantısı iste' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Yeni şifre belirle' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.resetPassword(dto.token, dto.password);
    this.clearSessionCookies(res);
    return { message: 'Şifreniz güncellendi. Yeniden giriş yapabilirsiniz.' };
  }
}
