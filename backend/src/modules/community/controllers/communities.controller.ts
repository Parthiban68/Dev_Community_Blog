import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { ChannelsService } from '../services/channels.service';
import { CommunitiesService } from '../services/communities.service';

@ApiTags('communities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List communities visible to the current user' })
  @ApiOkResponse({ description: 'Public communities and private communities the user joined.' })
  list(@CurrentUser() user: JwtPayload) {
    return this.communitiesService.listCommunities(user.sub);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get community detail by slug' })
  @ApiParam({ name: 'slug', example: 'frontend-developers-learning' })
  @ApiOkResponse({ description: 'Community detail including the current user role.' })
  getBySlug(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.getCommunityBySlug(slug, user.sub);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List safe community member profiles' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'Member profiles without email or account credentials.' })
  listMembers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.listMembers(id, user.sub);
  }

  @Get(':id/channels')
  @ApiOperation({ summary: 'List channels visible to the current user' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'Public channels and private channels the user can access.' })
  listChannels(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.channelsService.listForCommunity(id, user.sub);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a public community' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiCreatedResponse({ description: 'The user is now a community member.' })
  join(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.joinCommunity(id, user.sub);
  }

  @Delete(':id/join')
  @ApiOperation({ summary: 'Leave a community' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'The user is no longer a community member.' })
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.leaveCommunity(id, user.sub);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'List community roles with labels and permissions' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'Community roles derived from community_members.role.' })
  listRoles(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.listRoles(id, user.sub);
  }

  @Post(':id/channels')
  @ApiOperation({ summary: 'Create a community channel' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateChannelDto })
  @ApiCreatedResponse({ description: 'The channel was created.' })
  createChannel(
    @Param('id') id: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.channelsService.createChannel(id, user.sub, dto);
  }
}
