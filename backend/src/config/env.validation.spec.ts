import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('converts SWAGGER_ENABLED string values to booleans', () => {
    const enabled = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '3000',
      DB_PORT: '5432',
      THROTTLE_TTL: '60000',
      THROTTLE_LIMIT: '100',
      SWAGGER_ENABLED: 'true',
    });
    const disabled = validateEnvironment({ SWAGGER_ENABLED: 'false' });

    expect(enabled.SWAGGER_ENABLED).toBe(true);
    expect(enabled.PORT).toBe(3000);
    expect(disabled.SWAGGER_ENABLED).toBe(false);
  });

  it('rejects invalid environment values', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'staging' })).toThrow(
      'Invalid environment configuration',
    );
  });
});
