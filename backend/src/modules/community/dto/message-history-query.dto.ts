import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class MessageHistoryQueryDto {
  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 50, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 'eyJ0IjoiMjAyNi0xMS0yNFQwMDowMDowMC4wMDBaIiwiaWQiOiJtZXNzYWdlLWlkIn0' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;
}
