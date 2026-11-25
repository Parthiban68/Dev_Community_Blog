import { Inject, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuthSession } from '../modules/auth/entities/auth-session.entity';
import { OAuthAccount } from '../modules/auth/entities/oauth-account.entity';
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity';
import { User } from '../modules/auth/entities/user.entity';
import { Channel } from '../modules/community/entities/channel.entity';
import { ChannelMember } from '../modules/community/entities/channel-member.entity';
import { ChannelResource } from '../modules/community/entities/channel-resource.entity';
import { Community } from '../modules/community/entities/community.entity';
import { CommunityMember } from '../modules/community/entities/community-member.entity';
import { Message } from '../modules/community/entities/message.entity';
import { MessageReaction } from '../modules/community/entities/message-reaction.entity';
import { MessageReport } from '../modules/community/entities/message-report.entity';
import { buildDatabaseOptions } from './database.options';

let communityAssociationsRegistered = false;

function registerCommunityAssociations(): void {
  if (communityAssociationsRegistered) {
    return;
  }

  User.hasMany(CommunityMember, { as: 'communityMemberships', foreignKey: 'userId' });
  CommunityMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Community.hasMany(CommunityMember, { as: 'members', foreignKey: 'communityId' });
  CommunityMember.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });

  Community.hasMany(Channel, { as: 'channels', foreignKey: 'communityId' });
  Channel.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });
  Channel.hasMany(ChannelMember, { as: 'members', foreignKey: 'channelId' });
  ChannelMember.belongsTo(Channel, { as: 'channel', foreignKey: 'channelId' });
  User.hasMany(ChannelMember, { as: 'channelMemberships', foreignKey: 'userId' });
  ChannelMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  Channel.hasMany(Message, { as: 'messages', foreignKey: 'channelId' });
  Message.belongsTo(Channel, { as: 'channel', foreignKey: 'channelId' });
  Message.belongsTo(Message, { as: 'parentMessage', foreignKey: 'parentMessageId' });
  Message.hasMany(Message, { as: 'replies', foreignKey: 'parentMessageId' });
  User.hasMany(Message, { as: 'authoredMessages', foreignKey: 'authorId' });
  Message.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

  Message.hasMany(MessageReaction, { as: 'reactions', foreignKey: 'messageId' });
  MessageReaction.belongsTo(Message, { as: 'message', foreignKey: 'messageId' });
  User.hasMany(MessageReaction, { as: 'messageReactions', foreignKey: 'userId' });
  MessageReaction.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  Channel.hasMany(ChannelResource, { as: 'resources', foreignKey: 'channelId' });
  ChannelResource.belongsTo(Channel, { as: 'channel', foreignKey: 'channelId' });
  User.hasMany(ChannelResource, { as: 'sharedResources', foreignKey: 'sharedByUserId' });
  ChannelResource.belongsTo(User, { as: 'sharedBy', foreignKey: 'sharedByUserId' });

  Message.hasMany(MessageReport, { as: 'reports', foreignKey: 'messageId' });
  MessageReport.belongsTo(Message, { as: 'message', foreignKey: 'messageId' });
  User.hasMany(MessageReport, { as: 'filedReports', foreignKey: 'reporterUserId' });
  MessageReport.belongsTo(User, { as: 'reporter', foreignKey: 'reporterUserId' });

  communityAssociationsRegistered = true;
}

@Injectable()
class CommunityAssociationsInitializer implements OnModuleInit {
  constructor(@Inject(Sequelize) private readonly sequelize: Sequelize) {}

  onModuleInit(): void {
    if (!this.sequelize) {
      return;
    }
    registerCommunityAssociations();
  }
}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildDatabaseOptions(configService),
        models: [
          User,
          AuthSession,
          PasswordResetToken,
          OAuthAccount,
          Community,
          CommunityMember,
          Channel,
          ChannelMember,
          Message,
          MessageReaction,
          ChannelResource,
          MessageReport,
        ],
      }),
    }),
  ],
  providers: [CommunityAssociationsInitializer],
})
export class DatabaseModule {}
