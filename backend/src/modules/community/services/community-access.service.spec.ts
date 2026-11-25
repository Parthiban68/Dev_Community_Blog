import { Channel } from '../entities/channel.entity';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { CommunityAccessService } from './community-access.service';

describe('CommunityAccessService', () => {
  const communityFindByPk = jest.fn();
  const communityFindOne = jest.fn();
  const memberFindOne = jest.fn();
  const memberFindAll = jest.fn();
  const channelFindByPk = jest.fn();
  const channelMemberFindOne = jest.fn();

  const communityModel = {
    findByPk: communityFindByPk,
    findOne: communityFindOne,
    findAll: jest.fn(),
  } as unknown as typeof Community;
  const memberModel = {
    findOne: memberFindOne,
    findAll: memberFindAll,
  } as unknown as typeof CommunityMember;
  const channelModel = { findByPk: channelFindByPk } as unknown as typeof Channel;
  const channelMemberModel = {
    findOne: channelMemberFindOne,
  } as unknown as typeof ChannelMember;

  let service: CommunityAccessService;

  function makeCommunity(visibility: 'public' | 'private' = 'private'): Community {
    return { id: 'community-id', visibility } as unknown as Community;
  }

  function makeMembership(role: 'owner' | 'admin' | 'moderator' | 'member' = 'member') {
    return {
      id: 'membership-id',
      communityId: 'community-id',
      userId: 'user-id',
      role,
    } as unknown as CommunityMember;
  }

  function makeChannel(visibility: 'public' | 'private' = 'public'): Channel {
    return {
      id: 'channel-id',
      communityId: 'community-id',
      visibility,
    } as unknown as Channel;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommunityAccessService(communityModel, memberModel, channelModel, channelMemberModel);
  });

  it('blocks channel access when the user is not a community member', async () => {
    memberFindOne.mockResolvedValue(null);

    await expect(service.requireChannelAccess(makeChannel(), 'outsider-id')).rejects.toThrow(
      'You must be a member of this community.',
    );
    expect(channelMemberFindOne).not.toHaveBeenCalled();
  });

  it('requires channel membership for private channels and regular members', async () => {
    memberFindOne.mockResolvedValue(makeMembership());
    channelMemberFindOne.mockResolvedValue(null);

    await expect(service.requireChannelAccess(makeChannel('private'), 'user-id')).rejects.toThrow(
      'You must be a member of this private channel.',
    );
    expect(channelMemberFindOne).toHaveBeenCalledWith({
      where: { channelId: 'channel-id', userId: 'user-id' },
    });
  });

  it('lets community admins read private channels without channel membership', async () => {
    memberFindOne.mockResolvedValue(makeMembership('admin'));

    const result = await service.requireChannelAccess(makeChannel('private'), 'user-id');

    expect(result.role).toBe('admin');
    expect(channelMemberFindOne).not.toHaveBeenCalled();
  });

  it('blocks private community detail for nonmembers but allows public detail', async () => {
    memberFindOne.mockResolvedValue(null);
    await expect(
      service.requireCommunityReadAccess(makeCommunity('private'), 'outsider-id'),
    ).rejects.toThrow('This community is private.');

    await expect(
      service.requireCommunityReadAccess(makeCommunity('public'), 'outsider-id'),
    ).resolves.toBeNull();
  });

  it('rejects a role requirement below the configured minimum', async () => {
    memberFindOne.mockResolvedValue(makeMembership('member'));

    await expect(service.requireRole('community-id', 'user-id', 'admin')).rejects.toThrow(
      'Your community role does not allow this action.',
    );
    expect(memberFindOne).toHaveBeenCalledWith({
      where: { communityId: 'community-id', userId: 'user-id' },
    });
  });
});
