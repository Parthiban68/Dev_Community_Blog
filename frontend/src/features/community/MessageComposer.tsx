import { AtSign, Link2, Paperclip, Send, Smile } from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CommunityMember, CreateMessagePayload } from './community.types';

const emojis = ['👍', '🎉', '🚀', '❤️', '👀', '🙏', '💡', '✅'];

interface MessageComposerProps {
  members: CommunityMember[];
  onSend: (payload: CreateMessagePayload) => Promise<void>;
  placeholder?: string;
  compact?: boolean;
}

export function MessageComposer({
  members,
  onSend,
  placeholder = 'Write a message…',
  compact = false,
}: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionCandidates = useMemo(() => members.slice(0, 8), [members]);

  function insertAtCaret(value: string) {
    const textarea = textareaRef.current;
    const caret = textarea?.selectionStart ?? body.length;
    const next = `${body.slice(0, caret)}${value}${body.slice(caret)}`;
    setBody(next);
    setError(null);
    requestAnimationFrame(() => {
      textarea?.focus();
      const position = caret + value.length;
      textarea?.setSelectionRange(position, position);
    });
  }

  async function submit(payload: CreateMessagePayload) {
    setSending(true);
    setError(null);
    try {
      await onSend(payload);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your message could not be sent.');
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    const sent = await submit({ body: trimmed });
    if (sent) {
      setBody('');
      setMentionsOpen(false);
      setEmojiOpen(false);
    }
  }

  async function handleLinkSend() {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      setLinkError('Enter a link URL.');
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setLinkError('Enter a valid URL, including https://.');
      return;
    }
    const sent = await submit({
      body: linkTitle.trim() || `Shared link: ${trimmedUrl}`,
      kind: 'resource',
      linkUrl: trimmedUrl,
      linkTitle: linkTitle.trim() || undefined,
    });
    if (sent) {
      setLinkTitle('');
      setLinkUrl('');
      setLinkError(null);
      setLinkOpen(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className={`workspace-composer ${compact ? 'compact' : ''}`} aria-busy={sending}>
      {linkOpen ? (
        <form
          className="workspace-link-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLinkSend();
          }}
        >
          <div className="workspace-link-form-row">
            <label className="sr-only" htmlFor={compact ? 'link-title-thread' : 'link-title'}>
              Link title
            </label>
            <input
              id={compact ? 'link-title-thread' : 'link-title'}
              className="workspace-input"
              value={linkTitle}
              onChange={(event) => setLinkTitle(event.target.value)}
              placeholder="Link title"
              maxLength={200}
            />
            <label className="sr-only" htmlFor={compact ? 'link-url-thread' : 'link-url'}>
              Link URL
            </label>
            <input
              id={compact ? 'link-url-thread' : 'link-url'}
              className="workspace-input"
              type="url"
              value={linkUrl}
              onChange={(event) => {
                setLinkUrl(event.target.value);
                setLinkError(null);
              }}
              placeholder="https://example.com/article"
            />
          </div>
          {linkError ? <p className="workspace-error-text">{linkError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="workspace-button subtle"
              onClick={() => {
                setLinkOpen(false);
                setLinkError(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="workspace-button primary" disabled={sending}>
              {sending ? 'Attaching…' : 'Attach link'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="workspace-composer-box">
        <textarea
          ref={textareaRef}
          className="workspace-composer-input"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Message"
          enterKeyHint="send"
          rows={compact ? 2 : 3}
        />
        <div className="workspace-composer-actions">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                className="workspace-icon-button h-8 w-8"
                onClick={() => {
                  setMentionsOpen((value) => !value);
                  setEmojiOpen(false);
                }}
                aria-label="Mention a member"
                aria-expanded={mentionsOpen}
                title="Mention a member"
              >
                <AtSign size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
              {mentionsOpen ? (
                <div className="workspace-popover bottom-full left-0 mb-2 w-56" role="listbox">
                  <p className="workspace-popover-heading">Mention a member</p>
                  {mentionCandidates.length ? (
                    mentionCandidates.map((member) => (
                      <button
                        key={member.userId}
                        type="button"
                        role="option"
                        aria-selected="false"
                        className="workspace-popover-item"
                        onClick={() => {
                          insertAtCaret(`@${member.username} `);
                          setMentionsOpen(false);
                        }}
                      >
                        <span className="truncate">{member.displayName}</span>
                        <span className="workspace-muted truncate text-[11px]">
                          @{member.username}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="workspace-muted px-3 py-2 text-xs">No members loaded.</p>
                  )}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                type="button"
                className="workspace-icon-button h-8 w-8"
                onClick={() => {
                  setEmojiOpen((value) => !value);
                  setMentionsOpen(false);
                }}
                aria-label="Insert emoji"
                aria-expanded={emojiOpen}
                title="Insert emoji"
              >
                <Smile size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
              {emojiOpen ? (
                <div className="workspace-popover bottom-full left-0 mb-2 w-auto" role="group" aria-label="Emoji">
                  <div className="flex gap-1 p-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="workspace-emoji-button"
                        onClick={() => {
                          insertAtCaret(emoji);
                          setEmojiOpen(false);
                        }}
                        aria-label={`Insert ${emoji}`}
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
              className="workspace-icon-button h-8 w-8"
              onClick={() => {
                setLinkOpen((value) => !value);
                setMentionsOpen(false);
                setEmojiOpen(false);
              }}
              aria-label="Attach link"
              aria-expanded={linkOpen}
              title="Attach link"
            >
              <Paperclip size={17} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <Link2 size={14} strokeWidth={1.8} className="workspace-muted hidden sm:block" aria-hidden="true" />
          </div>
          <button
            type="button"
            className="workspace-button primary h-9"
            onClick={() => void handleSend()}
            disabled={!body.trim() || sending}
          >
            {sending ? 'Sending…' : 'Send'}
            <Send size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
      {error ? (
        <p className="workspace-error-text mt-2" role="alert">
          {error}
        </p>
      ) : null}
      <p className="workspace-muted mt-2 hidden text-[11px] sm:block">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
