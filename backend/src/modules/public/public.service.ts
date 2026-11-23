import { Injectable } from '@nestjs/common';
import { PublicFeaturedQueryDto } from './dto/public-featured-query.dto';
import { FeaturedCollection, PlatformInfo } from './public.types';
import { emptyFeaturedCollection, platformContent } from './static-content';

@Injectable()
export class PublicService {
  getPlatform(): PlatformInfo {
    return JSON.parse(JSON.stringify(platformContent)) as PlatformInfo;
  }

  getFeaturedCommunities(_query: PublicFeaturedQueryDto): FeaturedCollection {
    return emptyFeaturedCollection(
      'Featured communities will appear here when community records are available.',
      'Community directory is being prepared',
    );
  }

  getFeaturedProjects(_query: PublicFeaturedQueryDto): FeaturedCollection {
    return emptyFeaturedCollection(
      'Featured projects will appear here when project records are available.',
      'Project directory is being prepared',
    );
  }

  getUpcomingEvents(_query: PublicFeaturedQueryDto): FeaturedCollection {
    return emptyFeaturedCollection(
      'Upcoming events will appear here when event records are available.',
      'Event calendar is being prepared',
    );
  }
}
