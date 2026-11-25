import { Bell, CircleHelp, Menu, PanelLeft, Search, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './ToastProvider';
import { useWorkspace } from './workspace-context';

interface WorkspaceTopBarProps {
  onOpenNavigation: () => void;
  onOpenSidebar: () => void;
  onOpenContext: () => void;
}

function shortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  const platform = navigator.platform ?? '';
  return /Mac|iPhone|iPad/.test(platform) ? '⌘K' : 'Ctrl K';
}

export function WorkspaceTopBar({
  onOpenNavigation,
  onOpenSidebar,
  onOpenContext,
}: WorkspaceTopBarProps) {
  const { community, channel, search, setSearch } = useWorkspace();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    function focusFromEvent() {
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('workspace:focus-search', focusFromEvent);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('workspace:focus-search', focusFromEvent);
    };
  }, []);

  return (
    <header className="workspace-topbar">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          className="workspace-icon-button h-9 w-9 md:hidden"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
        >
          <Menu size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="workspace-icon-button h-9 w-9 lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open channels"
        >
          <PanelLeft size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-xs">
            <li className="min-w-0">
              <Link to="/app" className="workspace-muted truncate hover:underline">
                {community?.name ?? 'Community'}
              </Link>
            </li>
            <li className="workspace-muted" aria-hidden="true">
              /
            </li>
            <li className="min-w-0 font-medium">
              <span className="block truncate">{channel?.name ?? 'Workspace'}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <label className="workspace-search">
          <Search size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Search channels</span>
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search channels"
            aria-label="Search channels"
          />
          <kbd className="workspace-kbd" aria-hidden="true">
            {shortcutLabel()}
          </kbd>
        </label>
        <button
          type="button"
          className="workspace-icon-button h-9 w-9"
          onClick={() => showToast('Help is not available in this phase.', 'info')}
          aria-label="Help"
          title="Help"
        >
          <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="workspace-icon-button h-9 w-9"
          onClick={() =>
            showToast('Notifications are not available in this phase.', 'info')
          }
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="workspace-icon-button h-9 w-9 xl:hidden"
          onClick={onOpenContext}
          aria-label="Open details"
        >
          <Users size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
