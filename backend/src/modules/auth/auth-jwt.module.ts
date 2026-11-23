import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';

export const AuthJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('auth.jwtAccessSecret') || undefined,
    signOptions: {
      expiresIn: (configService.get<string>('auth.jwtAccessTtl') ||
        '15m') as JwtSignOptions['expiresIn'],
    },
  }),
});
