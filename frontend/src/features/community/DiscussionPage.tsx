import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { MessageComposer } from './MessageComposer';
import { MessageItem } from './MessageItem';
import {
  addReaction,
  communityKeys,
  deleteMessage,
  editMessage,
  getReplies,
  removeReaction,
  reportMessage,
  sendReply,
} from './community.service';
import type { CreateMessagePayload, Message, MessagePage } from './community.types';
import { useToast } from './ToastProvider';
import { WorkspaceErrorState, WorkspaceSkeleton } from './WorkspaceStates';
import { WorkspaceShell } from './CommunityWorkspacePage';
import { useWorkspace } from './workspace-context';

function findCachedMessage(queryClient: ReturnType<typeof useQueryClient>, id: string): Message | null {
  const entries = queryClient.getQueriesData<MessagePage>({ queryKey: communityKeys.messages(null) });
  for (const [, page] of entries) {
    const found = page?.items.find((message) => message.id === id);
    if (found) return found;
  }
  return null;
}

function DiscussionContent() {
  const { messageId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { members, canModerate, channel } = useWorkspace();
  const state = location.state as { message?: Message; channelId?: string } | null;
  const parent =
    state?.message ?? (messageId ? findCachedMessage(queryClient, messageId) : null) ?? null;

  const repliesQuery = useQuery({
    queryKey: communityKeys.replies(messageId ?? null),
    queryFn: () => getReplies(messageId as string),
    enabled: Boolean(messageId),
  });

  const invalidate = () => {
    if (messageId) {
      void queryClient.invalidateQueries({ queryKey: communityKeys.replies(messageId) });
    }
  };

  const replyMutation = useMutation({
    mutationFn: (payload: CreateMessagePayload) => sendReply(messageId as string, payload),
    onSuccess: () => {
      invalidate();
      showToast('Reply posted.', 'success');
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ id, emoji, active }: { id: string; emoji: string; active: boolean }) =>
      active ? removeReaction(id, emoji) : addReaction(id, emoji),
    onSuccess: invalidate,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => editMessage(id, body),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: invalidate,
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reportMessage(id, reason),
  });

  return (
    <div className="workspace-content">
      <div className="workspace-discussion-header">
        <Link to="/app" className="workspace-text-action" state={{ channelId: state?.channelId }}>
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
          Back to channel
        </Link>
        <h2 className="mt-2 text-sm font-semibold">Discussion</h2>
        <p className="workspace-muted mt-1 text-[11px]">
          {channel?.name ?? 'Channel'} · Thread replies are loaded from the API.
        </p>
      </div>
      <div className="workspace-discussion-scroll">
        <div className="workspace-discussion-inner">
          {parent ? (
            <div className="workspace-thread-parent">
              <p className="workspace-muted text-[10px] font-semibold uppercase tracking-[0.14em]">
                Original message
              </p>
              <MessageItem
                message={parent}
                currentUserId={user?.id}
                canModerate={canModerate}
                readOnlyActions
                onReact={async () => undefined}
                onEdit={async () => undefined}
                onDelete={async () => undefined}
                onCopyLink={() => undefined}
                onReport={async () => undefined}
                onReply={() => undefined}
                onOpenThread={() => undefined}
              />
            </div>
          ) : (
            <p className="workspace-muted text-xs">
              The original message is not available in this session.
            </p>
          )}

          <div className="mt-6 border-t border-workspace-border pt-5">
            <h3 className="text-xs font-semibold">Replies</h3>
            {repliesQuery.isPending ? <WorkspaceSkeleton rows={2} /> : null}
            {repliesQuery.isError ? (
              <WorkspaceErrorState
                description="Replies could not be loaded."
                onAction={() => void repliesQuery.refetch()}
              />
            ) : null}
            {!repliesQuery.isPending && !repliesQuery.isError ? (
              repliesQuery.data?.length ? (
                <div className="mt-4 space-y-5">
                  {repliesQuery.data.map((reply) => (
                    <MessageItem
                      key={reply.id}
                      message={reply}
                      currentUserId={user?.id}
                      canModerate={canModerate}
                      readOnlyActions
                      onReact={async (message, emoji) => {
                        await reactionMutation.mutateAsync({
                          id: message.id,
                          emoji,
                          active: message.viewerReactions.includes(emoji),
                        });
                      }}
                      onEdit={async (message, body) => {
                        await editMutation.mutateAsync({ id: message.id, body });
                      }}
                      onDelete={async (message) => {
                        await deleteMutation.mutateAsync(message.id);
                      }}
                      onCopyLink={async (message) => {
                        try {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/app/discussions/${message.id}`,
                          );
                          showToast('Message link copied.', 'success');
                        } catch {
                          showToast('Could not copy the message link.', 'error');
                        }
                      }}
                      onReport={async (message, reason) => {
                        await reportMutation.mutateAsync({ id: message.id, reason });
                      }}
                      onReply={() => undefined}
                      onOpenThread={() => undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="workspace-muted mt-3 text-xs">
                  No replies have been posted in this discussion.
                </p>
              )
            ) : null}
          </div>
        </div>
      </div>
      <div className="workspace-composer-wrap">
        <MessageComposer
          members={members}
          compact
          placeholder="Reply to the discussion…"
          onSend={async (payload) => {
            await replyMutation.mutateAsync(payload);
          }}
        />
      </div>
    </div>
  );
}

export function DiscussionPage() {
  return (
    <WorkspaceShell>
      <DiscussionContent />
    </WorkspaceShell>
  );
}
