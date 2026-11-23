import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CheckEmailDto } from './check-email.dto';
import { CheckUsernameDto } from './check-username.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';

function toDto<T extends object>(cls: new () => T, payload: Record<string, unknown>): T {
  return plainToInstance(cls, payload, { enableImplicitConversion: true });
}

describe('auth DTOs', () => {
  const validRegister = {
    username: 'valid_user-1',
    email: 'user@example.com',
    password: 'Valid-password1!',
  };

  describe('RegisterDto', () => {
    it('accepts a valid payload and normalizes username/email', async () => {
      const dto = toDto(RegisterDto, {
        ...validRegister,
        username: ' Valid_User-1 ',
        email: 'User@Example.com',
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.username).toBe('valid_user-1');
      expect(dto.email).toBe('user@example.com');
    });

    it('rejects malformed usernames', async () => {
      for (const username of ['ab', 'a'.repeat(31), 'bad name', 'UPPER!', '']) {
        const dto = toDto(RegisterDto, { ...validRegister, username });
        const errors = await validate(dto);
        expect(errors.some((error) => error.property === 'username')).toBe(true);
      }
    });

    it('rejects invalid emails', async () => {
      const dto = toDto(RegisterDto, { ...validRegister, email: 'not-an-email' });
      const errors = await validate(dto);
      expect(errors.some((error) => error.property === 'email')).toBe(true);
    });

    it('enforces length and character classes for passwords', async () => {
      const invalidPasswords = [
        'Short1!',
        'alllowercase123!',
        'ALLUPPERCASE123!',
        'NoDigitsHere!!!',
        'NoSymbolsHere123',
        'A'.repeat(129) + '1!',
      ];
      for (const password of invalidPasswords) {
        const dto = toDto(RegisterDto, { ...validRegister, password });
        const errors = await validate(dto);
        expect(errors.some((error) => error.property === 'password')).toBe(true);
      }
    });

    it('limits displayName length and allows omission', async () => {
      const withoutName = toDto(RegisterDto, validRegister);
      await expect(validate(withoutName)).resolves.toHaveLength(0);

      const tooLong = toDto(RegisterDto, { ...validRegister, displayName: 'a'.repeat(81) });
      const errors = await validate(tooLong);
      expect(errors.some((error) => error.property === 'displayName')).toBe(true);
    });
  });

  describe('LoginDto', () => {
    it('accepts a valid payload and normalizes the identifier', async () => {
      const dto = toDto(LoginDto, { identifier: ' User@Example.com ', password: 'anything' });
      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.identifier).toBe('user@example.com');
    });

    it('requires identifier and password', async () => {
      const errors = await validate(toDto(LoginDto, {}));
      expect(errors.map((error) => error.property).sort()).toEqual(['identifier', 'password']);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('requires a valid email', async () => {
      await expect(validate(toDto(ForgotPasswordDto, { email: 'user@example.com' }))).resolves.toHaveLength(0);
      const errors = await validate(toDto(ForgotPasswordDto, { email: 'nope' }));
      expect(errors.some((error) => error.property === 'email')).toBe(true);
    });
  });

  describe('ResetPasswordDto', () => {
    it('requires a token and a strong password', async () => {
      await expect(
        validate(toDto(ResetPasswordDto, { token: 'reset-token', password: 'Valid-password1!' })),
      ).resolves.toHaveLength(0);

      const errors = await validate(toDto(ResetPasswordDto, { token: '', password: 'weak' }));
      expect(errors.map((error) => error.property).sort()).toEqual(['password', 'token']);
    });
  });

  describe('query DTOs', () => {
    it('normalizes and validates check-username input', async () => {
      const dto = toDto(CheckUsernameDto, { username: ' SomeUser ' });
      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.username).toBe('someuser');

      const errors = await validate(toDto(CheckUsernameDto, { username: '' }));
      expect(errors.some((error) => error.property === 'username')).toBe(true);
    });

    it('normalizes and validates check-email input', async () => {
      const dto = toDto(CheckEmailDto, { email: 'Some@Example.com' });
      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.email).toBe('some@example.com');

      const errors = await validate(toDto(CheckEmailDto, { email: 'bad' }));
      expect(errors.some((error) => error.property === 'email')).toBe(true);
    });
  });
});
