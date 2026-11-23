import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';

describe('UsersService', () => {
  const findByPk = jest.fn();
  const userModel = { findByPk } as unknown as typeof User;
  let service: UsersService;

  function createUser(onboardingCompleted = false): User {
    return {
      id: 'user-id',
      username: 'ada',
      email: 'ada@example.com',
      passwordHash: 'hash',
      displayName: 'Ada',
      bio: null,
      avatarUrl: null,
      status: 'active',
      emailVerifiedAt: null,
      onboardingCompleted,
      createdAt: new Date('2026-11-23T00:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as User;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(userModel);
  });

  it('returns the current user without password data', async () => {
    const user = createUser();
    findByPk.mockResolvedValue(user);

    const result = await service.getMe('user-id');

    expect(result).toMatchObject({
      id: 'user-id',
      username: 'ada',
      onboardingCompleted: false,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(findByPk).toHaveBeenCalledWith('user-id');
  });

  it('marks onboarding complete and is idempotent', async () => {
    const user = createUser();
    findByPk.mockResolvedValue(user);

    const first = await service.completeOnboarding('user-id');
    const second = await service.completeOnboarding('user-id');

    expect(first.onboardingCompleted).toBe(true);
    expect(second.onboardingCompleted).toBe(true);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it('rejects inactive users', async () => {
    const user = createUser();
    user.status = 'disabled';
    findByPk.mockResolvedValue(user);

    await expect(service.getMe('user-id')).rejects.toThrow('Account is not active.');
    expect(user.save).not.toHaveBeenCalled();
  });
});
