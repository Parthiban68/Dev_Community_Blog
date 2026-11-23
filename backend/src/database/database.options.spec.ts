import { ConfigService } from '@nestjs/config';
import { buildDatabaseOptions } from './database.options';

function fakeConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as ConfigService;
}

describe('buildDatabaseOptions', () => {
  it('enables verified SSL for verify-full URLs', () => {
    const url = 'postgresql://user:pass@host.example/db?sslmode=verify-full&channel_binding=require';
    const options = buildDatabaseOptions(fakeConfig({ 'database.url': url }));

    expect(options).toMatchObject({
      uri: url,
      dialect: 'postgres',
      synchronize: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: true },
      },
    });
  });

  it('respects explicit libpq compatibility opt-in', () => {
    const url = 'postgresql://user:pass@host.example/db?uselibpqcompat=true&sslmode=require';
    const options = buildDatabaseOptions(fakeConfig({ 'database.url': url }));

    expect(options).toMatchObject({
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
    });
  });

  it('uses discrete host settings and no SSL when no URL is configured', () => {
    const options = buildDatabaseOptions(
      fakeConfig({
        'database.host': 'localhost',
        'database.port': 5432,
        'database.username': 'devcommunity',
        'database.password': 'local_password',
        'database.database': 'devcommunity',
      }),
    );

    expect(options).toMatchObject({
      host: 'localhost',
      port: 5432,
      username: 'devcommunity',
      database: 'devcommunity',
    });
    expect(options).not.toHaveProperty('dialectOptions');
  });
});
