import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicFeaturedQueryDto } from './dto/public-featured-query.dto';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get public landing page content' })
  @ApiOkResponse({ description: 'Public platform information and landing content.' })
  getPlatform() {
    return this.publicService.getPlatform();
  }

  @Get('communities/featured')
  @ApiOperation({ summary: 'Get featured communities' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 12 })
  @ApiOkResponse({ description: 'Database-backed featured communities when available.' })
  getFeaturedCommunities(@Query() query: PublicFeaturedQueryDto) {
    return this.publicService.getFeaturedCommunities(query);
  }

  @Get('projects/featured')
  @ApiOperation({ summary: 'Get featured projects' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 12 })
  @ApiOkResponse({ description: 'Database-backed featured projects when available.' })
  getFeaturedProjects(@Query() query: PublicFeaturedQueryDto) {
    return this.publicService.getFeaturedProjects(query);
  }

  @Get('events/upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 12 })
  @ApiOkResponse({ description: 'Database-backed upcoming events when available.' })
  getUpcomingEvents(@Query() query: PublicFeaturedQueryDto) {
    return this.publicService.getUpcomingEvents(query);
  }
}
