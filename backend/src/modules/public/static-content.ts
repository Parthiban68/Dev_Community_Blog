import { FeaturedCollection, PlatformInfo } from './public.types';

export const platformContent: PlatformInfo = {
  name: 'devcommons',
  tagline: 'Build connections. Create together.',
  description:
    'A community for developers, creators and technology enthusiasts to share knowledge, discover opportunities and build meaningful projects.',
  positioning: 'An independent global community with one shared home for every member.',
  introduction: {
    eyebrow: 'One community, many ways to grow',
    title: 'A place to share what you know and build what you care about.',
    description:
      'Learning is better in the open. devcommons brings practical conversations, technical communities and real projects into one focused space for people who make software.',
    pillars: [
      {
        title: 'Knowledge that compounds',
        description:
          'Ask focused questions, share hard-won lessons and keep useful answers easy to find.',
      },
      {
        title: 'Projects with purpose',
        description:
          'Meet collaborators, contribute real code and learn from teams building in the open.',
      },
      {
        title: 'People, not profiles',
        description:
          'Discover developers through the skills and interests they choose to share.',
      },
    ],
  },
  features: [
    {
      id: 'connect',
      title: 'Connect with developers',
      description:
        'Build a professional network around the technologies and ideas you care about.',
      icon: 'Users',
    },
    {
      id: 'share',
      title: 'Share knowledge',
      description:
        'Publish practical posts with clean formatting and code that is easy to read.',
      icon: 'BookOpen',
    },
    {
      id: 'questions',
      title: 'Ask and answer',
      description:
        'Work through real programming questions and help others reach a useful answer.',
      icon: 'MessageSquare',
    },
    {
      id: 'collaborate',
      title: 'Create together',
      description:
        'Find open roles on projects and contribute alongside developers from anywhere.',
      icon: 'GitPullRequest',
    },
    {
      id: 'communities',
      title: 'Join communities',
      description:
        'Follow the technologies you use and take part in focused technical discussions.',
      icon: 'Layers',
    },
    {
      id: 'discover',
      title: 'Discover developers',
      description:
        'Search by skills, experience and interests instead of scrolling through noise.',
      icon: 'Compass',
    },
  ],
  steps: [
    {
      number: '01',
      title: 'Create your profile',
      description: 'Add your skills, experience and the work you want to be known for.',
    },
    {
      number: '02',
      title: 'Find your people',
      description: 'Join communities and follow conversations that match your interests.',
    },
    {
      number: '03',
      title: 'Share what you learn',
      description: 'Write posts, answer questions and turn experience into shared knowledge.',
    },
    {
      number: '04',
      title: 'Build something together',
      description: 'Discover projects, join a team and create work that goes further.',
    },
  ],
  cta: {
    title: 'Ready to build with the community?',
    description:
      'Create your profile to connect with developers, join discussions and find your next project.',
    primaryLabel: 'Join the community',
    primaryHref: '/register',
    secondaryLabel: 'Explore projects',
    secondaryHref: '/projects',
  },
};

export function emptyFeaturedCollection(message: string, emptyLabel: string): FeaturedCollection {
  return {
    items: [],
    total: 0,
    available: false,
    message,
    emptyLabel,
  };
}
