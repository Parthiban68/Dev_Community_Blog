import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword } from './strong-password.decorator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @IsStrongPassword()
  password!: string;
}
