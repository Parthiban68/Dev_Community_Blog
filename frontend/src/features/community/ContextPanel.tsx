import { CalendarDays, Copy, FileText, Image, Link2, Search, Users } from 'lucide-react';
import type { CommunityMember, ResourceType, Role } from './community.types';
import { useToast } from './ToastProvider';
import { useWorkspace } from './workspace-context';

interface ContextPanelProps {
  className?: string;
  onClose?: () => void;
}

const tabs: { value: ResourceType; label: string; icon: typeof Link2 }[] = [
  { value: 'image', label: 'Images', icon: Image },
  { value: 'link', label: 'Links', icon: Link2 },
  { value: 'file', label: 'Files', icon: FileText },
];

function groupMembers(members: CommunityMember[]) {
  return {
    admins: members.filter((member) => member.role === 'owner' || member.role === 'admin'),
    moderators: members.filter((member) => member.role === 'moderator'),
    members: members.filter((member) => member.role === 'member'),
  };
}

export function ContextPanel({ className = '', onClose }: ContextPanelProps) {
  const {
    community,
    members,
    roles,
    resources,
    resourceType,
    setResourceType,
    resourceSearch,
    setResourceSearch,
    channel,
  } = useWorkspace();
  const { showToast } = useToast();
  const groups = groupMembers(members);
  const roleLabel = (value: Role) =>
    roles.find((entry) => entry.role === value)?.label ?? value[0].toUpperCase() + value.slice(1);

  async function copyUsername(member: CommunityMember) {
    try {
      await navigator.clipboard.writeText(member.username);
      showToast(`Copied @${member.username}.`, 'success');
    } catch {
      showToast('Could not copy the username.', 'error');
    }
  }

  function renderMember(member: CommunityMember) {
    return (
      <li key={member.userId} className="workspace-member-row">
        <span className="workspace-avatar small" aria-hidden="true">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            member.displayName.slice(0, 1).toUpperCase()
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{member.displayName}</span>
          <span className="workspace-muted block truncate text-[11px]">{roleLabel(member.role)}</span>
        </span>
        <button
          type="button"
          className="workspace-icon-button h-7 w-7"
          onClick={() => void copyUsername(member)}
          aria-label={`Copy username ${member.username}`}
          title={`Copy @${member.username}`}
        >
          <Copy size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </li>
    );
  }

  return (
    <aside className={`workspace-context ${className}`} aria-label="Community details">
      <div className="workspace-context-scroll">
        <section>
          <div className="workspace-section-heading">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              Community Members
            </h2>
            {onClose ? (
              <button
                type="button"
                className="workspace-text-action"
                onClick={onClose}
              >
                Close
              </button>
            ) : null}
          </div>
          <p className="workspace-muted mt-1 text-[11px]">
            {members.length ? `${members.length} members returned by the API` : 'No members loaded'}
          </p>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="workspace-context-group">Administrators</h3>
              {groups.admins.length ? (
                <ul className="mt-1.5 space-y-1">{groups.admins.map(renderMember)}</ul>
              ) : (
                <p className="workspace-muted mt-1 text-[11px]">No administrators listed.</p>
              )}
            </div>
            <div>
              <h3 className="workspace-context-group">Moderators</h3>
              {groups.moderators.length ? (
                <ul className="mt-1.5 space-y-1">{groups.moderators.map(renderMember)}</ul>
              ) : (
                <p className="workspace-muted mt-1 text-[11px]">No moderators listed.</p>
              )}
            </div>
            <div>
              <h3 className="workspace-context-group">Members</h3>
              {groups.members.length ? (
                <ul className="mt-1.5 space-y-1">{groups.members.slice(0, 8).map(renderMember)}</ul>
              ) : (
                <p className="workspace-muted mt-1 text-[11px]">No members listed.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7 border-t border-workspace-border pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            Shared Resources
          </h2>
          <p className="workspace-muted mt-1 truncate text-[11px]">
            {channel?.name ?? 'Channel'} · {community?.name ?? 'Community'}
          </p>
          <div className="mt-3 flex gap-1" role="tablist" aria-label="Resource type">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={resourceType === tab.value}
                  className={`workspace-tab ${resourceType === tab.value ? 'active' : ''}`}
                  onClick={() => setResourceType(tab.value)}
                >
                  <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <label className="workspace-context-search mt-3">
            <Search size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">Search shared resources</span>
            <input
              type="search"
              value={resourceSearch}
              onChange={(event) => setResourceSearch(event.target.value)}
              placeholder="Search resources"
              aria-label="Search shared resources"
            />
          </label>
          <div className="mt-3 space-y-2" role="tabpanel">
            {resources.length ? (
              resources.slice(0, 12).map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="workspace-resource-row"
                >
                  <span className="workspace-resource-icon" aria-hidden="true">
                    {resource.type === 'image' ? (
                      <Image size={14} strokeWidth={1.8} />
                    ) : resource.type === 'file' ? (
                      <FileText size={14} strokeWidth={1.8} />
                    ) : (
                      <Link2 size={14} strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{resource.title}</span>
                    <span className="workspace-muted block truncate text-[11px]">
                      {resource.source || new URL(resource.url, window.location.origin).hostname}
                    </span>
                  </span>
                </a>
              ))
            ) : (
              <p className="workspace-muted py-2 text-[11px] leading-5">
                No {resourceType} resources have been shared in this channel.
              </p>
            )}
          </div>
        </section>

        <section className="mt-7 border-t border-workspace-border pt-6">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" />
            Upcoming Events
          </h2>
          <div className="workspace-empty-card mt-3 flex items-center gap-2">
            <Users size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[11px] leading-5">
              Events are not available in this phase.
            </span>
          </div>
        </section>
      </div>
    </aside>
  );
}
