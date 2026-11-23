import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const rawMessage = this.extractMessage(payload, status);
    const details = Array.isArray(rawMessage) ? rawMessage : undefined;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        Array.isArray(rawMessage) ? rawMessage.join('; ') : rawMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      date: new Date().toISOString(),
      message: details ? 'Validation failed' : rawMessage,
      statusCode: status,
      records: null,
      ...(details ? { details } : {}),
    });
  }

  private extractMessage(payload: unknown, status: number): string | string[] {
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === 'string' || Array.isArray(message)) {
        return message as string | string[];
      }
    }

    return HttpStatus[status] || 'Request failed';
  }
}
