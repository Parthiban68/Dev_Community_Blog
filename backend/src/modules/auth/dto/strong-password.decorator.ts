import { applyDecorators } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';

export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    Length(12, 128),
    Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' }),
    Matches(/[a-z]/, { message: 'password must contain a lowercase letter' }),
    Matches(/[0-9]/, { message: 'password must contain a digit' }),
    Matches(/[^A-Za-z0-9]/, { message: 'password must contain a symbol' }),
  );
}
