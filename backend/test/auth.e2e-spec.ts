import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { UsersController } from 'src/modules/users/users.controller';
import { UsersService } from 'src/modules/users/users.service';

const TEST_SECRET = 'e2e-test-secret';

const safeUser = {
  id: 'user-1',
  username: 'tester',
  email: 'tester@example.com',
  displayName: 'Tester',
  bio: null,
  avatarUrl: null,
  status: 'active',
  emailVerified: false,
  emailVerifiedAt: null,
  onboardingCompleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const sessionResult = {
  user: safeUser,
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
  csrfToken: 'csrf-token-value',
  requiresOnboarding: true,
  verificationRequired: false,
  emailVerified: false,
};

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    checkUsername: jest.fn(),
    checkEmail: jest.fn(),
    isGithubConfigured: jest.fn().mockReturnValue(false),
  };
  const usersService = { getMe: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [
            () => ({
              nodeEnv: 'test',
              apiPrefix: 'api/v1',
              auth: {
                jwtAccessSecret: TEST_SECRET,
                jwtAccessTtl: '15m',
                refreshTokenTtlDays: 7,
                cookieSameSite: 'lax',
                cookieDomain: '',
                emailVerificationRequired: false,
                emailDeliveryEnabled: false,
                passwordResetTtlMinutes: 15,
                frontendBaseUrl: 'http://localhost:5173',
                github: { clientId: '', clientSecret: '', callbackUrl: '', stateSecret: '' },
              },
            }),
          ],
        }),
        JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '15m' } }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isGithubConfigured.mockReturnValue(false);
  });

  describe('GET /users/me', () => {
    it('rejects requests without a bearer token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

      expect(response.body).toMatchObject({
        message: 'Authentication required.',
        statusCode: 401,
        records: null,
      });
    });

    it('rejects tokens signed with the wrong secret', async () => {
      const token = await jwtService.signAsync(
        { sub: 'user-1', username: 'tester', email: 'tester@example.com' },
        { secret: 'wrong-secret' },
      );

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('returns the safe profile for a valid token', async () => {
      usersService.getMe.mockResolvedValue(safeUser);
      const token = await jwtService.signAsync({
        sub: 'user-1',
        username: 'tester',
        email: 'tester@example.com',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(usersService.getMe).toHaveBeenCalledWith('user-1');
      expect(response.body.records.user).toEqual(safeUser);
      expect(response.body.records.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /auth/register', () => {
    it('rejects weak passwords with the standard validation envelope', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'tester', email: 'tester@example.com', password: 'weak' })
        .expect(400);

      expect(response.body).toMatchObject({
        message: 'Validation failed',
        statusCode: 400,
        records: null,
      });
      expect(response.body.details).toBeDefined();
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('sets refresh and csrf cookies and never returns the refresh token in records', async () => {
      authService.register.mockResolvedValue(sessionResult);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'tester', email: 'tester@example.com', password: 'Valid-password1!' })
        .expect(201);

      expect(response.body.records).toMatchObject({
        accessToken: 'access-token-value',
        csrfToken: 'csrf-token-value',
        requiresOnboarding: true,
      });
      expect(response.body.records).not.toHaveProperty('refreshToken');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((cookie) => cookie.startsWith('refresh_token='));
      const csrfCookie = cookies.find((cookie) => cookie.startsWith('csrf_token='));
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('refresh-token-value');
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly');
    });
  });

  describe('POST /auth/refresh', () => {
    it('rejects requests without a matching CSRF cookie and header', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(403);

      expect(response.body).toMatchObject({
        message: 'Invalid CSRF token.',
        statusCode: 403,
        records: null,
      });
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('rejects a mismatched CSRF header', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['csrf_token=csrf-token-value'])
        .set('X-CSRF-Token', 'different-value')
        .expect(403);
    });

    it('rotates the session when CSRF matches', async () => {
      authService.refresh.mockResolvedValue(sessionResult);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['csrf_token=csrf-token-value', 'refresh_token=old-refresh-token'])
        .set('X-CSRF-Token', 'csrf-token-value')
        .expect(201);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(response.body.records.accessToken).toBe('access-token-value');
    });
  });

  describe('POST /auth/logout', () => {
    it('requires CSRF and clears session cookies', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(403);

      authService.logout.mockResolvedValue({ loggedOut: true });
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', ['csrf_token=csrf-token-value', 'refresh_token=old-refresh-token'])
        .set('X-CSRF-Token', 'csrf-token-value')
        .expect(201);

      expect(response.body.records).toEqual({ loggedOut: true });
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((cookie) => cookie.startsWith('refresh_token=;'))).toBe(true);
      expect(cookies.some((cookie) => cookie.startsWith('csrf_token=;'))).toBe(true);
    });
  });

  describe('GitHub OAuth', () => {
    it('returns a clear 503 from both endpoints when unconfigured', async () => {
      const start = await request(app.getHttpServer()).get('/api/v1/auth/github').expect(503);
      expect(start.body.message).toBe('GitHub sign-in is not configured.');

      const callback = await request(app.getHttpServer())
        .get('/api/v1/auth/github/callback')
        .expect(503);
      expect(callback.body.message).toBe('GitHub sign-in is not configured.');
    });
  });
});
