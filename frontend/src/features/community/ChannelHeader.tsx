import { Bookmark, ChevronDown, Hash, Megaphone, MoreVertical, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChannelType } from './community.types';
import { useToast } from './ToastProvider';
import { useWorkspace } from './workspace-context';

const channelIcon: Record<ChannelType, typeof Hash> = {
  text: Hash,
  announcement: Megaphone,
  question: Hash,
  resources: Bookmark,
};

export function ChannelHeader() {
  const {
    channel,
    canManageChannels,
    canEditChannel,
    setCreateChannelOpen,
    setEditingChannel,
    setContextOpen,
  } = useWorkspace();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = channelIcon[channel?.type ?? 'text'];

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function focusSearch() {
    window.dispatchEvent(new Event('workspace:focus-search'));
  }

  async function copyChannelLink() {
    if (!channel) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app?channel=${channel.id}`);
      showToast('Channel link copied.', 'success');
    } catch {
      showToast('Could not copy the channel link.', 'error');
    }
    setMenuOpen(false);
  }

  return (
    <div className="workspace-channel-header">
      <div className="flex min-w-0 items-center gap-3">
        <span className="workspace-channel-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{channel?.name ?? 'Channel'}</h1>
            <ChevronDown size={14} strokeWidth={1.8} className="workspace-muted" aria-hidden="true" />
          </div>
          <p className="workspace-muted truncate text-[11px]">
            {channel?.description ?? 'No description has been added to this channel.'}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="workspace-icon-button h-9 w-9"
          onClick={focusSearch}
          aria-label="Search in channel"
          title="Search in channel"
        >
          <Search size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="workspace-button subtle h-9"
          onClick={() => setContextOpen(true)}
        >
          Details
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="workspace-icon-button h-9 w-9"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Channel options"
            aria-expanded={menuOpen}
            title="Channel options"
          >
            <MoreVertical size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div className="workspace-menu" role="menu">
              {canManageChannels ? (
                <button
                  type="button"
                  role="menuitem"
                  className="workspace-menu-item"
                  onClick={() => {
                    setCreateChannelOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <Plus size={15} aria-hidden="true" />
                  Create channel
                </button>
              ) : null}
              {canEditChannel && channel ? (
                <button
                  type="button"
                  role="menuitem"
                  className="workspace-menu-item"
                  onClick={() => {
                    setEditingChannel(channel);
                    setMenuOpen(false);
                  }}
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit channel
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="workspace-menu-item"
                onClick={copyChannelLink}
              >
                <Hash size={15} aria-hidden="true" />
                Copy channel link
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
