import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
};

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

  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED = true;

  @IsOptional()
  @IsString()
  JWT_ACCESS_SECRET = '';

  @IsString()
  @Matches(/^\d+(s|m|h|d)$/)
  JWT_ACCESS_TTL = '15m';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  REFRESH_TOKEN_TTL_DAYS = 7;

  @IsIn(['lax', 'strict', 'none'])
  COOKIE_SAME_SITE = 'lax';

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  @Transform(toBoolean)
  @IsBoolean()
  EMAIL_VERIFICATION_REQUIRED = false;

  @Transform(toBoolean)
  @IsBoolean()
  EMAIL_DELIVERY_ENABLED = false;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  PASSWORD_RESET_TTL_MINUTES = 15;

  @IsString()
  FRONTEND_BASE_URL = 'http://localhost:5173';

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GITHUB_CALLBACK_URL?: string;

  @IsOptional()
  @IsString()
  GITHUB_STATE_SECRET?: string;
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
