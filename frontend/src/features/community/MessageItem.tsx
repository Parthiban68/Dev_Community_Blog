import { Check, CornerDownRight, Flag, Link2, MessageCircle, Pencil, SmilePlus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CodeBlock } from './CodeBlock';
import { ConfirmDialog } from './ConfirmDialog';
import type { Message } from './community.types';
import { useToast } from './ToastProvider';

const quickReactions = ['👍', '🎉', '🚀', '👀', '💡'];

const kindLabel: Record<Message['kind'], string> = {
  message: 'Message',
  question: 'Question',
  answer: 'Answer',
  announcement: 'Announcement',
  resource: 'Resource',
};

interface MessageItemProps {
  message: Message;
  currentUserId: string | undefined;
  canModerate: boolean;
  onReact: (message: Message, emoji: string) => Promise<void>;
  onEdit: (message: Message, body: string) => Promise<void>;
  onDelete: (message: Message) => Promise<void>;
  onCopyLink: (message: Message) => void;
  onReport: (message: Message, reason: string) => Promise<void>;
  onReply: (message: Message) => void;
  onOpenThread: (message: Message) => void;
  readOnlyActions?: boolean;
}

function renderBody(body: string): ReactNode {
  return body.split(/(@[a-zA-Z0-9_]+)/g).map((part, index) =>
    part.startsWith('@') ? (
      <span key={index} className="workspace-mention">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function MessageItem({
  message,
  currentUserId,
  canModerate,
  onReact,
  onEdit,
  onDelete,
  onCopyLink,
  onReport,
  onReply,
  onOpenThread,
  readOnlyActions = false,
}: MessageItemProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const isOwn = Boolean(currentUserId && message.authorId === currentUserId);
  const canMutate = isOwn || canModerate;

  async function toggleReaction(emoji: string) {
    setReactionOpen(false);
    try {
      await onReact(message, emoji);
    } catch {
      showToast('Your reaction could not be updated.', 'error');
    }
  }

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await onEdit(message, trimmed);
      setEditing(false);
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : 'This message could not be edited.');
    } finally {
      setSaving(false);
    }
  }

  async function submitReport() {
    if (reason.trim().length < 3) {
      showToast('Add a short reason before reporting.', 'error');
      return;
    }
    setReporting(true);
    try {
      await onReport(message, reason.trim());
      setReportOpen(false);
      setReason('');
      showToast('Message reported.', 'success');
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'This message could not be reported.', 'error');
    } finally {
      setReporting(false);
    }
  }

  return (
    <article className={`workspace-message kind-${message.kind}`}>
      <div className="workspace-avatar" aria-hidden="true">
        {message.author.avatarUrl ? (
          <img src={message.author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          message.author.displayName.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold">{message.author.displayName}</span>
          <span className="workspace-muted text-[11px]">@{message.author.username}</span>
          {message.kind !== 'message' ? (
            <span className={`workspace-badge badge-${message.kind}`}>{kindLabel[message.kind]}</span>
          ) : null}
          {message.kind === 'answer' && message.parentMessageId ? (
            <span className="workspace-muted inline-flex items-center gap-1 text-[11px]">
              <CornerDownRight size={12} aria-hidden="true" />
              reply
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-2">
            <label className="sr-only" htmlFor={`edit-${message.id}`}>
              Edit message
            </label>
            <textarea
              id={`edit-${message.id}`}
              className="workspace-input min-h-20 resize-y"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            {editError ? <p className="workspace-error-text mt-1" role="alert">{editError}</p> : null}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="workspace-button primary h-8"
                onClick={() => void saveEdit()}
                disabled={saving || !draft.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="workspace-button subtle h-8"
                onClick={() => {
                  setEditing(false);
                  setDraft(message.body);
                  setEditError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="workspace-message-body mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-6">
            {renderBody(message.body)}
          </p>
        )}

        {message.code ? <div className="mt-3"><CodeBlock code={message.code} language={message.language} /></div> : null}

        {message.linkUrl ? (
          <a
            className="workspace-link-card mt-3"
            href={message.linkUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Link2 size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="min-w-0 truncate font-medium">
              {message.linkTitle ?? message.linkUrl}
            </span>
          </a>
        ) : null}

        {Object.keys(message.reactionCounts).length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(message.reactionCounts).map(([emoji, count]) => {
              const active = message.viewerReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`workspace-reaction ${active ? 'active' : ''}`}
                  onClick={() => void toggleReaction(emoji)}
                  aria-pressed={active}
                  aria-label={`${active ? 'Remove' : 'Add'} ${emoji} reaction, ${count} total`}
                >
                  <span aria-hidden="true">{emoji}</span>
                  <span className="text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {reportOpen ? (
          <div className="workspace-inline-form mt-3">
            <label className="sr-only" htmlFor={`report-${message.id}`}>
              Reason for reporting
            </label>
            <textarea
              id={`report-${message.id}`}
              className="workspace-input min-h-16 resize-y"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why are you reporting this message?"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="workspace-button secondary h-8"
                onClick={() => void submitReport()}
                disabled={reporting}
              >
                {reporting ? 'Submitting…' : 'Submit report'}
              </button>
              <button
                type="button"
                className="workspace-button subtle h-8"
                onClick={() => {
                  setReportOpen(false);
                  setReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {readOnlyActions ? null : (
        <div className="workspace-message-actions mt-2 flex flex-wrap items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="workspace-icon-button h-7 w-7"
              onClick={() => setReactionOpen((value) => !value)}
              aria-label="Add reaction"
              aria-expanded={reactionOpen}
              title="Add reaction"
            >
              <SmilePlus size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
            {reactionOpen ? (
              <div className="workspace-popover bottom-full left-0 mb-2 w-auto" role="group" aria-label="Quick reactions">
                <div className="flex gap-1 p-2">
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="workspace-emoji-button"
                      onClick={() => void toggleReaction(emoji)}
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="workspace-text-action"
            onClick={() => onReply(message)}
          >
            <MessageCircle size={13} strokeWidth={1.8} aria-hidden="true" />
            Reply
          </button>
          <button
            type="button"
            className="workspace-text-action"
            onClick={() => onOpenThread(message)}
          >
            <CornerDownRight size={13} strokeWidth={1.8} aria-hidden="true" />
            Open thread
          </button>
          {message.kind === 'question' ? (
            <Link
              to={`/app/discussions/${message.id}`}
              state={{ message, channelId: message.channelId }}
              className="workspace-text-action accent"
            >
              Open discussion
            </Link>
          ) : null}
          <button
            type="button"
            className="workspace-text-action"
            onClick={() => onCopyLink(message)}
          >
            <Link2 size={13} strokeWidth={1.8} aria-hidden="true" />
            Copy link
          </button>
          {canMutate ? (
            <button
              type="button"
              className="workspace-text-action"
              onClick={() => {
                setDraft(message.body);
                setEditing(true);
              }}
            >
              <Pencil size={13} strokeWidth={1.8} aria-hidden="true" />
              Edit
            </button>
          ) : null}
          {canMutate ? (
            <button
              type="button"
              className="workspace-text-action danger"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
              Delete
            </button>
          ) : null}
          <button
            type="button"
            className="workspace-text-action"
            onClick={() => setReportOpen((value) => !value)}
          >
            <Flag size={13} strokeWidth={1.8} aria-hidden="true" />
            Report
          </button>
          {isOwn ? (
            <span className="workspace-muted inline-flex items-center gap-1 text-[10px]" title="You wrote this message">
              <Check size={11} aria-hidden="true" />
              You
            </span>
          ) : null}
        </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this message?"
        description="This removes the message for everyone in the channel. This action cannot be undone."
        confirmLabel="Delete message"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          void onDelete(message);
        }}
      />
    </article>
  );
}
