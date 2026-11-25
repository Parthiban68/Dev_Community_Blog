import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { RESOURCE_TYPES, ChannelResourceType } from '../community.types';

export class ResourceQueryDto {
  @ApiPropertyOptional({ example: 'link', enum: RESOURCE_TYPES })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  type?: ChannelResourceType;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  search?: string;
}
