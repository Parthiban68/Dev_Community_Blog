import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('PublicController', () => {
  it('delegates every public endpoint to the service', () => {
    const service = {
      getPlatform: jest.fn().mockReturnValue({ tagline: 'Build connections. Create together.' }),
      getFeaturedCommunities: jest.fn().mockReturnValue({ items: [] }),
      getFeaturedProjects: jest.fn().mockReturnValue({ items: [] }),
      getUpcomingEvents: jest.fn().mockReturnValue({ items: [] }),
    } as unknown as PublicService;
    const controller = new PublicController(service);
    const query = { limit: 4 };

    expect(controller.getPlatform()).toEqual({ tagline: 'Build connections. Create together.' });
    expect(controller.getFeaturedCommunities(query)).toEqual({ items: [] });
    expect(controller.getFeaturedProjects(query)).toEqual({ items: [] });
    expect(controller.getUpcomingEvents(query)).toEqual({ items: [] });
    expect(service.getPlatform).toHaveBeenCalledTimes(1);
    expect(service.getFeaturedCommunities).toHaveBeenCalledWith(query);
    expect(service.getFeaturedProjects).toHaveBeenCalledWith(query);
    expect(service.getUpcomingEvents).toHaveBeenCalledWith(query);
  });
});
