import { ArrowUp, Inbox } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CommunityMember, CreateMessagePayload, Message, MessagePage } from './community.types';
import { MessageComposer } from './MessageComposer';
import { MessageItem } from './MessageItem';
import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceSkeleton } from './WorkspaceStates';

interface MessageFeedProps {
  messages: Message[];
  page: MessagePage | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: unknown;
  onRetry: () => void;
  onLoadOlder: () => void;
  members: CommunityMember[];
  currentUserId: string | undefined;
  canModerate: boolean;
  onSend: (payload: CreateMessagePayload) => Promise<void>;
  onReact: (message: Message, emoji: string) => Promise<void>;
  onEdit: (message: Message, body: string) => Promise<void>;
  onDelete: (message: Message) => Promise<void>;
  onCopyLink: (message: Message) => void;
  onReport: (message: Message, reason: string) => Promise<void>;
  onReply: (message: Message) => void;
  onOpenThread: (message: Message) => void;
}

export function MessageFeed({
  messages,
  page,
  isLoading,
  isFetchingMore,
  error,
  onRetry,
  onLoadOlder,
  members,
  currentUserId,
  canModerate,
  onSend,
  onReact,
  onEdit,
  onDelete,
  onCopyLink,
  onReport,
  onReply,
  onOpenThread,
}: MessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(messages.length);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const grew = messages.length > previousCount.current;
    previousCount.current = messages.length;
    if (grew) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="workspace-feed">
      <div className="workspace-feed-scroll" ref={scrollRef}>
        <div className="workspace-feed-inner">
          {isLoading ? <WorkspaceSkeleton /> : null}

          {!isLoading && error ? (
            <WorkspaceErrorState
              description="The channel conversation could not be loaded. Check your connection and try again."
              onAction={onRetry}
            />
          ) : null}

          {!isLoading && !error ? (
            <>
              {page?.hasMore && page.nextCursor ? (
                <div className="workspace-load-older">
                  <button
                    type="button"
                    className="workspace-button subtle"
                    onClick={onLoadOlder}
                    disabled={isFetchingMore}
                  >
                    <ArrowUp size={14} strokeWidth={1.8} aria-hidden="true" />
                    {isFetchingMore ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              ) : null}

              {messages.length ? (
                <div className="space-y-5">
                  {messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      currentUserId={currentUserId}
                      canModerate={canModerate}
                      onReact={onReact}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onCopyLink={onCopyLink}
                      onReport={onReport}
                      onReply={onReply}
                      onOpenThread={onOpenThread}
                    />
                  ))}
                </div>
              ) : (
                <WorkspaceEmptyState
                  icon={<Inbox size={20} strokeWidth={1.7} />}
                  title="No messages yet"
                  description="Start the conversation with the first message in this channel."
                />
              )}
            </>
          ) : null}
        </div>
      </div>
      <div className="workspace-composer-wrap">
        <MessageComposer members={members} onSend={onSend} />
      </div>
    </div>
  );
}
