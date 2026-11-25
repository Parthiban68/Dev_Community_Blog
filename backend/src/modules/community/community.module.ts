import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthJwtModule } from '../auth/auth-jwt.module';
import { User } from '../auth/entities/user.entity';
import { CommunitiesController } from './controllers/communities.controller';
import { ChannelsController } from './controllers/channels.controller';
import { MessagesController } from './controllers/messages.controller';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelResource } from './entities/channel-resource.entity';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReport } from './entities/message-report.entity';
import { ChannelsService } from './services/channels.service';
import { CommunitiesService } from './services/communities.service';
import { CommunityAccessService } from './services/community-access.service';
import { MessagesService } from './services/messages.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Community,
      CommunityMember,
      Channel,
      ChannelMember,
      Message,
      MessageReaction,
      ChannelResource,
      MessageReport,
    ]),
    AuthJwtModule,
  ],
  controllers: [CommunitiesController, ChannelsController, MessagesController],
  providers: [CommunityAccessService, CommunitiesService, ChannelsService, MessagesService],
  exports: [CommunityAccessService, CommunitiesService, ChannelsService, MessagesService],
})
export class CommunityModule {}
