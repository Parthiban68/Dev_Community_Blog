import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { generateToken, safeEqual } from '../../common/utils/token.util';
import {
  CSRF_TOKEN_COOKIE,
  GITHUB_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './auth.constants';
import { AuthService } from './auth.service';
import { AuthSessionResult } from './auth.types';
import { CheckEmailDto } from './dto/check-email.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CsrfGuard } from './guards/csrf.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setSessionCookies(res, result);
    return this.toAuthRecords(result);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in with username or email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setSessionCookies(res, result);
    return this.toAuthRecords(result);
  }

  @Post('refresh')
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refresh(this.getRefreshCookie(req));
    this.setSessionCookies(res, result);
    return this.toAuthRecords(result);
  }

  @Post('logout')
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Revoke the current session family and clear cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(this.getRefreshCookie(req));
    this.clearSessionCookies(res);
    return result;
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset a password using a reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('check-username')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Check whether a username is available' })
  checkUsername(@Query() query: CheckUsernameDto) {
    return this.authService.checkUsername(query.username);
  }

  @Get('check-email')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Check whether an email is available' })
  checkEmail(@Query() query: CheckEmailDto) {
    return this.authService.checkEmail(query.email);
  }

  @Get('github')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Start the GitHub OAuth flow' })
  github(@Req() req: Request, @Res() res: Response): void {
    if (!this.authService.isGithubConfigured()) {
      throw new ServiceUnavailableException('GitHub sign-in is not configured.');
    }
    const state = generateToken();
    const redirectUri = this.resolveGithubCallbackUrl(req);
    res.cookie(GITHUB_STATE_COOKIE, this.authService.signGithubState(state), {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      path: '/',
      maxAge: 600_000,
    });
    res.redirect(this.authService.buildGithubAuthorizeUrl(state, redirectUri));
  }

  @Get('github/callback')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete the GitHub OAuth flow' })
  async githubCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (!this.authService.isGithubConfigured()) {
      throw new ServiceUnavailableException('GitHub sign-in is not configured.');
    }
    const stateCookie = req.cookies?.[GITHUB_STATE_COOKIE];
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    res.clearCookie(GITHUB_STATE_COOKIE, { path: '/' });
    if (
      !code ||
      !state ||
      typeof stateCookie !== 'string' ||
      !safeEqual(this.authService.signGithubState(state), stateCookie)
    ) {
      throw new BadRequestException('Invalid GitHub OAuth state.');
    }
    const { profile, accessToken } = await this.authService.exchangeGithubCode(
      code,
      this.resolveGithubCallbackUrl(req),
    );
    const result = await this.authService.loginWithGithub(profile, accessToken);
    this.setSessionCookies(res, result);
    res.redirect(
      this.configService.get<string>('auth.frontendBaseUrl') || 'http://localhost:5173',
    );
  }

  private getRefreshCookie(req: Request): string | undefined {
    const value = req.cookies?.[REFRESH_TOKEN_COOKIE];
    return typeof value === 'string' && value ? value : undefined;
  }

  private toAuthRecords(result: AuthSessionResult) {
    return {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
      requiresOnboarding: result.requiresOnboarding,
      verificationRequired: result.verificationRequired,
      emailVerified: result.emailVerified,
    };
  }

  private setSessionCookies(res: Response, result: AuthSessionResult): void {
    const ttlDays = this.configService.get<number>('auth.refreshTokenTtlDays') || 7;
    const sameSite = (this.configService.get<string>('auth.cookieSameSite') || 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    const domain = this.configService.get<string>('auth.cookieDomain') || undefined;
    const options = {
      sameSite,
      secure: this.isProduction(),
      path: '/',
      maxAge: ttlDays * 86_400_000,
      ...(domain ? { domain } : {}),
    };
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, { ...options, httpOnly: true });
    res.cookie(CSRF_TOKEN_COOKIE, result.csrfToken, { ...options, httpOnly: false });
  }

  private clearSessionCookies(res: Response): void {
    const domain = this.configService.get<string>('auth.cookieDomain') || undefined;
    const options = { path: '/', ...(domain ? { domain } : {}) };
    res.clearCookie(REFRESH_TOKEN_COOKIE, options);
    res.clearCookie(CSRF_TOKEN_COOKIE, options);
  }

  private resolveGithubCallbackUrl(req: Request): string {
    const configured = this.configService.get<string>('auth.github.callbackUrl');
    if (configured) {
      return configured;
    }
    const prefix = this.configService.get<string>('apiPrefix') || 'api/v1';
    return `${req.protocol}://${req.get('host')}/${prefix}/auth/github/callback`;
  }

  private isProduction(): boolean {
    return this.configService.get<string>('nodeEnv') === 'production';
  }
}
