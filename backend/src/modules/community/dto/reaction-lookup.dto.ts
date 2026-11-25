import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReactionLookupDto {
  @ApiPropertyOptional({ example: '👍' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  emoji?: string;
}
