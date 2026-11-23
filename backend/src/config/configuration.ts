export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || 'devcommunity',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'devcommunity',
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL || 60000),
    limit: Number(process.env.THROTTLE_LIMIT || 100),
  },
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
    jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
    cookieDomain: process.env.COOKIE_DOMAIN || '',
    emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
    emailDeliveryEnabled: process.env.EMAIL_DELIVERY_ENABLED === 'true',
    passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15),
    frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
      stateSecret: process.env.GITHUB_STATE_SECRET || '',
    },
  },
});
