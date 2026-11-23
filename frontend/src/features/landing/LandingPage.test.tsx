import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { refreshSession } from '../auth/auth.service';
import type { FeaturedCollection, PlatformInfo } from '../../types/landing';
import { LandingPage } from './LandingPage';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../../lib/api', () => ({
  apiClient: { get: getMock },
  registerAuthRefreshHandler: vi.fn(),
}));

vi.mock('../auth/auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

const platform: PlatformInfo = {
  name: 'devcommons',
  tagline: 'Build connections. Create together.',
  description:
    'A community for developers, creators and technology enthusiasts to share knowledge, discover opportunities and build meaningful projects.',
  positioning: 'One global community.',
  introduction: {
    eyebrow: 'One community',
    title: 'Learn and build together.',
    description: 'A focused home for technical growth.',
    pillars: [{ title: 'Share', description: 'Share what you learn.' }],
  },
  features: [
    { id: 'connect', title: 'Connect', description: 'Meet developers.', icon: 'Users' },
    { id: 'share', title: 'Share', description: 'Write posts.', icon: 'BookOpen' },
    { id: 'questions', title: 'Ask', description: 'Ask questions.', icon: 'MessageSquare' },
    { id: 'build', title: 'Build', description: 'Collaborate.', icon: 'GitPullRequest' },
    { id: 'communities', title: 'Join', description: 'Join groups.', icon: 'Layers' },
    { id: 'discover', title: 'Discover', description: 'Find people.', icon: 'Compass' },
  ],
  steps: [{ number: '01', title: 'Create', description: 'Create a profile.' }],
  cta: {
    title: 'Start building',
    description: 'Join the community.',
    primaryLabel: 'Join the community',
    primaryHref: '/register',
    secondaryLabel: 'Explore projects',
    secondaryHref: '/projects',
  },
};

function emptyCollection(emptyLabel: string, message: string): FeaturedCollection {
  return { items: [], total: 0, available: false, message, emptyLabel };
}

function renderLandingPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    getMock.mockReset();
    getMock.mockImplementation(async (path: string) => {
      if (path === '/public/platform') {
        return { data: { records: platform } };
      }

      if (path.startsWith('/public/communities/featured')) {
        return {
          data: {
            records: emptyCollection(
              'Community directory is being prepared',
              'Featured communities will appear here when community records are available.',
            ),
          },
        };
      }

      if (path.startsWith('/public/projects/featured')) {
        return {
          data: {
            records: emptyCollection(
              'Project directory is being prepared',
              'Featured projects will appear here when project records are available.',
            ),
          },
        };
      }

      if (path.startsWith('/public/events/upcoming')) {
        return {
          data: {
            records: emptyCollection(
              'Event calendar is being prepared',
              'Upcoming events will appear here when event records are available.',
            ),
          },
        };
      }

      throw new Error(`Unexpected API path: ${path}`);
    });
  });

  it('renders API-driven content and honest empty states', async () => {
    renderLandingPage();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Build connections. Create together.',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Community directory is being prepared')).toBeInTheDocument();
    expect(await screen.findByText('Project directory is being prepared')).toBeInTheDocument();
    expect(await screen.findByText('Event calendar is being prepared')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Join the community/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+ members/i)).not.toBeInTheDocument();
  });

  it('shows a retry state without fabricating content when the API fails', async () => {
    getMock.mockRejectedValue(new Error('Network error'));
    renderLandingPage();

    expect(
      await screen.findByRole('heading', { name: 'The landing content could not be loaded' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 1,
        name: 'Build connections. Create together.',
      }),
    ).not.toBeInTheDocument();
  });
});
