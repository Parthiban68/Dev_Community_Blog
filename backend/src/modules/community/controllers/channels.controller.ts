import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from '../dto/create-message.dto';
import { MessageHistoryQueryDto } from '../dto/message-history-query.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import { UpdateChannelDto } from '../dto/update-channel.dto';
import { ChannelsService } from '../services/channels.service';
import { MessagesService } from '../services/messages.service';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get channel detail' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'Channel detail for an accessible channel.' })
  getChannel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.channelsService.getChannel(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a channel' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateChannelDto })
  @ApiOkResponse({ description: 'The updated channel.' })
  updateChannel(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.channelsService.updateChannel(id, user.sub, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get cursor-paginated channel message history' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 50 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiOkResponse({ description: 'Chronological messages with nextCursor and hasMore.' })
  listMessages(
    @Param('id') id: string,
    @Query() query: MessageHistoryQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.listMessages(id, user.sub, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Post a message to a channel' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateMessageDto })
  @ApiCreatedResponse({ description: 'The created message.' })
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.createMessage(id, user.sub, dto);
  }

  @Get(':id/resources')
  @ApiOperation({ summary: 'List resources shared in a channel' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'type', required: false, enum: ['link', 'image', 'file'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ description: 'Channel resources matching the optional filters.' })
  listResources(
    @Param('id') id: string,
    @Query() query: ResourceQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.channelsService.listResources(id, user.sub, query);
  }
}
