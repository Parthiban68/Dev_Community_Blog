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

const environments = {
  development: process.env.DATABASE_URL
    ? { ...common, use_env_variable: 'DATABASE_URL' }
    : local,
  test: { ...local, database: process.env.DB_NAME_TEST || `${local.database}_test` },
  production: { ...common, use_env_variable: 'DATABASE_URL' },
};

module.exports = environments;
