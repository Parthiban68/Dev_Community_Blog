require('dotenv').config();

const common = {
  dialect: 'postgres',
  migrations: 'src/database/migrations',
  seeders: 'src/database/seeders',
};

const local = {
  ...common,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'devcommunity',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'devcommunity',
};

function remote() {
  const url = process.env.DATABASE_URL;
  const sslMode = url.match(/[?&]sslmode=([^&]+)/i)?.[1]?.toLowerCase();
  const useLibpqCompat = /(^|[?&])uselibpqcompat=true(&|$)/i.test(url);
  const requiresSsl = sslMode ? sslMode !== 'disable' : /(^|[?&])ssl=true(&|$)/i.test(url);
  const rejectUnauthorized = !useLibpqCompat && sslMode !== 'prefer' && sslMode !== 'allow';

  return {
    ...common,
    url,
    ...(requiresSsl
      ? {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized,
            },
          },
        }
      : {}),
  };
}

const environments = {
  development: process.env.DATABASE_URL ? remote() : local,
  test: { ...local, database: process.env.DB_NAME_TEST || `${local.database}_test` },
  production: process.env.DATABASE_URL ? remote() : local,
};

module.exports = environments;
