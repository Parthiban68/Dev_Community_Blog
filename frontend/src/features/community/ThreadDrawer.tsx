import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import type { CreateMessagePayload, Message } from './community.types';
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
import { useToast } from './ToastProvider';
import { MessageComposer } from './MessageComposer';
import { MessageItem } from './MessageItem';
import { WorkspaceErrorState, WorkspaceSkeleton } from './WorkspaceStates';
import { WorkspaceDrawer } from './WorkspaceDrawer';
import { useWorkspace } from './workspace-context';

interface ThreadDrawerProps {
  open: boolean;
  messageId: string | null;
  parent: Message | null;
  onClose: () => void;
  onSelectMessage: (id: string) => void;
}

export function ThreadDrawer({
  open,
  messageId,
  parent,
  onClose,
  onSelectMessage,
}: ThreadDrawerProps) {
  const { members, canModerate } = useWorkspace();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const repliesQuery = useQuery({
    queryKey: communityKeys.replies(messageId),
    queryFn: () => getReplies(messageId as string),
    enabled: Boolean(open && messageId),
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
    onSuccess: () => {
      invalidate();
      showToast('Message deleted.', 'success');
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reportMessage(id, reason),
  });

  return (
    <WorkspaceDrawer open={open} title="Thread" onClose={onClose} side="right">
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
          <Link
            to={`/app/discussions/${parent.id}`}
            state={{ message: parent, channelId: parent.channelId }}
            onClick={onClose}
            className="workspace-text-action accent mt-2"
          >
            Open full discussion
          </Link>
        </div>
      ) : null}

      <div className="mt-5 border-t border-workspace-border pt-5">
        <h3 className="text-xs font-semibold">Replies</h3>
        {repliesQuery.isPending ? <div className="mt-4"><WorkspaceSkeleton rows={2} /></div> : null}
        {repliesQuery.isError ? (
          <div className="mt-4">
            <WorkspaceErrorState
              description="Replies could not be loaded."
              onAction={() => void repliesQuery.refetch()}
            />
          </div>
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
                  onReply={(message) => onSelectMessage(message.id)}
                  onOpenThread={(message) => onSelectMessage(message.id)}
                />
              ))}
            </div>
          ) : (
            <p className="workspace-muted mt-3 text-xs">
              No replies have been posted in this thread.
            </p>
          )
        ) : null}
      </div>

      <div className="mt-5 border-t border-workspace-border pt-4">
        <MessageComposer
          members={members}
          compact
          placeholder="Reply to this thread…"
          onSend={async (payload) => {
            await replyMutation.mutateAsync(payload);
          }}
        />
      </div>
    </WorkspaceDrawer>
  );
}
