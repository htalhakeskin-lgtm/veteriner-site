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

/** Refresh token'in tasindigi cookie adi. */
export const REFRESH_COOKIE = 'vet_rt';

/**
 * Oturum ipucu cerezi. SIR ICERMEZ, sadece "bir oturum var" bayragi.
 *
 * Refresh token httpOnly oldugu icin JavaScript onu goremez; bu yuzden
 * istemci her sayfa acilisinda korlemesine /auth/refresh cagirmak
 * zorunda kaliyordu. Misafir ziyaretcide bu her seferinde 401 uretiyor,
 * konsolu kirletiyor ve gereksiz bir istek atiyordu.
 * Bu cerez okunabilir oldugu icin istemci once bakip karar verebiliyor.
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
   * Refresh token httpOnly cookie ile tasinir.
   *
   * Neden localStorage degil: localStorage'daki bir token, sayfada calisan
   * herhangi bir XSS ile okunabilir. httpOnly cookie'ye JavaScript erisemez.
   * Access token ise kisa omurlu ve bellekte tutuluyor.
   *
   * path kisitli: cookie yalnizca /auth uclarina gonderilir, her isteğe degil.
   */
  private cookieOptions(expiresAt?: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE') ?? false,
      sameSite: 'lax', // CSRF'e karsi; frontend ayni siteden cagiriyor
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
    // Ipucu cerezi: httpOnly DEGIL (istemci okuyabilmeli) ve tum yollara
    // gonderilir. Icinde sir yok, yalnizca "1".
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
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } }) // saatte 5 kayit / IP
  @ApiOperation({ summary: 'Yeni musteri hesabi olustur' })
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
  // Kaba kuvvet denemesine karsi: IP basina 15 dakikada 5 deneme.
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @ApiOperation({ summary: 'Giris yap' })
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
      throw new UnauthorizedException('Oturum bulunamadi. Giris yapin.');
    }

    let tokens: IssuedTokens;
    try {
      tokens = await this.tokens.rotate(token, this.meta(req));
    } catch (err) {
      // Gecersiz cookie'yi tarayicidan temizle, aksi halde her istekte
      // ayni hata tekrar eder ve kullanici kisir donguye girer.
      this.clearSessionCookies(res);
      throw err;
    }

    this.setRefreshCookie(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cikis yap' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await this.tokens.revoke(token);
    this.clearSessionCookies(res);
    return { message: 'Oturum kapatildi.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Aktif kullanici bilgisi' })
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Sifre sifirlama baglantisi iste' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Yeni sifre belirle' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.resetPassword(dto.token, dto.password);
    this.clearSessionCookies(res);
    return { message: 'Sifreniz guncellendi. Yeniden giris yapabilirsiniz.' };
  }
}
