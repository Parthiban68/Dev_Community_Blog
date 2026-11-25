import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../../auth/entities/user.entity';
import {
  COMMUNITY_ROLE_DETAILS,
  COMMUNITY_ROLES,
  CommunityRole,
} from '../community.types';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { toIso } from '../utils/community.util';
import { CommunityAccessService } from './community-access.service';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly access: CommunityAccessService,
    @InjectModel(CommunityMember) private readonly memberModel: typeof CommunityMember,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async listCommunities(userId: string) {
    const communities = await this.access.getVisibleCommunities(userId);
    return Promise.all(
      communities.map(async (community) => ({
        ...this.toCommunity(community),
        memberCount: await this.getMemberCount(community.id),
      })),
    );
  }

  async getCommunityBySlug(slug: string, userId: string) {
    const community = await this.access.getCommunityBySlug(slug);
    const role = await this.access.requireCommunityReadAccess(community, userId);
    return {
      ...this.toCommunity(community),
      role,
      memberCount: await this.getMemberCount(community.id),
    };
  }

  async listMembers(communityId: string, userId: string) {
    await this.access.requireMembership(communityId, userId);
    const memberships = await this.memberModel.findAll({
      where: { communityId },
      attributes: ['id', 'userId', 'role', 'joinedAt'],
      order: [
        ['role', 'ASC'],
        ['joinedAt', 'ASC'],
      ],
    });
    const userIds = memberships.map((membership) => membership.userId);
    const users = userIds.length
      ? await this.userModel.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        })
      : [];
    const userById = new Map(users.map((user) => [user.id, user]));

    return memberships.flatMap((membership) => {
      const user = userById.get(membership.userId);
      if (!user) {
        return [];
      }
      return [
        {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          role: membership.role,
          joinedAt: toIso(membership.joinedAt),
        },
      ];
    });
  }

  async listRoles(communityId: string, userId: string) {
    await this.access.requireMembership(communityId, userId);
    return COMMUNITY_ROLES.map((role) => ({
      role,
      label: COMMUNITY_ROLE_DETAILS[role as CommunityRole].label,
      permissions: [...COMMUNITY_ROLE_DETAILS[role as CommunityRole].permissions],
    }));
  }

  async joinCommunity(communityId: string, userId: string) {
    const community = await this.access.getCommunityById(communityId);
    if (community.visibility !== 'public') {
      throw new ForbiddenException('Private communities require an existing membership.');
    }
    const existing = await this.access.getMembership(communityId, userId);
    if (existing) {
      return { joined: true, role: existing.role };
    }
    const membership = await this.memberModel.create({
      communityId,
      userId,
      role: 'member',
      joinedAt: new Date(),
    });
    return { joined: true, role: membership.role };
  }

  async leaveCommunity(communityId: string, userId: string) {
    const membership = await this.access.getMembership(communityId, userId);
    if (!membership) {
      return { left: true };
    }
    if (membership.role === 'owner') {
      throw new ForbiddenException('Community owners cannot leave their community.');
    }
    await membership.destroy();
    return { left: true };
  }

  private async getMemberCount(communityId: string): Promise<number> {
    return this.memberModel.count({ where: { communityId } });
  }

  private toCommunity(community: Community) {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description ?? null,
      coverImageUrl: community.coverImageUrl ?? null,
      visibility: community.visibility,
      createdAt: toIso(community.createdAt),
      updatedAt: toIso(community.updatedAt),
    };
  }
}
