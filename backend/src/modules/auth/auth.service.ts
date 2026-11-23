import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import * as argon2 from 'argon2';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { Op, Transaction, UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { toSafeUser } from '../../common/types/safe-user';
import { generateToken, hashToken } from '../../common/utils/token.util';
import {
  DUMMY_PASSWORD_HASH,
  GENERIC_RESET_MESSAGE,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
} from './auth.constants';
import {
  AuthSessionResult,
  AvailabilityResult,
  ForgotPasswordResult,
  GithubProfile,
  JwtPayload,
  LogoutResult,
  ResetPasswordResult,
} from './auth.types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthSession } from './entities/auth-session.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(AuthSession) private readonly sessionModel: typeof AuthSession,
    @InjectModel(PasswordResetToken) private readonly resetTokenModel: typeof PasswordResetToken,
    @InjectModel(OAuthAccount) private readonly oauthAccountModel: typeof OAuthAccount,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSessionResult> {
    const username = dto.username.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();
    if (RESERVED_USERNAMES.has(username)) {
      throw new BadRequestException('Username is not available.');
    }
    const existing = await this.userModel.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      throw new ConflictException('Username or email is already in use.');
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    try {
      const user = await this.userModel.create({
        username,
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || username,
        status: 'active',
        onboardingCompleted: false,
      });
      return await this.issueSession(user);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('Username or email is already in use.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.userModel.findOne({
      where: { [Op.or]: [{ username: identifier }, { email: identifier }] },
    });
    if (!user || !user.passwordHash) {
      await argon2.verify(DUMMY_PASSWORD_HASH, dto.password).catch(() => false);
      throw new UnauthorizedException('Invalid credentials.');
    }
    const passwordValid = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    this.assertActive(user);
    if (this.isEmailVerificationRequired() && !user.emailVerifiedAt) {
      throw new ForbiddenException('Email verification required.');
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSessionResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const session = await this.sessionModel.findOne({
      where: { refreshTokenHash: hashToken(refreshToken) },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    if (session.revokedAt) {
      await this.sessionModel.update(
        { revokedAt: new Date() },
        { where: { familyId: session.familyId, revokedAt: null } },
      );
      throw new UnauthorizedException('Invalid refresh token.');
    }
    return this.sequelize.transaction(async (transaction) => {
      const user = await this.userModel.findByPk(session.userId, { transaction });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      this.assertActive(user);
      const result = await this.issueSession(user, session.familyId, transaction);
      await session.update({ revokedAt: new Date() }, { transaction });
      return result;
    });
  }

  async logout(refreshToken: string | undefined): Promise<LogoutResult> {
    if (refreshToken) {
      const session = await this.sessionModel.findOne({
        where: { refreshTokenHash: hashToken(refreshToken) },
      });
      if (session) {
        await this.sessionModel.update(
          { revokedAt: new Date() },
          { where: { familyId: session.familyId, revokedAt: null } },
        );
      }
    }
    return { loggedOut: true };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email } });
    const result: ForgotPasswordResult = { message: GENERIC_RESET_MESSAGE };
    if (!user) {
      return result;
    }
    const token = generateToken();
    const ttlMinutes = this.configService.get<number>('auth.passwordResetTtlMinutes') || 15;
    await this.sequelize.transaction(async (transaction) => {
      await this.resetTokenModel.update(
        { usedAt: new Date() },
        { where: { userId: user.id, usedAt: null }, transaction },
      );
      await this.resetTokenModel.create(
        {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
        },
        { transaction },
      );
    });
    const nodeEnv = this.configService.get<string>('nodeEnv');
    const deliveryEnabled = this.configService.get<boolean>('auth.emailDeliveryEnabled') === true;
    if (nodeEnv !== 'production' && !deliveryEnabled) {
      const baseUrl =
        this.configService.get<string>('auth.frontendBaseUrl') || 'http://localhost:5173';
      result.devResetUrl = `${baseUrl}/reset-password?token=${token}`;
    }
    return result;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    const tokenHash = hashToken(dto.token);
    return this.sequelize.transaction(async (transaction) => {
      const resetToken = await this.resetTokenModel.findOne({ where: { tokenHash }, transaction });
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('Invalid or expired reset token.');
      }
      const user = await this.userModel.findByPk(resetToken.userId, { transaction });
      if (!user) {
        throw new BadRequestException('Invalid or expired reset token.');
      }
      const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      await user.update({ passwordHash }, { transaction });
      await resetToken.update({ usedAt: new Date() }, { transaction });
      await this.sessionModel.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null }, transaction },
      );
      return { reset: true };
    });
  }

  async checkUsername(username: string): Promise<AvailabilityResult> {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized) || RESERVED_USERNAMES.has(normalized)) {
      return { available: false };
    }
    const existing = await this.userModel.findOne({ where: { username: normalized } });
    return { available: !existing };
  }

  async checkEmail(email: string): Promise<AvailabilityResult> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ where: { email: normalized } });
    return { available: !existing };
  }

  isGithubConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('auth.github.clientId') &&
        this.configService.get<string>('auth.github.clientSecret'),
    );
  }

  buildGithubAuthorizeUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('auth.github.clientId') || '',
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  signGithubState(state: string): string {
    const secret = this.configService.get<string>('auth.github.stateSecret');
    if (!secret) {
      return state;
    }
    return createHmac('sha256', secret).update(state).digest('hex');
  }

  async exchangeGithubCode(
    code: string,
    redirectUri: string,
  ): Promise<{ profile: GithubProfile; accessToken: string }> {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.configService.get<string>('auth.github.clientId'),
        client_secret: this.configService.get<string>('auth.github.clientSecret'),
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenResponse.ok) {
      throw new BadRequestException('GitHub sign-in failed.');
    }
    const tokenBody = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenBody.access_token) {
      throw new BadRequestException('GitHub sign-in failed.');
    }
    const accessToken = tokenBody.access_token;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'devcommons-backend',
    };
    const userResponse = await fetch('https://api.github.com/user', { headers });
    if (!userResponse.ok) {
      throw new BadRequestException('GitHub sign-in failed.');
    }
    const githubUser = (await userResponse.json()) as {
      id: number;
      login: string;
      email?: string | null;
      name?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
    };
    let email = githubUser.email ? githubUser.email.toLowerCase() : null;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', { headers });
      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const match =
          emails.find((entry) => entry.primary && entry.verified) ||
          emails.find((entry) => entry.verified);
        email = match ? match.email.toLowerCase() : null;
      }
    }
    if (!email) {
      throw new BadRequestException('GitHub account has no verified email address.');
    }
    return {
      profile: {
        id: String(githubUser.id),
        login: githubUser.login,
        email,
        name: githubUser.name ?? null,
        avatarUrl: githubUser.avatar_url ?? null,
        bio: githubUser.bio ?? null,
      },
      accessToken,
    };
  }

  async loginWithGithub(profile: GithubProfile, accessToken: string): Promise<AuthSessionResult> {
    return this.sequelize.transaction(async (transaction) => {
      const existingAccount = await this.oauthAccountModel.findOne({
        where: { provider: 'github', providerAccountId: profile.id },
        transaction,
      });
      let user: User | null = null;
      if (existingAccount) {
        user = await this.userModel.findByPk(existingAccount.userId, { transaction });
      }
      if (!user) {
        user = await this.userModel.findOne({ where: { email: profile.email }, transaction });
      }
      if (!user) {
        const username = await this.generateGithubUsername(profile.login, transaction);
        user = await this.userModel.create(
          {
            username,
            email: profile.email,
            passwordHash: null,
            displayName: (profile.name || profile.login).slice(0, 80),
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            status: 'active',
            emailVerifiedAt: new Date(),
            onboardingCompleted: false,
          },
          { transaction },
        );
      }
      this.assertActive(user);
      if (existingAccount) {
        await existingAccount.update({ accessTokenHash: hashToken(accessToken) }, { transaction });
      } else {
        await this.oauthAccountModel.create(
          {
            userId: user.id,
            provider: 'github',
            providerAccountId: profile.id,
            accessTokenHash: hashToken(accessToken),
          },
          { transaction },
        );
      }
      return this.issueSession(user, undefined, transaction);
    });
  }

  private async generateGithubUsername(login: string, transaction: Transaction): Promise<string> {
    let base = login
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    if (base.length < 3) {
      base = 'gh-user';
    }
    const candidates = [
      base,
      ...Array.from({ length: 5 }, () => `${base}-${randomBytes(3).toString('hex')}`),
    ];
    for (const candidate of candidates) {
      const username = candidate.slice(0, 30);
      if (RESERVED_USERNAMES.has(username)) {
        continue;
      }
      const existing = await this.userModel.findOne({ where: { username }, transaction });
      if (!existing) {
        return username;
      }
    }
    throw new ConflictException('Unable to allocate a username for this GitHub account.');
  }

  private async issueSession(
    user: User,
    familyId?: string,
    transaction?: Transaction,
  ): Promise<AuthSessionResult> {
    const refreshToken = generateToken();
    const ttlDays = this.configService.get<number>('auth.refreshTokenTtlDays') || 7;
    await this.sessionModel.create(
      {
        userId: user.id,
        familyId: familyId ?? randomUUID(),
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
      },
      { transaction },
    );
    const accessToken = await this.signAccessToken(user);
    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
      csrfToken: generateToken(),
      requiresOnboarding: !user.onboardingCompleted,
      verificationRequired: this.isEmailVerificationRequired(),
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    const secret = this.configService.get<string>('auth.jwtAccessSecret');
    if (!secret) {
      throw new InternalServerErrorException('JWT access secret is not configured.');
    }
    const expiresIn = (this.configService.get<string>('auth.jwtAccessTtl') ||
      '15m') as JwtSignOptions['expiresIn'];
    return this.jwtService.signAsync<JwtPayload>(
      { sub: user.id, username: user.username, email: user.email },
      { secret, expiresIn },
    );
  }

  private isEmailVerificationRequired(): boolean {
    return this.configService.get<boolean>('auth.emailVerificationRequired') === true;
  }

  private assertActive(user: User): void {
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }
  }
}
