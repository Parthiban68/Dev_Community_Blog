import { Bookmark, ChevronDown, Hash, Megaphone, Pencil, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Channel, ChannelType } from './community.types';
import { useWorkspace } from './workspace-context';

const channelIcon: Record<ChannelType, typeof Hash> = {
  text: Hash,
  announcement: Megaphone,
  question: Hash,
  resources: Bookmark,
};

interface CommunitySidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function CommunitySidebar({ className = '', onNavigate }: CommunitySidebarProps) {
  const {
    community,
    channels,
    members,
    channel: activeChannel,
    selectChannel,
    canManageChannels,
    canEditChannel,
    setCreateChannelOpen,
    setEditingChannel,
    search,
  } = useWorkspace();
  const [showAll, setShowAll] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? channels.filter((entry) => entry.name.toLowerCase().includes(query))
    : channels;
  const topicChannels = filtered.filter((entry) => entry.type !== 'resources');
  const myChannels = filtered.filter((entry) => entry.type === 'resources');
  const visibleTopics = showAll ? topicChannels : topicChannels.slice(0, 6);
  const visibleMine = showAll ? myChannels : myChannels.slice(0, 4);
  const memberCount = community?.memberCount || members.length;

  function renderChannel(channel: Channel) {
    const Icon = channelIcon[channel.type];
    const isActive = activeChannel?.id === channel.id;
    return (
      <div key={channel.id} className="workspace-sidebar-channel-row">
        <button
          type="button"
          className={`workspace-sidebar-channel ${isActive ? 'active' : ''}`}
          onClick={() => {
            selectChannel(channel.id);
            onNavigate?.();
          }}
          aria-current={isActive ? 'page' : undefined}
          title={channel.name}
        >
          <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="truncate">{channel.name}</span>
        </button>
        {canEditChannel ? (
          <button
            type="button"
            className="workspace-icon-button h-7 w-7"
            onClick={() => setEditingChannel(channel)}
            aria-label={`Edit ${channel.name}`}
            title={`Edit ${channel.name}`}
          >
            <Pencil size={13} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <aside className={`workspace-sidebar ${className}`} aria-label="Community channels">
      {community ? (
        <div className="workspace-sidebar-community">
          <div className="workspace-sidebar-cover">
            {community.coverImageUrl ? (
              <img src={community.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="workspace-sidebar-cover-mark" aria-hidden="true">
                {community.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="px-3 pb-3 pt-2.5">
            <p className="truncate text-sm font-semibold">{community.name}</p>
            <p className="workspace-muted mt-1 flex items-center gap-1.5 text-[11px]">
              <Users size={12} strokeWidth={1.8} aria-hidden="true" />
              {memberCount > 0 ? `${memberCount} members` : 'Member list loading'}
            </p>
          </div>
        </div>
      ) : (
        <div className="workspace-sidebar-community">
          <div className="workspace-sidebar-cover" aria-hidden="true" />
          <div className="space-y-2 px-3 py-4">
            <div className="workspace-skeleton-line h-3 w-2/3" />
            <div className="workspace-skeleton-line h-2.5 w-1/2" />
          </div>
        </div>
      )}

      <div className="workspace-sidebar-scroll">
        <section>
          <div className="workspace-sidebar-heading">
            <span>COMMUNITY</span>
            <Link to="/app/home" onClick={onNavigate} className="workspace-sidebar-link">
              Home
            </Link>
          </div>
          <p className="workspace-muted px-3 pb-2 text-[11px] leading-5">
            {community?.description ?? 'Community details are loaded from the API.'}
          </p>
        </section>

        <section className="mt-4">
          <div className="workspace-sidebar-heading">
            <span>FRONTEND TOPICS</span>
            {canManageChannels ? (
              <button
                type="button"
                className="workspace-icon-button h-6 w-6"
                onClick={() => setCreateChannelOpen(true)}
                aria-label="Create channel"
                title="Create channel"
              >
                <Plus size={14} strokeWidth={1.9} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="space-y-0.5">
            {visibleTopics.length ? (
              visibleTopics.map(renderChannel)
            ) : (
              <p className="workspace-muted px-3 py-2 text-[11px]">No topics available.</p>
            )}
          </div>
        </section>

        <section className="mt-4">
          <div className="workspace-sidebar-heading">
            <span>MY CHANNELS</span>
            <button
              type="button"
              className="workspace-sidebar-link inline-flex items-center gap-1"
              onClick={() => setShowAll((value) => !value)}
              aria-expanded={showAll}
            >
              {showAll ? 'Show less' : 'View All'}
              <ChevronDown
                size={12}
                strokeWidth={1.8}
                aria-hidden="true"
                className={showAll ? 'rotate-180' : undefined}
              />
            </button>
          </div>
          <div className="space-y-0.5">
            {visibleMine.length ? (
              visibleMine.map(renderChannel)
            ) : (
              <p className="workspace-muted px-3 py-2 text-[11px]">
                No resource channels in this community.
              </p>
            )}
          </div>
        </section>

        <section className="workspace-guidelines">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            Community info
          </h3>
          <p className="workspace-muted mt-2 text-[11px] leading-5">
            {community?.description
              ? community.description
              : 'Guidelines are published by community owners.'}
          </p>
          <p className="workspace-muted mt-2 text-[11px] leading-5">
            Be constructive, share context and keep discussions on topic.
          </p>
        </section>
      </div>
    </aside>
  );
}
