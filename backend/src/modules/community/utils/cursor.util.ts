import { BadRequestException } from '@nestjs/common';

export interface MessageCursor {
  createdAt: Date;
  id: string;
}

interface CursorPayload {
  t: string;
  id: string;
}

export function encodeMessageCursor(message: { createdAt: Date; id: string }): string {
  const payload: CursorPayload = { t: message.createdAt.toISOString(), id: message.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeMessageCursor(cursor: string): MessageCursor {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<CursorPayload>;
    if (typeof parsed.t !== 'string' || typeof parsed.id !== 'string' || !parsed.id) {
      throw new Error('Invalid cursor payload.');
    }
    const createdAt = new Date(parsed.t);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor timestamp.');
    }
    return { createdAt, id: parsed.id };
  } catch {
    throw new BadRequestException('Invalid message cursor.');
  }
}
