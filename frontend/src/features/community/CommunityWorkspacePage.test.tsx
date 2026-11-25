import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { mockUser, renderWithAuth, sessionRecords } from '../../test/auth-utils';
import { getCurrentUser, refreshSession } from '../auth/auth.service';
import { CommunityWorkspacePage } from './CommunityWorkspacePage';
import {
  addReaction,
  deleteMessage,
  editMessage,
  getChannels,
  getCommunity,
  getCommunities,
  getMembers,
  getMessages,
  getReplies,
  getResources,
  getRoles,
  removeReaction,
  sendMessage,
  sendReply,
} from './community.service';
import type { Channel, Community, CommunityMember, Message, MessagePage } from './community.types';

vi.mock('../auth/auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

vi.mock('./community.service', async () => {
  const { createCommunityServiceMock } = await import('../../test/community-service-mock');
  return createCommunityServiceMock();
});

const community: Community = {
  id: 'community-1',
  name: 'Frontend Developers',
  slug: 'frontend-developers',
  description: 'A place for frontend questions.',
  coverImageUrl: null,
  visibility: 'public',
  memberCount: 2,
  currentUserRole: 'member',
};

const channels: Channel[] = [
  {
    id: 'channel-1',
    communityId: community.id,
    name: 'general',
    slug: 'general',
    description: 'General frontend discussion',
    type: 'text',
    visibility: 'public',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'channel-2',
    communityId: community.id,
    name: 'resources',
    slug: 'resources',
    description: 'Shared links',
    type: 'resources',
    visibility: 'public',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

const members: CommunityMember[] = [
  {
    id: 'user-owner',
    userId: 'user-owner',
    username: 'grace',
    displayName: 'Grace Hopper',
    avatarUrl: null,
    role: 'owner',
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: mockUser.id,
    userId: mockUser.id,
    username: mockUser.username,
    displayName: mockUser.displayName ?? 'Ada Lovelace',
    avatarUrl: null,
    role: 'member',
    joinedAt: '2026-01-02T00:00:00.000Z',
  },
];

const ownMessage: Message = {
  id: 'message-1',
  channelId: 'channel-1',
  parentMessageId: null,
  authorId: mockUser.id,
  author: {
    id: mockUser.id,
    username: mockUser.username,
    displayName: mockUser.displayName ?? 'Ada Lovelace',
    avatarUrl: null,
  },
  body: 'Own message body',
  kind: 'message',
  code: null,
  language: null,
  linkUrl: null,
  linkTitle: null,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
  reactionCounts: {},
  viewerReactions: [],
};

const otherMessage: Message = {
  ...ownMessage,
  id: 'message-2',
  authorId: 'user-owner',
  author: {
    id: 'user-owner',
    username: 'grace',
    displayName: 'Grace Hopper',
    avatarUrl: null,
  },
  body: 'Question from Grace',
  kind: 'question',
};

function page(items: Message[]): MessagePage {
  return { items, nextCursor: null, hasMore: false };
}

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderWithAuth(
    <QueryClientProvider client={client}>
      <Routes>
        <Route path="/app" element={<CommunityWorkspacePage />} />
      </Routes>
    </QueryClientProvider>,
    ['/app'],
  );
}

async function settled() {
  expect(
    await screen.findByRole('heading', { name: 'general' }, { timeout: 5000 }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Own message body', {}, { timeout: 5000 })).toBeInTheDocument();
}

describe('CommunityWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(getCommunities).mockResolvedValue([community]);
    vi.mocked(getCommunity).mockResolvedValue(community);
    vi.mocked(getChannels).mockResolvedValue(channels);
    vi.mocked(getMembers).mockResolvedValue(members);
    vi.mocked(getRoles).mockResolvedValue([
      { role: 'owner', label: 'Owner', permissions: [] },
      { role: 'member', label: 'Member', permissions: [] },
    ]);
    vi.mocked(getMessages).mockResolvedValue(page([ownMessage, otherMessage]));
    vi.mocked(getResources).mockResolvedValue([]);
    vi.mocked(getReplies).mockResolvedValue([]);
    vi.mocked(sendMessage).mockResolvedValue(ownMessage);
    vi.mocked(sendReply).mockResolvedValue(ownMessage);
    vi.mocked(editMessage).mockResolvedValue(ownMessage);
    vi.mocked(deleteMessage).mockResolvedValue(undefined);
    vi.mocked(addReaction).mockResolvedValue(undefined);
    vi.mocked(removeReaction).mockResolvedValue(undefined);
  });

  it('renders the authenticated workspace with API data', async () => {
    renderApp();
    await settled();

    expect(screen.getAllByText('Frontend Developers').length).toBeGreaterThan(0);
    expect(screen.getByText('Own message body')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discussions' })).toHaveAttribute(
      'href',
      '/app/discussions',
    );
    expect(screen.queryByRole('link', { name: '#' })).not.toBeInTheDocument();
  });

  it('navigates channels from the sidebar', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    await user.click(screen.getByRole('button', { name: 'resources' }));

    await waitFor(() => expect(getMessages).toHaveBeenCalledWith('channel-2', { limit: 30 }));
    expect(await screen.findByRole('heading', { name: 'resources' })).toBeInTheDocument();
  });

  it('clears the composer only after a successful send', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    const composer = screen.getByRole('textbox', { name: 'Message' });
    await user.type(composer, 'Hello team');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith('channel-1', { body: 'Hello team' }),
    );
    await waitFor(() => expect(composer).toHaveValue(''));
  });

  it('keeps the draft and shows an error when sending fails', async () => {
    const user = userEvent.setup();
    vi.mocked(sendMessage).mockRejectedValue(new Error('Send failed'));
    renderApp();
    await settled();

    const composer = screen.getByRole('textbox', { name: 'Message' });
    await user.type(composer, 'Do not lose this');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Send failed')).toBeInTheDocument();
    expect(composer).toHaveValue('Do not lose this');
  });

  it('adds and removes reactions', async () => {
    const user = userEvent.setup();
    let reacted = false;
    vi.mocked(getMessages).mockImplementation(async () =>
      reacted
        ? page([
            {
              ...ownMessage,
              reactionCounts: { '🚀': 1 },
              viewerReactions: ['🚀'],
            },
          ])
        : page([ownMessage]),
    );
    vi.mocked(addReaction).mockImplementation(async () => {
      reacted = true;
    });
    renderApp();
    await settled();

    const article = screen.getByText('Own message body').closest('article') as HTMLElement;
    await user.click(within(article).getByRole('button', { name: 'Add reaction' }));
    await user.click(within(article).getByRole('button', { name: 'React with 🚀' }));

    await waitFor(() => expect(addReaction).toHaveBeenCalledWith('message-1', '🚀'));
    const updatedArticle = screen.getByText('Own message body').closest('article') as HTMLElement;
    const removeButton = await within(updatedArticle).findByRole('button', {
      name: 'Remove 🚀 reaction, 1 total',
    });
    await user.click(removeButton);
    await waitFor(() => expect(removeReaction).toHaveBeenCalledWith('message-1', '🚀'));
  });

  it('shows edit and delete only for the viewer own message', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    const ownArticle = screen.getByText('Own message body').closest('article') as HTMLElement;
    const otherArticle = screen.getByText('Question from Grace').closest('article') as HTMLElement;

    expect(within(ownArticle).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(ownArticle).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(within(otherArticle).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(otherArticle).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create channel' })).not.toBeInTheDocument();

    await user.click(within(ownArticle).getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete this message?');
    await user.click(screen.getByRole('button', { name: 'Delete message' }));
    await waitFor(() => expect(deleteMessage).toHaveBeenCalledWith('message-1'));
  });

  it('edits an own message inline', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    const article = screen.getByText('Own message body').closest('article') as HTMLElement;
    await user.click(within(article).getByRole('button', { name: 'Edit' }));
    const editInput = within(article).getByRole('textbox', { name: 'Edit message' });
    await user.clear(editInput);
    await user.type(editInput, 'Updated body');
    await user.click(within(article).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(editMessage).toHaveBeenCalledWith('message-1', 'Updated body'));
  });

  it('posts a reply from the thread drawer', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    const article = screen.getByText('Own message body').closest('article') as HTMLElement;
    await user.click(within(article).getByRole('button', { name: 'Reply' }));

    const dialog = await screen.findByRole('dialog', { name: 'Thread' });
    const composer = within(dialog).getByRole('textbox', { name: 'Message' });
    await user.type(composer, 'A useful reply');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(sendReply).toHaveBeenCalledWith('message-1', { body: 'A useful reply' }),
    );
  });

  it('opens and closes mobile drawers with Escape and returns focus', async () => {
    const user = userEvent.setup();
    renderApp();
    await settled();

    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Workspace navigation' });
    expect(within(dialog).getByRole('link', { name: 'Home' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('shows only safe member fields and no fake controls', async () => {
    renderApp();
    await settled();

    expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThan(0);
    expect(screen.queryByText('ada@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/online now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
  });
});
