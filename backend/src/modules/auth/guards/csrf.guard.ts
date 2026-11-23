import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { safeEqual } from '../../../common/utils/token.util';
import { CSRF_TOKEN_COOKIE } from '../auth.constants';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieToken = request.cookies?.[CSRF_TOKEN_COOKIE];
    const headerToken = request.headers['x-csrf-token'];
    if (
      typeof cookieToken !== 'string' ||
      typeof headerToken !== 'string' ||
      !cookieToken ||
      !headerToken ||
      !safeEqual(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Invalid CSRF token.');
    }
    return true;
  }
}
