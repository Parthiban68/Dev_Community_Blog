import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthSession } from '../modules/auth/entities/auth-session.entity';
import { OAuthAccount } from '../modules/auth/entities/oauth-account.entity';
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity';
import { User } from '../modules/auth/entities/user.entity';
import { buildDatabaseOptions } from './database.options';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildDatabaseOptions(configService),
        models: [User, AuthSession, PasswordResetToken, OAuthAccount],
      }),
    }),
  ],
})
export class DatabaseModule {}
