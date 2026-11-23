import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SafeUser, toSafeUser } from '../../common/types/safe-user';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.findActiveUser(userId);
    return toSafeUser(user);
  }

  async completeOnboarding(userId: string): Promise<SafeUser> {
    const user = await this.findActiveUser(userId);

    if (!user.onboardingCompleted) {
      user.onboardingCompleted = true;
      await user.save();
    }

    return toSafeUser(user);
  }

  private async findActiveUser(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }
    return user;
  }
}
