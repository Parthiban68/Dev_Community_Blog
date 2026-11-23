import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required.');
    }
    const secret = this.configService.get<string>('auth.jwtAccessSecret');
    if (!secret) {
      throw new InternalServerErrorException('JWT access secret is not configured.');
    }
    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(header.slice(7).trim(), {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return true;
  }
}
