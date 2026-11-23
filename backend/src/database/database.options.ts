import { ConfigService } from '@nestjs/config';

export function buildDatabaseOptions(configService: ConfigService) {
  const common = {
    dialect: 'postgres' as const,
    autoLoadModels: false,
    synchronize: false,
    logging: false,
  };
  const url = configService.get<string>('database.url');

  if (url) {
    const sslMode = url.match(/[?&]sslmode=([^&]+)/i)?.[1]?.toLowerCase();
    const useLibpqCompat = /(^|[?&])uselibpqcompat=true(&|$)/i.test(url);
    const requiresSsl = sslMode
      ? sslMode !== 'disable'
      : /(^|[?&])ssl=true(&|$)/i.test(url);
    const rejectUnauthorized = !useLibpqCompat && sslMode !== 'prefer' && sslMode !== 'allow';

    return {
      ...common,
      uri: url,
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

  return {
    ...common,
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.database'),
  };
}
