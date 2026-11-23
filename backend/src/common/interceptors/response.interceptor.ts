import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../utils/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((records) => ({
        date: new Date().toISOString(),
        message: 'Request successful',
        statusCode: context.switchToHttp().getResponse<{ statusCode: number }>().statusCode,
        records,
      })),
    );
  }
}
