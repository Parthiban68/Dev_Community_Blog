import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MESSAGE_KINDS, MessageKind } from '../community.types';

export class CreateReplyDto {
  @ApiProperty({ example: 'Use CSS grid with place-items: center.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body!: string;

  @ApiPropertyOptional({ example: 'answer', enum: MESSAGE_KINDS })
  @IsOptional()
  @IsIn(MESSAGE_KINDS)
  kind?: MessageKind;

  @ApiPropertyOptional({ example: '.parent { display: grid; place-items: center; }' })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  code?: string;

  @ApiPropertyOptional({ example: 'css' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;
}
