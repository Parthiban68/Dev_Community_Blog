import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  CHANNEL_TYPES,
  CHANNEL_VISIBILITIES,
  ChannelType,
  ChannelVisibility,
  SLUG_PATTERN,
} from '../community.types';

export class CreateChannelDto {
  @ApiProperty({ example: 'General Help' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'general-help' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(SLUG_PATTERN)
  @MaxLength(140)
  slug?: string;

  @ApiPropertyOptional({ example: 'Ask questions and help other developers.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'text', enum: CHANNEL_TYPES })
  @IsOptional()
  @IsIn(CHANNEL_TYPES)
  type?: ChannelType;

  @ApiPropertyOptional({ example: 'public', enum: CHANNEL_VISIBILITIES })
  @IsOptional()
  @IsIn(CHANNEL_VISIBILITIES)
  visibility?: ChannelVisibility;
}
