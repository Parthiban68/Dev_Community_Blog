import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { hasCommunityRole, CommunityRole } from '../community.types';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';

@Injectable()
export class CommunityAccessService {
  constructor(
    @InjectModel(Community) private readonly communityModel: typeof Community,
    @InjectModel(CommunityMember) private readonly memberModel: typeof CommunityMember,
    @InjectModel(Channel) private readonly channelModel: typeof Channel,
    @InjectModel(ChannelMember) private readonly channelMemberModel: typeof ChannelMember,
  ) {}

  async getCommunityById(communityId: string): Promise<Community> {
    const community = await this.communityModel.findByPk(communityId);
    if (!community) {
      throw new NotFoundException('Community not found.');
    }
    return community;
  }

  async getCommunityBySlug(slug: string): Promise<Community> {
    const community = await this.communityModel.findOne({ where: { slug } });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }
    return community;
  }

  async getMembership(communityId: string, userId: string): Promise<CommunityMember | null> {
    return this.memberModel.findOne({ where: { communityId, userId } });
  }

  async requireMembership(communityId: string, userId: string): Promise<CommunityMember> {
    const membership = await this.getMembership(communityId, userId);
    if (!membership) {
      throw new ForbiddenException('You must be a member of this community.');
    }
    return membership;
  }

  async getRole(communityId: string, userId: string): Promise<CommunityRole | null> {
    const membership = await this.getMembership(communityId, userId);
    return membership ? membership.role : null;
  }

  async requireRole(
    communityId: string,
    userId: string,
    minimum: CommunityRole,
  ): Promise<CommunityMember> {
    const membership = await this.requireMembership(communityId, userId);
    if (!hasCommunityRole(membership.role, minimum)) {
      throw new ForbiddenException('Your community role does not allow this action.');
    }
    return membership;
  }

  async requireCommunityReadAccess(
    community: Community,
    userId: string,
  ): Promise<CommunityRole | null> {
    const role = await this.getRole(community.id, userId);
    if (!role && community.visibility === 'private') {
      throw new ForbiddenException('This community is private.');
    }
    return role;
  }

  async getVisibleCommunities(userId: string): Promise<Community[]> {
    const memberships = await this.memberModel.findAll({
      attributes: ['communityId'],
      where: { userId },
    });
    const communityIds = memberships.map((membership) => membership.communityId);
    const where: WhereOptions = {
      [Op.or]: [{ visibility: 'public' }, { id: { [Op.in]: communityIds } }],
    };
    return this.communityModel.findAll({ where, order: [['name', 'ASC']] });
  }

  async getChannelById(channelId: string): Promise<Channel> {
    const channel = await this.channelModel.findByPk(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }
    return channel;
  }

  async requireChannelAccess(
    channel: Channel,
    userId: string,
  ): Promise<{ channel: Channel; role: CommunityRole }> {
    const role = await this.getRole(channel.communityId, userId);
    if (!role) {
      throw new ForbiddenException('You must be a member of this community.');
    }
    if (channel.visibility !== 'private' || hasCommunityRole(role, 'admin')) {
      return { channel, role };
    }
    const channelMembership = await this.channelMemberModel.findOne({
      where: { channelId: channel.id, userId },
    });
    if (!channelMembership) {
      throw new ForbiddenException('You must be a member of this private channel.');
    }
    return { channel, role };
  }
}
