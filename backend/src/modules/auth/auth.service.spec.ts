import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Sequelize } from 'sequelize-typescript';
import { GENERIC_RESET_MESSAGE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthSession } from './entities/auth-session.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from './entities/user.entity';

const STRONG_PASSWORD = 'Valid-password1!';

function buildConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    nodeEnv: 'test',
    'auth.jwtAccessSecret': 'unit-test-secret',
    'auth.jwtAccessTtl': '15m',
    'auth.refreshTokenTtlDays': 7,
    'auth.passwordResetTtlMinutes': 15,
    'auth.emailVerificationRequired': false,
    'auth.emailDeliveryEnabled': false,
    'auth.frontendBaseUrl': 'http://localhost:5173',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

function buildUser(overrides: Record<string, unknown> = {}): User {
  return {
    id: 'user-1',
    username: 'tester',
    email: 'tester@example.com',
    passwordHash: null,
    displayName: 'Tester',
    bio: null,
    avatarUrl: null,
    status: 'active',
    emailVerifiedAt: null,
    onboardingCompleted: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    update: jest.fn(),
    ...overrides,
  } as unknown as User;
}

function buildSession(overrides: Record<string, unknown> = {}): AuthSession {
  return {
    id: 'session-1',
    userId: 'user-1',
    familyId: 'family-1',
    refreshTokenHash: 'stored-hash',
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    update: jest.fn(),
    ...overrides,
  } as unknown as AuthSession;
}

function buildResetToken(overrides: Record<string, unknown> = {}): PasswordResetToken {
  return {
    id: 'reset-1',
    userId: 'user-1',
    tokenHash: 'stored-hash',
    expiresAt: new Date(Date.now() + 900_000),
    usedAt: null,
    update: jest.fn(),
    ...overrides,
  } as unknown as PasswordResetToken;
}

