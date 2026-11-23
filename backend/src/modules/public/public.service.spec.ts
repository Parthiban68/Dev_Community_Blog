import { PublicService } from './public.service';

describe('PublicService', () => {
  let service: PublicService;

  beforeEach(() => {
    service = new PublicService();
  });

  it('returns the approved landing content without invented statistics', () => {
    const platform = service.getPlatform();

    expect(platform.tagline).toBe('Build connections. Create together.');
    expect(platform.description).toContain('developers, creators and technology enthusiasts');
    expect(platform.features).toHaveLength(6);
    expect(platform.steps).toHaveLength(4);
    expect(JSON.stringify(platform)).not.toMatch(/members|active now|followers/i);
  });

  it('returns immutable landing content', () => {
    const first = service.getPlatform();
    first.features[0].title = 'Changed';

    expect(service.getPlatform().features[0].title).toBe('Connect with developers');
  });

  it('returns empty featured collections until domain modules exist', () => {
    const query = { limit: 3 };

    const communities = service.getFeaturedCommunities(query);
    const projects = service.getFeaturedProjects(query);
    const events = service.getUpcomingEvents(query);

    expect(communities).toMatchObject({ items: [], total: 0, available: false });
    expect(projects).toMatchObject({ items: [], total: 0, available: false });
    expect(events).toMatchObject({ items: [], total: 0, available: false });
    expect(communities.message).toContain('community records are available');
    expect(projects.message).toContain('project records are available');
    expect(events.message).toContain('event records are available');
  });
});
