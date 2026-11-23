import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  API_PREFIX = 'api/v1';

  @IsString()
  CORS_ORIGIN = 'http://localhost:5173';

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsString()
  DB_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 5432;

  @IsString()
  DB_USER = 'devcommunity';

  @IsString()
  DB_PASSWORD = '';

  @IsString()
  DB_NAME = 'devcommunity';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  THROTTLE_TTL = 60000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  THROTTLE_LIMIT = 100;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  SWAGGER_ENABLED = true;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: true,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.toString()}`);
  }

  return validated;
}
