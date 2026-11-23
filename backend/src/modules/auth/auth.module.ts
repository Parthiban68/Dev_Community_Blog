import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from '../users/users.module';
import { AuthJwtModule } from './auth-jwt.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from './entities/auth-session.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([User, AuthSession, PasswordResetToken, OAuthAccount]),
    AuthJwtModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
