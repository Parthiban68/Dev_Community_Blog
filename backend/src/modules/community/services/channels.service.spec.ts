import { ForbiddenException } from '@nestjs/common';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { ChannelResource } from '../entities/channel-resource.entity';
import { CommunityAccessService } from './community-access.service';
import { ChannelsService } from './channels.service';

describe('ChannelsService', () => {
  const requireRole = jest.fn();
  const getChannelById = jest.fn();
  const requireChannelAccess = jest.fn();
  const getCommunityById = jest.fn();
  const requireMembership = jest.fn();
  const channelCreate = jest.fn();
  const channelFindAll = jest.fn();
  const channelMemberFindAll = jest.fn();
  const resourceFindAll = jest.fn();

  const access = {
    requireRole,
    getChannelById,
    requireChannelAccess,
    getCommunityById,
    requireMembership,
  } as unknown as CommunityAccessService;
  const channelModel = {
    create: channelCreate,
    findAll: channelFindAll,
  } as unknown as typeof Channel;
  const channelMemberModel = {
    findAll: channelMemberFindAll,
  } as unknown as typeof ChannelMember;
  const resourceModel = { findAll: resourceFindAll } as unknown as typeof ChannelResource;

  let service: ChannelsService;

  function makeChannel(): Channel {
    return {
      id: 'channel-id',
      communityId: 'community-id',
      name: 'General Help',
      slug: 'general-help',
      description: null,
      type: 'text',
      visibility: 'public',
      createdByUserId: 'user-id',
      createdAt: new Date('2026-11-24T10:00:00.000Z'),
      updatedAt: new Date('2026-11-24T10:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Channel;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChannelsService(access, channelModel, channelMemberModel, resourceModel);
  });

  it('lets admins create channels but blocks regular members', async () => {
    requireRole.mockResolvedValue({ role: 'admin' });
    channelCreate.mockResolvedValue(makeChannel());

    await expect(
      service.createChannel('community-id', 'admin-id', { name: 'General Help' }),
    ).resolves.toMatchObject({ slug: 'general-help' });
    expect(requireRole).toHaveBeenCalledWith('community-id', 'admin-id', 'admin');

    requireRole.mockRejectedValue(new ForbiddenException('Your community role does not allow this action.'));
    await expect(
      service.createChannel('community-id', 'member-id', { name: 'General Help' }),
    ).rejects.toThrow('Your community role does not allow this action.');
    expect(channelCreate).toHaveBeenCalledTimes(1);
  });

  it('lets moderators update channels but blocks regular members', async () => {
    const channel = makeChannel();
    getChannelById.mockResolvedValue(channel);
    requireRole.mockResolvedValue({ role: 'moderator' });

    await expect(
      service.updateChannel('channel-id', 'moderator-id', { name: 'Renamed Channel' }),
    ).resolves.toMatchObject({ name: 'Renamed Channel' });
    expect(requireRole).toHaveBeenCalledWith('community-id', 'moderator-id', 'moderator');
    expect(channel.save).toHaveBeenCalledTimes(1);

    requireRole.mockRejectedValue(new ForbiddenException('Your community role does not allow this action.'));
    await expect(
      service.updateChannel('channel-id', 'member-id', { name: 'Denied' }),
    ).rejects.toThrow('Your community role does not allow this action.');
    expect(channel.save).toHaveBeenCalledTimes(1);
  });

  it('requires community membership before listing channels', async () => {
    requireMembership.mockRejectedValue(new ForbiddenException('You must be a member of this community.'));

    await expect(service.listForCommunity('community-id', 'outsider-id')).rejects.toThrow(
      'You must be a member of this community.',
    );
    expect(channelFindAll).not.toHaveBeenCalled();
  });

  it('returns only safe resource fields', async () => {
    getChannelById.mockResolvedValue(makeChannel());
    requireChannelAccess.mockResolvedValue({ channel: makeChannel(), role: 'member' });
    resourceFindAll.mockResolvedValue([
      {
        id: 'resource-id',
        channelId: 'channel-id',
        type: 'link',
        title: 'MDN',
        url: 'https://developer.mozilla.org/',
        source: 'MDN',
        sharedByUserId: 'user-id',
        createdAt: new Date('2026-11-24T10:00:00.000Z'),
      },
    ]);

    const resources = await service.listResources('channel-id', 'user-id', {});

    expect(resources[0]).toEqual({
      id: 'resource-id',
      channelId: 'channel-id',
      type: 'link',
      title: 'MDN',
      url: 'https://developer.mozilla.org/',
      source: 'MDN',
      sharedByUserId: 'user-id',
      createdAt: '2026-11-24T10:00:00.000Z',
    });
  });
});
