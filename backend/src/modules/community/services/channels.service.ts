import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError, WhereOptions } from 'sequelize';
import { hasCommunityRole } from '../community.types';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import { UpdateChannelDto } from '../dto/update-channel.dto';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { ChannelResource } from '../entities/channel-resource.entity';
import { slugify, toIso } from '../utils/community.util';
import { CommunityAccessService } from './community-access.service';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly access: CommunityAccessService,
    @InjectModel(Channel) private readonly channelModel: typeof Channel,
    @InjectModel(ChannelMember) private readonly channelMemberModel: typeof ChannelMember,
    @InjectModel(ChannelResource) private readonly resourceModel: typeof ChannelResource,
  ) {}

  async listForCommunity(communityId: string, userId: string) {
    await this.access.getCommunityById(communityId);
    const membership = await this.access.requireMembership(communityId, userId);
    let where: WhereOptions = { communityId };

    if (!hasCommunityRole(membership.role, 'admin')) {
      const channelMemberships = await this.channelMemberModel.findAll({
        attributes: ['channelId'],
        where: { userId },
      });
      const channelIds = channelMemberships.map((entry) => entry.channelId);
      where = {
        communityId,
        [Op.or]: [{ visibility: 'public' }, { id: { [Op.in]: channelIds } }],
      };
    }

    const channels = await this.channelModel.findAll({ where, order: [['createdAt', 'ASC']] });
    return channels.map((channel) => this.toChannel(channel));
  }

  async createChannel(communityId: string, userId: string, dto: CreateChannelDto) {
    await this.access.requireRole(communityId, userId, 'admin');
    try {
      const channel = await this.channelModel.create({
        communityId,
        name: dto.name,
        slug: dto.slug ?? slugify(dto.name),
        description: dto.description ?? null,
        type: dto.type ?? 'text',
        visibility: dto.visibility ?? 'public',
        createdByUserId: userId,
      });
      return this.toChannel(channel);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('A channel with that slug already exists.');
      }
      throw error;
    }
  }

  async updateChannel(channelId: string, userId: string, dto: UpdateChannelDto) {
    const channel = await this.access.getChannelById(channelId);
    await this.access.requireRole(channel.communityId, userId, 'moderator');

    if (dto.name !== undefined) {
      channel.name = dto.name;
    }
    if (dto.slug !== undefined) {
      channel.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      channel.description = dto.description ?? null;
    }
    if (dto.type !== undefined) {
      channel.type = dto.type;
    }
    if (dto.visibility !== undefined) {
      channel.visibility = dto.visibility;
    }

    try {
      await channel.save();
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('A channel with that slug already exists.');
      }
      throw error;
    }
    return this.toChannel(channel);
  }

  async getChannel(channelId: string, userId: string) {
    const channel = await this.access.getChannelById(channelId);
    await this.access.requireChannelAccess(channel, userId);
    return this.toChannel(channel);
  }

  async listResources(channelId: string, userId: string, query: ResourceQueryDto) {
    const channel = await this.access.getChannelById(channelId);
    await this.access.requireChannelAccess(channel, userId);
    const pattern = query.search ? `%${query.search}%` : undefined;
    const where: WhereOptions = {
      channelId,
      ...(query.type ? { type: query.type } : {}),
      ...(pattern
        ? {
            [Op.or]: [{ title: { [Op.iLike]: pattern } }, { source: { [Op.iLike]: pattern } }],
          }
        : {}),
    };
    const resources = await this.resourceModel.findAll({
      where,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });
    return resources.map((resource) => ({
      id: resource.id,
      channelId: resource.channelId,
      type: resource.type,
      title: resource.title,
      url: resource.url,
      source: resource.source ?? null,
      sharedByUserId: resource.sharedByUserId,
      createdAt: toIso(resource.createdAt),
    }));
  }

  private toChannel(channel: Channel) {
    return {
      id: channel.id,
      communityId: channel.communityId,
      name: channel.name,
      slug: channel.slug,
      description: channel.description ?? null,
      type: channel.type,
      visibility: channel.visibility,
      createdByUserId: channel.createdByUserId,
      createdAt: toIso(channel.createdAt),
      updatedAt: toIso(channel.updatedAt),
    };
  }
}
