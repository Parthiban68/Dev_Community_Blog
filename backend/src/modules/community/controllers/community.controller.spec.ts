import { BadRequestException } from '@nestjs/common';
import { JwtPayload } from '../../auth/auth.types';
import { CommunitiesController } from '../controllers/communities.controller';
import { ChannelsController } from '../controllers/channels.controller';
import { MessagesController } from '../controllers/messages.controller';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { CreateReactionDto } from '../dto/create-reaction.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { MessageHistoryQueryDto } from '../dto/message-history-query.dto';
import { ReactionLookupDto } from '../dto/reaction-lookup.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import { UpdateChannelDto } from '../dto/update-channel.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { ChannelsService } from '../services/channels.service';
import { CommunitiesService } from '../services/communities.service';
import { MessagesService } from '../services/messages.service';

describe('community controllers', () => {
  const communitiesService = {
    listCommunities: jest.fn(),
    getCommunityBySlug: jest.fn(),
    listMembers: jest.fn(),
    listRoles: jest.fn(),
    joinCommunity: jest.fn(),
    leaveCommunity: jest.fn(),
  };
  const channelsService = {
    listForCommunity: jest.fn(),
    createChannel: jest.fn(),
    getChannel: jest.fn(),
    updateChannel: jest.fn(),
    listMessages: jest.fn(),
    listResources: jest.fn(),
    createMessage: jest.fn(),
  };
  const messagesService = {
    listMessages: jest.fn(),
    createMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
    listReplies: jest.fn(),
    createReply: jest.fn(),
    reportMessage: jest.fn(),
  };
  const user: JwtPayload = { sub: 'user-id', username: 'ada', email: 'ada@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates community endpoints with the current user id', async () => {
    const controller = new CommunitiesController(
      communitiesService as unknown as CommunitiesService,
      channelsService as unknown as ChannelsService,
    );
    const channelDto = { name: 'General Help' } as CreateChannelDto;

    await controller.list(user);
    await controller.getBySlug('frontend-developers-learning', user);
    await controller.listMembers('community-id', user);
    await controller.listChannels('community-id', user);
    await controller.join('community-id', user);
    await controller.leave('community-id', user);
    await controller.listRoles('community-id', user);
    await controller.createChannel('community-id', channelDto, user);

    expect(communitiesService.listCommunities).toHaveBeenCalledWith('user-id');
    expect(communitiesService.getCommunityBySlug).toHaveBeenCalledWith(
      'frontend-developers-learning',
      'user-id',
    );
    expect(communitiesService.listMembers).toHaveBeenCalledWith('community-id', 'user-id');
    expect(channelsService.listForCommunity).toHaveBeenCalledWith('community-id', 'user-id');
    expect(communitiesService.joinCommunity).toHaveBeenCalledWith('community-id', 'user-id');
    expect(communitiesService.leaveCommunity).toHaveBeenCalledWith('community-id', 'user-id');
    expect(communitiesService.listRoles).toHaveBeenCalledWith('community-id', 'user-id');
    expect(channelsService.createChannel).toHaveBeenCalledWith('community-id', 'user-id', channelDto);
  });

  it('delegates channel endpoints with validated query and body objects', async () => {
    const controller = new ChannelsController(
      channelsService as unknown as ChannelsService,
      messagesService as unknown as MessagesService,
    );
    const updateDto = { name: 'Renamed' } as UpdateChannelDto;
    const historyQuery = { limit: 10 } as MessageHistoryQueryDto;
    const messageDto = { body: 'Hello' } as CreateMessageDto;
    const resourceQuery = { type: 'link' } as ResourceQueryDto;

    await controller.getChannel('channel-id', user);
    await controller.updateChannel('channel-id', updateDto, user);
    await controller.listMessages('channel-id', historyQuery, user);
    await controller.createMessage('channel-id', messageDto, user);
    await controller.listResources('channel-id', resourceQuery, user);

    expect(channelsService.getChannel).toHaveBeenCalledWith('channel-id', 'user-id');
    expect(channelsService.updateChannel).toHaveBeenCalledWith('channel-id', 'user-id', updateDto);
    expect(messagesService.listMessages).toHaveBeenCalledWith('channel-id', 'user-id', historyQuery);
    expect(messagesService.createMessage).toHaveBeenCalledWith('channel-id', 'user-id', messageDto);
    expect(channelsService.listResources).toHaveBeenCalledWith(
      'channel-id',
      'user-id',
      resourceQuery,
    );
  });

  it('delegates message endpoints and requires an emoji when removing reactions', async () => {
    const controller = new MessagesController(messagesService as unknown as MessagesService);
    const updateDto = { body: 'Edited' } as UpdateMessageDto;
    const reactionDto = { emoji: '👍' } as CreateReactionDto;
    const replyDto = { body: 'Reply' } as CreateReplyDto;
    const reportDto = { reason: 'Spam' } as CreateReportDto;

    await controller.editMessage('message-id', updateDto, user);
    await controller.deleteMessage('message-id', user);
    await controller.addReaction('message-id', reactionDto, user);
    await controller.removeReaction('message-id', { emoji: '🎉' }, { emoji: '👍' }, user);
    await controller.listReplies('message-id', user);
    await controller.createReply('message-id', replyDto, user);
    await controller.reportMessage('message-id', reportDto, user);

    expect(messagesService.editMessage).toHaveBeenCalledWith('message-id', 'user-id', updateDto);
    expect(messagesService.deleteMessage).toHaveBeenCalledWith('message-id', 'user-id');
    expect(messagesService.addReaction).toHaveBeenCalledWith('message-id', 'user-id', '👍');
    expect(messagesService.removeReaction).toHaveBeenCalledWith('message-id', 'user-id', '👍');
    expect(messagesService.listReplies).toHaveBeenCalledWith('message-id', 'user-id');
    expect(messagesService.createReply).toHaveBeenCalledWith('message-id', 'user-id', replyDto);
    expect(messagesService.reportMessage).toHaveBeenCalledWith('message-id', 'user-id', reportDto);

    const emptyReaction = {} as ReactionLookupDto;
    expect(() =>
      controller.removeReaction('message-id', emptyReaction, emptyReaction, user),
    ).toThrow(BadRequestException);
  });
});
