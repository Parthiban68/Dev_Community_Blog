import { ForbiddenException } from '@nestjs/common';
import { User } from '../../auth/entities/user.entity';
import { Channel } from '../entities/channel.entity';
import { Message } from '../entities/message.entity';
import { MessageReaction } from '../entities/message-reaction.entity';
import { MessageReport } from '../entities/message-report.entity';
import { decodeMessageCursor } from '../utils/cursor.util';
import { CommunityAccessService } from './community-access.service';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const getChannelById = jest.fn();
  const requireChannelAccess = jest.fn();
  const requireRole = jest.fn();
  const messageFindByPk = jest.fn();
  const messageFindAll = jest.fn();
  const messageCreate = jest.fn();
  const reactionFindOne = jest.fn();
  const reactionFindAll = jest.fn();
  const reactionCreate = jest.fn();
  const reportFindOne = jest.fn();
  const reportCreate = jest.fn();
  const userFindAll = jest.fn();

  const access = {
    getChannelById,
    requireChannelAccess,
    requireRole,
  } as unknown as CommunityAccessService;
  const messageModel = {
    findByPk: messageFindByPk,
    findAll: messageFindAll,
    create: messageCreate,
  } as unknown as typeof Message;
  const reactionModel = {
    findOne: reactionFindOne,
    findAll: reactionFindAll,
    create: reactionCreate,
  } as unknown as typeof MessageReaction;
  const reportModel = {
    findOne: reportFindOne,
    create: reportCreate,
  } as unknown as typeof MessageReport;
  const userModel = { findAll: userFindAll } as unknown as typeof User;

  let service: MessagesService;

  function makeMessage(overrides: Record<string, unknown> = {}): Message {
    return {
      id: 'message-id',
      channelId: 'channel-id',
      parentMessageId: null,
      authorId: 'author-id',
      body: 'Original body',
      kind: 'message',
      code: null,
      language: null,
      linkUrl: null,
      linkTitle: null,
      createdAt: new Date('2026-11-24T10:00:00.000Z'),
      updatedAt: new Date('2026-11-24T10:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as Message;
  }

  function makeReaction(overrides: Record<string, unknown> = {}): MessageReaction {
    return {
      id: 'reaction-id',
      messageId: 'message-id',
      userId: 'viewer-id',
      emoji: '👍',
      createdAt: new Date('2026-11-24T10:30:00.000Z'),
      destroy: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as MessageReaction;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getChannelById.mockResolvedValue({
      id: 'channel-id',
      communityId: 'community-id',
      visibility: 'public',
    } as Channel);
    requireChannelAccess.mockResolvedValue({ role: 'member' });
    userFindAll.mockResolvedValue([
      {
        id: 'author-id',
        username: 'ada',
        displayName: 'Ada',
        avatarUrl: null,
        email: 'ada@example.com',
      },
    ]);
    reactionFindAll.mockResolvedValue([]);
    service = new MessagesService(
      access,
      messageModel,
      reactionModel,
      reportModel,
      userModel,
    );
  });

  it('lets the author edit their own message', async () => {
    const message = makeMessage({ authorId: 'viewer-id' });
    messageFindByPk.mockResolvedValue(message);

    const result = await service.editMessage('message-id', 'viewer-id', { body: 'Edited body' });

    expect(result.body).toBe('Edited body');
    expect(message.save).toHaveBeenCalledTimes(1);
    expect(requireRole).not.toHaveBeenCalled();
  });

  it('blocks editing another member message', async () => {
    const message = makeMessage({ authorId: 'other-id' });
    messageFindByPk.mockResolvedValue(message);
    requireRole.mockRejectedValue(
      new ForbiddenException('Your community role does not allow this action.'),
    );

    await expect(
      service.editMessage('message-id', 'viewer-id', { body: 'Unauthorized edit' }),
    ).rejects.toThrow('Your community role does not allow this action.');
    expect(message.save).not.toHaveBeenCalled();
  });

  it('blocks deletion by a regular member and allows moderators', async () => {
    const memberMessage = makeMessage({ authorId: 'other-id' });
    messageFindByPk.mockResolvedValue(memberMessage);
    requireRole.mockRejectedValue(new ForbiddenException('Your community role does not allow this action.'));

    await expect(service.deleteMessage('message-id', 'viewer-id')).rejects.toThrow(
      'Your community role does not allow this action.',
    );
    expect(memberMessage.destroy).not.toHaveBeenCalled();

    const moderatorMessage = makeMessage({ authorId: 'other-id' });
    messageFindByPk.mockResolvedValue(moderatorMessage);
    requireRole.mockResolvedValue({ role: 'moderator' });

    await expect(service.deleteMessage('message-id', 'moderator-id')).resolves.toEqual({
      deleted: true,
    });
    expect(moderatorMessage.destroy).toHaveBeenCalledTimes(1);
  });

  it('adds a reaction once and reuses an existing reaction', async () => {
    messageFindByPk.mockResolvedValue(makeMessage());
    reactionFindOne.mockResolvedValueOnce(null);
    reactionCreate.mockResolvedValue(makeReaction());

    await expect(service.addReaction('message-id', 'viewer-id', '👍')).resolves.toMatchObject({
      emoji: '👍',
      messageId: 'message-id',
    });
    expect(reactionCreate).toHaveBeenCalledWith({
      messageId: 'message-id',
      userId: 'viewer-id',
      emoji: '👍',
    });

    reactionFindOne.mockResolvedValueOnce(makeReaction());
    await service.addReaction('message-id', 'viewer-id', '👍');
    expect(reactionCreate).toHaveBeenCalledTimes(1);
  });

  it("removes only the current user's matching reaction", async () => {
    const reaction = makeReaction({ userId: 'viewer-id', emoji: '👍' });
    messageFindByPk.mockResolvedValue(makeMessage());
    reactionFindOne.mockResolvedValue(reaction);

    await expect(service.removeReaction('message-id', 'viewer-id', '👍')).resolves.toEqual({
      removed: true,
      emoji: '👍',
    });
    expect(reactionFindOne).toHaveBeenCalledWith({
      where: { messageId: 'message-id', userId: 'viewer-id', emoji: '👍' },
    });
    expect(reaction.destroy).toHaveBeenCalledTimes(1);

    reactionFindOne.mockResolvedValue(null);
    await expect(service.removeReaction('message-id', 'viewer-id', '🎉')).rejects.toThrow(
      'Reaction not found.',
    );
  });

  it('returns chronological cursor pages with reactions for the viewer', async () => {
    const oldest = makeMessage({
      id: 'message-1',
      body: 'First',
      createdAt: new Date('2026-11-24T10:00:00.000Z'),
    });
    const middle = makeMessage({
      id: 'message-2',
      body: 'Second',
      createdAt: new Date('2026-11-24T10:01:00.000Z'),
    });
    const newest = makeMessage({
      id: 'message-3',
      body: 'Third',
      createdAt: new Date('2026-11-24T10:02:00.000Z'),
    });
    messageFindAll.mockResolvedValue([newest, middle, oldest]);
    reactionFindAll.mockResolvedValue([
      makeReaction({ messageId: 'message-2', userId: 'viewer-id', emoji: '👍' }),
      makeReaction({ id: 'reaction-2', messageId: 'message-2', userId: 'other-id', emoji: '👍' }),
    ]);

    const result = await service.listMessages('channel-id', 'viewer-id', { limit: 2 });

    expect(messageFindAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
    expect(result.hasMore).toBe(true);
    expect(result.items.map((item) => item.id)).toEqual(['message-2', 'message-3']);
    expect(result.nextCursor).toBeTruthy();
    expect(decodeMessageCursor(result.nextCursor as string)).toEqual({
      createdAt: middle.createdAt,
      id: 'message-2',
    });
    expect(result.items[0].reactionCounts).toEqual({ '👍': 2 });
    expect(result.items[0].viewerReactions).toEqual(['👍']);
    expect(JSON.stringify(result)).not.toContain('ada@example.com');
  });

  it('creates replies with the parent message id', async () => {
    const parent = makeMessage({ id: 'parent-id', kind: 'question' });
    messageFindByPk.mockResolvedValue(parent);
    messageCreate.mockResolvedValue(
      makeMessage({
        id: 'reply-id',
        parentMessageId: 'parent-id',
        kind: 'answer',
        body: 'Reply body',
      }),
    );

    const reply = await service.createReply('parent-id', 'viewer-id', { body: 'Reply body' });

    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ parentMessageId: 'parent-id', kind: 'answer' }),
    );
    expect(reply).toMatchObject({ id: 'reply-id', parentMessageId: 'parent-id' });
  });
});
