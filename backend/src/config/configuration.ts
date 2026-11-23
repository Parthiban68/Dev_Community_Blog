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
});
