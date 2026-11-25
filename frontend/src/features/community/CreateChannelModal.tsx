import { useEffect, useRef, useState } from 'react';
import type { Channel, ChannelType, Visibility } from './community.types';
import { useWorkspace } from './workspace-context';

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  channel?: Channel | null;
}

const types: ChannelType[] = ['text', 'announcement', 'question', 'resources'];

export function CreateChannelModal({ open, onClose, channel }: CreateChannelModalProps) {
  const { submitChannel, submitChannelUpdate } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement as HTMLElement | null;
    setName(channel?.name ?? '');
    setDescription(channel?.description ?? '');
    setType(channel?.type ?? 'text');
    setVisibility(channel?.visibility ?? 'public');
    setError(null);
    nameRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open, channel, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter a channel name with at least 2 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: trimmed, description: description.trim(), type, visibility };
      if (channel) {
        await submitChannelUpdate(payload);
      } else {
        await submitChannel(payload);
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The channel could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workspace-modal-backdrop" onMouseDown={onClose}>
      <div
        className="workspace-modal w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="channel-modal-title" className="text-base font-semibold">
          {channel ? 'Edit channel' : 'Create a channel'}
        </h2>
        <p className="workspace-muted mt-1 text-xs leading-5">
          {channel
            ? 'Update the details visible to everyone who can access this channel.'
            : 'Add a focused space for a topic in this community.'}
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="workspace-label" htmlFor="channel-name">
              Name
            </label>
            <input
              ref={nameRef}
              id="channel-name"
              className="workspace-input mt-1.5"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="workspace-label" htmlFor="channel-description">
              Description
            </label>
            <textarea
              id="channel-description"
              className="workspace-input mt-1.5 min-h-20 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="workspace-label" htmlFor="channel-type">
                Type
              </label>
              <select
                id="channel-type"
                className="workspace-input mt-1.5"
                value={type}
                onChange={(event) => setType(event.target.value as ChannelType)}
              >
                {types.map((value) => (
                  <option key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="workspace-label" htmlFor="channel-visibility">
                Visibility
              </label>
              <select
                id="channel-visibility"
                className="workspace-input mt-1.5"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as Visibility)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          {error ? <p className="workspace-error-text" role="alert">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="workspace-button subtle" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="workspace-button primary" disabled={saving}>
              {saving ? 'Saving…' : channel ? 'Save changes' : 'Create channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
