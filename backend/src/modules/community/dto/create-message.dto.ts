import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MESSAGE_KINDS, MessageKind } from '../community.types';

export class CreateMessageDto {
  @ApiProperty({ example: 'How do I center a div in 2026?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body!: string;

  @ApiPropertyOptional({ example: 'question', enum: MESSAGE_KINDS })
  @IsOptional()
  @IsIn(MESSAGE_KINDS)
  kind?: MessageKind;

  @ApiPropertyOptional({ example: 'const answer = 42;' })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  code?: string;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @ApiPropertyOptional({ example: 'https://developer.mozilla.org/' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'MDN Web Docs' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkTitle?: string;
}