describe('AuthService', () => {
  let service: AuthService;
  let userModel: { findOne: jest.Mock; findByPk: jest.Mock; create: jest.Mock };
  let sessionModel: { findOne: jest.Mock; create: jest.Mock; update: jest.Mock };
  let resetTokenModel: { findOne: jest.Mock; create: jest.Mock; update: jest.Mock };
  let oauthAccountModel: { findOne: jest.Mock; create: jest.Mock; update: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let sequelize: { transaction: jest.Mock };

  function createService(configOverrides: Record<string, unknown> = {}): AuthService {
    return new AuthService(
      userModel as unknown as typeof User,
      sessionModel as unknown as typeof AuthSession,
      resetTokenModel as unknown as typeof PasswordResetToken,
      oauthAccountModel as unknown as typeof OAuthAccount,
      jwtService as unknown as JwtService,
      buildConfig(configOverrides),
      sequelize as unknown as Sequelize,
    );
  }

  beforeEach(() => {
    userModel = {
      findOne: jest.fn().mockResolvedValue(null),
      findByPk: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (values: Record<string, unknown>) =>
        buildUser(values),
      ),
    };
    sessionModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(buildSession()),
      update: jest.fn().mockResolvedValue([0]),
    };
    resetTokenModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(buildResetToken()),
      update: jest.fn().mockResolvedValue([0]),
    };
    oauthAccountModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([0]),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-access-token') };
    sequelize = {
      transaction: jest.fn(async (callback: (t: unknown) => Promise<unknown>) => callback({})),
    };
    service = createService();
  });

  describe('register', () => {
    const dto = { username: 'tester', email: 'tester@example.com', password: STRONG_PASSWORD };

    it('rejects duplicate username or email with a conflict', async () => {
      userModel.findOne.mockResolvedValue(buildUser());

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(userModel.create).not.toHaveBeenCalled();
      expect(sessionModel.create).not.toHaveBeenCalled();
    });

    it('rejects reserved usernames', async () => {
      await expect(service.register({ ...dto, username: 'admin' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('hashes the password with argon2id and issues a session', async () => {
      const result = await service.register(dto);

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'tester',
          email: 'tester@example.com',
          passwordHash: expect.stringMatching(/^\$argon2id\$/),
        }),
      );
      expect(sessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        { transaction: undefined },
      );
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(result.csrfToken).toBeTruthy();
      expect(result.requiresOnboarding).toBe(true);
      expect(result.user).toMatchObject({ id: 'user-1', onboardingCompleted: false });
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('returns the same generic 401 for unknown identifier and wrong password', async () => {
      const passwordHash = await argon2.hash(STRONG_PASSWORD, { type: argon2.argon2id });
      userModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildUser({ passwordHash }));

      const unknownError = await service
        .login({ identifier: 'nobody@example.com', password: STRONG_PASSWORD })
        .catch((error: unknown) => error);
      const wrongPasswordError = await service
        .login({ identifier: 'tester', password: 'Wrong-password1!' })
        .catch((error: unknown) => error);

      expect(unknownError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
      expect((unknownError as UnauthorizedException).message).toBe('Invalid credentials.');
      expect((wrongPasswordError as UnauthorizedException).message).toBe(
        (unknownError as UnauthorizedException).message,
      );
      expect(sessionModel.create).not.toHaveBeenCalled();
    });

    it('rejects disabled users with a generic 403 and no session', async () => {
      const passwordHash = await argon2.hash(STRONG_PASSWORD, { type: argon2.argon2id });
      userModel.findOne.mockResolvedValue(buildUser({ passwordHash, status: 'disabled' }));

      await expect(
        service.login({ identifier: 'tester', password: STRONG_PASSWORD }),
      ).rejects.toMatchObject({ message: 'Account is not active.' });
      expect(sessionModel.create).not.toHaveBeenCalled();
    });

    it('rejects unverified email when verification is required', async () => {
      service = createService({ 'auth.emailVerificationRequired': true });
      const passwordHash = await argon2.hash(STRONG_PASSWORD, { type: argon2.argon2id });
      userModel.findOne.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        service.login({ identifier: 'tester', password: STRONG_PASSWORD }),
      ).rejects.toMatchObject({ message: 'Email verification required.' });
      expect(sessionModel.create).not.toHaveBeenCalled();
    });

    it('allows unverified email when verification is optional and flags it', async () => {
      const passwordHash = await argon2.hash(STRONG_PASSWORD, { type: argon2.argon2id });
      userModel.findOne.mockResolvedValue(buildUser({ passwordHash }));

      const result = await service.login({ identifier: 'tester', password: STRONG_PASSWORD });

      expect(result.verificationRequired).toBe(false);
      expect(result.emailVerified).toBe(false);
    });
  });

  describe('refresh', () => {
    it('rejects a missing or unknown refresh token', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.refresh('unknown-token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionModel.update).not.toHaveBeenCalled();
    });

    it('rejects an expired session', async () => {
      sessionModel.findOne.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh('expired-token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionModel.update).not.toHaveBeenCalled();
    });

    it('revokes the whole family when a revoked token is reused', async () => {
      sessionModel.findOne.mockResolvedValue(buildSession({ revokedAt: new Date() }));

      await expect(service.refresh('reused-token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionModel.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        { where: { familyId: 'family-1', revokedAt: null } },
      );
      expect(sessionModel.create).not.toHaveBeenCalled();
    });

    it('rotates the token in the same family and revokes the old session', async () => {
      const session = buildSession();
      sessionModel.findOne.mockResolvedValue(session);
      userModel.findByPk.mockResolvedValue(buildUser());

      const result = await service.refresh('valid-token');

      expect(sessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', familyId: 'family-1' }),
        { transaction: {} },
      );
      expect(session.update).toHaveBeenCalledWith({ revokedAt: expect.any(Date) }, { transaction: {} });
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(result.csrfToken).toBeTruthy();
    });

    it('rejects refresh for suspended users', async () => {
      sessionModel.findOne.mockResolvedValue(buildSession());
      userModel.findByPk.mockResolvedValue(buildUser({ status: 'suspended' }));

      await expect(service.refresh('valid-token')).rejects.toBeInstanceOf(ForbiddenException);
      expect(sessionModel.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the session family when a session exists', async () => {
      sessionModel.findOne.mockResolvedValue(buildSession());

      const result = await service.logout('valid-token');

      expect(result).toEqual({ loggedOut: true });
      expect(sessionModel.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        { where: { familyId: 'family-1', revokedAt: null } },
      );
    });

    it('succeeds without a session', async () => {
      await expect(service.logout(undefined)).resolves.toEqual({ loggedOut: true });
      expect(sessionModel.update).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('returns the generic message and creates nothing for unknown accounts', async () => {
      const result = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(result.message).toBe(GENERIC_RESET_MESSAGE);
      expect(result.devResetUrl).toBeUndefined();
      expect(resetTokenModel.create).not.toHaveBeenCalled();
    });

    it('returns the same message and a dev reset url for existing accounts outside production', async () => {
      userModel.findOne.mockResolvedValue(buildUser());

      const result = await service.forgotPassword({ email: 'tester@example.com' });

      expect(result.message).toBe(GENERIC_RESET_MESSAGE);
      expect(result.devResetUrl).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/);
      expect(resetTokenModel.update).toHaveBeenCalledWith(
        { usedAt: expect.any(Date) },
        { where: { userId: 'user-1', usedAt: null }, transaction: {} },
      );
      expect(resetTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        { transaction: {} },
      );
    });

    it('never exposes a reset url in production', async () => {
      service = createService({ nodeEnv: 'production' });
      userModel.findOne.mockResolvedValue(buildUser());

      const result = await service.forgotPassword({ email: 'tester@example.com' });

      expect(result.message).toBe(GENERIC_RESET_MESSAGE);
      expect(result.devResetUrl).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    const dto = { token: 'reset-token', password: 'New-password1!' };

    it('rejects unknown, used and expired tokens with a generic 400', async () => {
      resetTokenModel.findOne.mockResolvedValueOnce(null);
      await expect(service.resetPassword(dto)).rejects.toMatchObject({
        message: 'Invalid or expired reset token.',
      });

      resetTokenModel.findOne.mockResolvedValueOnce(buildResetToken({ usedAt: new Date() }));
      await expect(service.resetPassword(dto)).rejects.toMatchObject({
        message: 'Invalid or expired reset token.',
      });

      resetTokenModel.findOne.mockResolvedValueOnce(
        buildResetToken({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.resetPassword(dto)).rejects.toMatchObject({
        message: 'Invalid or expired reset token.',
      });
      expect(userModel.findByPk).not.toHaveBeenCalled();
    });

    it('resets the password, marks the token used and revokes all sessions', async () => {
      const resetToken = buildResetToken();
      const user = buildUser();
      resetTokenModel.findOne.mockResolvedValue(resetToken);
      userModel.findByPk.mockResolvedValue(user);

      const result = await service.resetPassword(dto);

      expect(result).toEqual({ reset: true });
      expect(user.update).toHaveBeenCalledWith(
        { passwordHash: expect.stringMatching(/^\$argon2id\$/) },
        { transaction: {} },
      );
      expect(resetToken.update).toHaveBeenCalledWith({ usedAt: expect.any(Date) }, { transaction: {} });
      expect(sessionModel.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        { where: { userId: 'user-1', revokedAt: null }, transaction: {} },
      );
    });
  });

  describe('availability checks', () => {
    it('marks reserved and malformed usernames unavailable without querying', async () => {
      await expect(service.checkUsername('admin')).resolves.toEqual({ available: false });
      await expect(service.checkUsername('Admin')).resolves.toEqual({ available: false });
      await expect(service.checkUsername('ab')).resolves.toEqual({ available: false });
      await expect(service.checkUsername('bad name')).resolves.toEqual({ available: false });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('reports taken and free usernames', async () => {
      userModel.findOne.mockResolvedValueOnce(buildUser());
      await expect(service.checkUsername('tester')).resolves.toEqual({ available: false });

      userModel.findOne.mockResolvedValueOnce(null);
      await expect(service.checkUsername('Fresh-Name')).resolves.toEqual({ available: true });
      expect(userModel.findOne).toHaveBeenLastCalledWith({ where: { username: 'fresh-name' } });
    });

    it('normalizes email before checking availability', async () => {
      userModel.findOne.mockResolvedValueOnce(null);
      await expect(service.checkEmail('Tester@Example.com')).resolves.toEqual({ available: true });
      expect(userModel.findOne).toHaveBeenCalledWith({ where: { email: 'tester@example.com' } });
    });
  });
});
