import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateReactionDto } from '../dto/create-reaction.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { ReactionLookupDto } from '../dto/reaction-lookup.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessagesService } from '../services/messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Edit a message the user owns or can moderate' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateMessageDto })
  @ApiOkResponse({ description: 'The edited message.' })
  editMessage(
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.editMessage(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message the user owns or can moderate' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'The message was deleted.' })
  deleteMessage(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.deleteMessage(id, user.sub);
  }

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateReactionDto })
  @ApiOkResponse({ description: 'The reaction that was added.' })
  addReaction(
    @Param('id') id: string,
    @Body() dto: CreateReactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.addReaction(id, user.sub, dto.emoji);
  }

  @Delete(':id/reactions')
  @ApiOperation({ summary: "Remove the current user's reaction from a message" })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'emoji', required: false, example: '👍' })
  @ApiBody({ type: ReactionLookupDto, required: false })
  @ApiOkResponse({ description: 'The reaction was removed.' })
  removeReaction(
    @Param('id') id: string,
    @Query() query: ReactionLookupDto,
    @Body() body: ReactionLookupDto | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const emoji = body?.emoji ?? query.emoji;
    if (!emoji) {
      throw new BadRequestException('emoji is required.');
    }
    return this.messagesService.removeReaction(id, user.sub, emoji);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'List replies for a message thread' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ description: 'Thread replies in chronological order.' })
  listReplies(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.listReplies(id, user.sub);
  }

  @Post(':id/replies')
  @ApiOperation({ summary: 'Create a reply in a message thread' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateReplyDto })
  @ApiOkResponse({ description: 'The created reply.' })
  createReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.createReply(id, user.sub, dto);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a message' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateReportDto })
  @ApiOkResponse({ description: 'The message was reported.' })
  reportMessage(
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.reportMessage(id, user.sub, dto);
  }
}
