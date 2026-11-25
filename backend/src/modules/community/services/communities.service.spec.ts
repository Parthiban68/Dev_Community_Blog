import { User } from '../../auth/entities/user.entity';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunitiesService } from './communities.service';

describe('CommunitiesService', () => {
  const requireMembership = jest.fn();
  const getCommunityById = jest.fn();
  const getMembership = jest.fn();
  const memberFindAll = jest.fn();
  const memberFindOne = jest.fn();
  const memberCreate = jest.fn();
  const memberCount = jest.fn();
  const getVisibleCommunities = jest.fn();
  const getCommunityBySlug = jest.fn();
  const requireCommunityReadAccess = jest.fn();
  const userFindAll = jest.fn();

  const access = {
    requireMembership,
    getCommunityById,
    getMembership,
    getVisibleCommunities,
    getCommunityBySlug,
    requireCommunityReadAccess,
  } as unknown as CommunityAccessService;
  const memberModel = {
    findAll: memberFindAll,
    findOne: memberFindOne,
    create: memberCreate,
    count: memberCount,
  } as unknown as typeof CommunityMember;
  const userModel = { findAll: userFindAll } as unknown as typeof User;

  let service: CommunitiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    requireMembership.mockResolvedValue({ role: 'member' });
    memberCount.mockResolvedValue(0);
    service = new CommunitiesService(access, memberModel, userModel);
  });

  it('includes real member counts in community listings and details', async () => {
    const community = {
      id: 'community-id',
      name: 'Frontend Developers Learning',
      slug: 'frontend-developers-learning',
      description: null,
      coverImageUrl: null,
      visibility: 'public',
      createdAt: new Date('2026-11-24T09:00:00.000Z'),
      updatedAt: new Date('2026-11-24T09:00:00.000Z'),
    } as Community;
    getVisibleCommunities.mockResolvedValue([community]);
    getCommunityBySlug.mockResolvedValue(community);
    requireCommunityReadAccess.mockResolvedValue('owner');
    memberCount.mockResolvedValue(12);

    const [listed] = await service.listCommunities('viewer-id');
    const detail = await service.getCommunityBySlug(community.slug, 'viewer-id');

    expect(listed.memberCount).toBe(12);
    expect(detail).toEqual(expect.objectContaining({ memberCount: 12, role: 'owner' }));
    expect(memberCount).toHaveBeenCalledWith({ where: { communityId: 'community-id' } });
  });

  it('returns member profiles without email or credential fields', async () => {
    memberFindAll.mockResolvedValue([
      {
        id: 'membership-id',
        userId: 'user-id',
        role: 'owner',
        joinedAt: new Date('2026-11-24T10:00:00.000Z'),
      },
    ]);
    userFindAll.mockResolvedValue([
      {
        id: 'user-id',
        username: 'ada',
        displayName: 'Ada',
        avatarUrl: null,
        email: 'ada@example.com',
        passwordHash: 'hash',
      },
    ]);

    const result = await service.listMembers('community-id', 'viewer-id');

    expect(result).toEqual([
      {
        id: 'user-id',
        username: 'ada',
        displayName: 'Ada',
        avatarUrl: null,
        role: 'owner',
        joinedAt: '2026-11-24T10:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('ada@example.com');
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(userFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ attributes: ['id', 'username', 'displayName', 'avatarUrl'] }),
    );
  });

  it('refuses to join a private community', async () => {
    getCommunityById.mockResolvedValue({ id: 'community-id', visibility: 'private' } as Community);

    await expect(service.joinCommunity('community-id', 'user-id')).rejects.toThrow(
      'Private communities require an existing membership.',
    );
    expect(memberCreate).not.toHaveBeenCalled();
  });

  it('joins a public community as a member', async () => {
    getCommunityById.mockResolvedValue({ id: 'community-id', visibility: 'public' } as Community);
    getMembership.mockResolvedValue(null);
    memberCreate.mockResolvedValue({ role: 'member' });

    const result = await service.joinCommunity('community-id', 'user-id');

    expect(result).toEqual({ joined: true, role: 'member' });
    expect(memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({ communityId: 'community-id', userId: 'user-id', role: 'member' }),
    );
  });

  it('returns role labels and permissions to members', async () => {
    const roles = await service.listRoles('community-id', 'user-id');

    expect(roles).toContainEqual({
      role: 'moderator',
      label: 'Moderator',
      permissions: expect.arrayContaining(['channels.manage', 'messages.moderate']),
    });
    expect(requireMembership).toHaveBeenCalledWith('community-id', 'user-id');
  });
});
