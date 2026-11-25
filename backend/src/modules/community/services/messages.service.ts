import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { User } from '../../auth/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { MessageHistoryQueryDto } from '../dto/message-history-query.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { Message } from '../entities/message.entity';
import { MessageReaction } from '../entities/message-reaction.entity';
import { MessageReport } from '../entities/message-report.entity';
import { decodeMessageCursor, encodeMessageCursor } from '../utils/cursor.util';
import { toIso } from '../utils/community.util';
import { CommunityAccessService } from './community-access.service';

export interface SafeAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly access: CommunityAccessService,
    @InjectModel(Message) private readonly messageModel: typeof Message,
    @InjectModel(MessageReaction) private readonly reactionModel: typeof MessageReaction,
    @InjectModel(MessageReport) private readonly reportModel: typeof MessageReport,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async listMessages(channelId: string, userId: string, query: MessageHistoryQueryDto) {
    const channel = await this.access.getChannelById(channelId);
    await this.access.requireChannelAccess(channel, userId);
    const limit = query.limit ?? 30;
    const cursor = query.cursor ? decodeMessageCursor(query.cursor) : null;
    const olderThanCursor = cursor
      ? {
          [Op.or]: [
            { createdAt: { [Op.lt]: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { [Op.lt]: cursor.id } },
          ],
        }
      : {};
    const where: WhereOptions = { channelId, ...olderThanCursor };
    const rows = await this.messageModel.findAll({
      where,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const chronological = [...page].reverse();
    const items = await this.serializeMessages(chronological, userId);
    const nextCursor =
      hasMore && chronological.length > 0 ? encodeMessageCursor(chronological[0]) : null;
    return { items, nextCursor, hasMore };
  }

  async createMessage(channelId: string, userId: string, dto: CreateMessageDto) {
    const channel = await this.access.getChannelById(channelId);
    await this.access.requireChannelAccess(channel, userId);
    const message = await this.messageModel.create({
      channelId,
      parentMessageId: null,
      authorId: userId,
      body: dto.body,
      kind: dto.kind ?? 'message',
      code: dto.code ?? null,
      language: dto.language ?? null,
      linkUrl: dto.linkUrl ?? null,
      linkTitle: dto.linkTitle ?? null,
    });
    const [item] = await this.serializeMessages([message], userId);
    return item;
  }

  async editMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.loadMessage(messageId);
    await this.assertCanMutate(message, userId);

    if (dto.body !== undefined) {
      message.body = dto.body;
    }
    if (dto.kind !== undefined) {
      message.kind = dto.kind;
    }
    if (dto.code !== undefined) {
      message.code = dto.code ?? null;
    }
    if (dto.language !== undefined) {
      message.language = dto.language ?? null;
    }
    if (dto.linkUrl !== undefined) {
      message.linkUrl = dto.linkUrl ?? null;
    }
    if (dto.linkTitle !== undefined) {
      message.linkTitle = dto.linkTitle ?? null;
    }
    await message.save();
    const [item] = await this.serializeMessages([message], userId);
    return item;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.loadMessage(messageId);
    await this.assertCanMutate(message, userId);
    await message.destroy();
    return { deleted: true };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.loadMessage(messageId);
    await this.access.requireChannelAccess(
      await this.access.getChannelById(message.channelId),
      userId,
    );
    const existing = await this.reactionModel.findOne({ where: { messageId, userId, emoji } });
    if (existing) {
      return this.toReaction(existing);
    }
    const reaction = await this.reactionModel.create({ messageId, userId, emoji });
    return this.toReaction(reaction);
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.loadMessage(messageId);
    await this.access.requireChannelAccess(
      await this.access.getChannelById(message.channelId),
      userId,
    );
    const reaction = await this.reactionModel.findOne({ where: { messageId, userId, emoji } });
    if (!reaction) {
      throw new NotFoundException('Reaction not found.');
    }
    await reaction.destroy();
    return { removed: true, emoji };
  }

  async listReplies(messageId: string, userId: string) {
    const message = await this.loadMessage(messageId);
    await this.access.requireChannelAccess(
      await this.access.getChannelById(message.channelId),
      userId,
    );
    const replies = await this.messageModel.findAll({
      where: { parentMessageId: message.id },
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return this.serializeMessages(replies, userId);
  }

  async createReply(messageId: string, userId: string, dto: CreateReplyDto) {
    const parent = await this.loadMessage(messageId);
    await this.access.requireChannelAccess(
      await this.access.getChannelById(parent.channelId),
      userId,
    );
    const reply = await this.messageModel.create({
      channelId: parent.channelId,
      parentMessageId: parent.id,
      authorId: userId,
      body: dto.body,
      kind: dto.kind ?? 'answer',
      code: dto.code ?? null,
      language: dto.language ?? null,
      linkUrl: null,
      linkTitle: null,
    });
    const [item] = await this.serializeMessages([reply], userId);
    return item;
  }

  async reportMessage(messageId: string, userId: string, dto: CreateReportDto) {
    const message = await this.loadMessage(messageId);
    await this.access.requireChannelAccess(
      await this.access.getChannelById(message.channelId),
      userId,
    );
    const existing = await this.reportModel.findOne({
      where: { messageId, reporterUserId: userId },
    });
    if (existing) {
      throw new ConflictException('You have already reported this message.');
    }
    await this.reportModel.create({ messageId, reporterUserId: userId, reason: dto.reason });
    return { reported: true };
  }

  private async loadMessage(messageId: string): Promise<Message> {
    const message = await this.messageModel.findByPk(messageId);
    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    return message;
  }

  private async assertCanMutate(message: Message, userId: string): Promise<void> {
    const channel = await this.access.getChannelById(message.channelId);
    await this.access.requireChannelAccess(channel, userId);
    if (message.authorId === userId) {
      return;
    }
    await this.access.requireRole(channel.communityId, userId, 'moderator');
  }

  private async serializeMessages(messages: Message[], userId: string) {
    if (messages.length === 0) {
      return [];
    }
    const authorIds = [...new Set(messages.map((message) => message.authorId))];
    const authors = authorIds.length
      ? await this.userModel.findAll({
          where: { id: { [Op.in]: authorIds } },
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        })
      : [];
    const authorById = new Map<string, SafeAuthor>(
      authors.map((author) => [
        author.id,
        {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl ?? null,
        },
      ]),
    );

    const messageIds = messages.map((message) => message.id);
    const reactions = await this.reactionModel.findAll({
      where: { messageId: { [Op.in]: messageIds } },
      attributes: ['id', 'messageId', 'userId', 'emoji', 'createdAt'],
    });
    const reactionCounts: Record<string, Record<string, number>> = {};
    const viewerReactions: Record<string, string[]> = {};
    for (const message of messages) {
      reactionCounts[message.id] = {};
      viewerReactions[message.id] = [];
    }
    for (const reaction of reactions) {
      const counts = reactionCounts[reaction.messageId];
      const viewer = viewerReactions[reaction.messageId];
      if (!counts || !viewer) {
        continue;
      }
      counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
      if (reaction.userId === userId && !viewer.includes(reaction.emoji)) {
        viewer.push(reaction.emoji);
      }
    }

    return messages.map((message) => {
      const author: SafeAuthor = authorById.get(message.authorId) ?? {
        id: message.authorId,
        username: 'unknown',
        displayName: 'Unknown member',
        avatarUrl: null,
      };
      return {
        id: message.id,
        channelId: message.channelId,
        parentMessageId: message.parentMessageId ?? null,
        authorId: message.authorId,
        author,
        body: message.body,
        kind: message.kind,
        code: message.code ?? null,
        language: message.language ?? null,
        linkUrl: message.linkUrl ?? null,
        linkTitle: message.linkTitle ?? null,
        reactionCounts: reactionCounts[message.id] ?? {},
        viewerReactions: viewerReactions[message.id] ?? [],
        createdAt: toIso(message.createdAt),
        updatedAt: toIso(message.updatedAt),
      };
    });
  }

  private toReaction(reaction: MessageReaction) {
    return {
      id: reaction.id,
      messageId: reaction.messageId,
      emoji: reaction.emoji,
      createdAt: toIso(reaction.createdAt),
    };
  }
}
