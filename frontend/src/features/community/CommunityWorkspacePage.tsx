import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { VerificationBanner } from '../auth/components/VerificationBanner';
import type { VerificationNotice } from '../auth/auth.types';
import { ChannelHeader } from './ChannelHeader';
import { CommunitySidebar } from './CommunitySidebar';
import {
  addReaction,
  communityKeys,
  deleteMessage,
  editMessage,
  getMessages,
  removeReaction,
  reportMessage,
  sendMessage,
} from './community.service';
import type { CreateMessagePayload, Message, MessagePage } from './community.types';
import { ContextPanel } from './ContextPanel';
import { MessageFeed } from './MessageFeed';
import { ThreadDrawer } from './ThreadDrawer';
import { ToastProvider, useToast } from './ToastProvider';
import { WorkspaceDrawer } from './WorkspaceDrawer';
import { WorkspaceErrorState } from './WorkspaceStates';
import { WorkspaceRail } from './WorkspaceRail';
import { WorkspaceTopBar } from './WorkspaceTopBar';
import { CreateChannelModal } from './CreateChannelModal';
import { WorkspaceProvider, useWorkspace } from './workspace-context';

interface WorkspaceShellProps {
  children: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <WorkspaceLayout>{children}</WorkspaceLayout>
      </WorkspaceProvider>
    </ToastProvider>
  );
}

function WorkspaceLayout({ children }: WorkspaceShellProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const {
    error,
    refetch,
    channel,
    sidebarOpen,
    setSidebarOpen,
    contextOpen,
    setContextOpen,
    navigationOpen,
    setNavigationOpen,
    threadMessageId,
    threadParent,
    setThreadMessageId,
    setThreadParent,
    createChannelOpen,
    setCreateChannelOpen,
    editingChannel,
    setEditingChannel,
  } = useWorkspace();
  const verification = (location.state as { verification?: VerificationNotice } | null)
    ?.verification;

  return (
    <div className="workspace-shell">
      <div className="workspace-grid">
        <WorkspaceRail className="workspace-rail-column" />
        <CommunitySidebar className="workspace-sidebar-column" />
        <main className="workspace-main">
          <WorkspaceTopBar
            onOpenNavigation={() => setNavigationOpen(true)}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenContext={() => setContextOpen(true)}
          />
          {verification ? (
            <div className="workspace-verification">
              <VerificationBanner notice={verification} />
            </div>
          ) : null}
          {error ? (
            <div className="workspace-main-state">
              <WorkspaceErrorState
                description="The workspace could not be loaded. Check your connection and try again."
                onAction={refetch}
              />
            </div>
          ) : (
            children
          )}
        </main>
        <ContextPanel className="workspace-context-column" />
      </div>

      <WorkspaceDrawer
        open={navigationOpen}
        title="Workspace navigation"
        side="left"
        onClose={() => setNavigationOpen(false)}
      >
        <WorkspaceRail expanded onNavigate={() => setNavigationOpen(false)} />
      </WorkspaceDrawer>
      <WorkspaceDrawer
        open={sidebarOpen}
        title={channel?.name ?? 'Channels'}
        side="left"
        onClose={() => setSidebarOpen(false)}
      >
        <CommunitySidebar onNavigate={() => setSidebarOpen(false)} />
      </WorkspaceDrawer>
      <WorkspaceDrawer
        open={contextOpen}
        title="Community details"
        side="right"
        onClose={() => setContextOpen(false)}
      >
        <ContextPanel onClose={() => setContextOpen(false)} />
      </WorkspaceDrawer>
      <ThreadDrawer
        open={Boolean(threadMessageId)}
        messageId={threadMessageId}
        parent={threadParent}
        onClose={() => {
          setThreadMessageId(null);
          setThreadParent(null);
        }}
        onSelectMessage={(id) => {
          const cached = queryClient
            .getQueryData<MessagePage>(communityKeys.messages(channel?.id ?? null))
            ?.items.find((message) => message.id === id);
          setThreadParent(cached ?? null);
          setThreadMessageId(id);
        }}
      />
      <CreateChannelModal
        open={createChannelOpen || Boolean(editingChannel)}
        channel={editingChannel}
        onClose={() => {
          setCreateChannelOpen(false);
          setEditingChannel(null);
        }}
      />
    </div>
  );
}

function ChannelWorkspace() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const {
    channel,
    members,
    canModerate,
    setThreadMessageId,
    setThreadParent,
  } = useWorkspace();
  const channelId = channel?.id ?? null;
  const messagesKey = communityKeys.messages(channelId);

  const messagesQuery = useInfiniteQuery({
    queryKey: messagesKey,
    queryFn: ({ pageParam }) =>
      getMessages(channelId as string, {
        limit: 30,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(channelId),
  });

  const invalidateMessages = () => {
    void queryClient.invalidateQueries({ queryKey: messagesKey });
  };

  const reactionMutation = useMutation({
    mutationFn: ({ message, emoji }: { message: Message; emoji: string }) => {
      const active = message.viewerReactions.includes(emoji);
      return active ? removeReaction(message.id, emoji) : addReaction(message.id, emoji);
    },
    onSuccess: invalidateMessages,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => editMessage(id, body),
    onSuccess: invalidateMessages,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      invalidateMessages();
      showToast('Message deleted.', 'success');
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reportMessage(id, reason),
  });

  const pages = messagesQuery.data?.pages ?? [];
  const latestPage = pages[pages.length - 1] ?? null;
  const messages = [...pages].reverse().flatMap((page) => page.items);
  const page: MessagePage | null = latestPage
    ? {
        items: messages,
        nextCursor: latestPage.nextCursor,
        hasMore: latestPage.hasMore,
      }
    : null;

  function openThread(message: Message) {
    setThreadParent(message);
    setThreadMessageId(message.id);
  }

  async function copyLink(message: Message) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/app/discussions/${message.id}`,
      );
      showToast('Message link copied.', 'success');
    } catch {
      showToast('Could not copy the message link.', 'error');
    }
  }

  return (
    <div className="workspace-content">
      <ChannelHeader />
      <MessageFeed
        messages={messages}
        page={page}
        isLoading={messagesQuery.isPending && Boolean(channelId)}
        isFetchingMore={messagesQuery.isFetchingNextPage}
        error={messagesQuery.error}
        onRetry={() => void messagesQuery.refetch()}
        onLoadOlder={() => void messagesQuery.fetchNextPage()}
        members={members}
        currentUserId={user?.id}
        canModerate={canModerate}
        onSend={async (payload: CreateMessagePayload) => {
          if (!channelId) throw new Error('No channel is selected.');
          await sendMessage(channelId, payload);
          invalidateMessages();
        }}
        onReact={async (message, emoji) => {
          await reactionMutation.mutateAsync({ message, emoji });
        }}
        onEdit={async (message, body) => {
          await editMutation.mutateAsync({ id: message.id, body });
        }}
        onDelete={async (message) => {
          await deleteMutation.mutateAsync(message.id);
        }}
        onCopyLink={(message) => void copyLink(message)}
        onReport={async (message, reason) => {
          await reportMutation.mutateAsync({ id: message.id, reason });
        }}
        onReply={openThread}
        onOpenThread={openThread}
      />
    </div>
  );
}

export function CommunityWorkspacePage() {
  return (
    <WorkspaceShell>
      <ChannelWorkspace />
    </WorkspaceShell>
  );
}
