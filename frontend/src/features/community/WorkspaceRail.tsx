import {
  Bell,
  CalendarDays,
  Compass,
  Home,
  Layers,
  Mail,
  MessageSquare,
  Settings,
  UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandMark } from '../../components/common/BrandMark';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const primaryItems = [
  { label: 'Home', to: '/app/home', icon: Home },
  { label: 'Communities', to: '/app', icon: Layers },
  { label: 'Discussions', to: '/app/discussions', icon: MessageSquare },
  { label: 'Projects', to: '/app/projects', icon: Layers },
  { label: 'Events', to: '/app/events', icon: CalendarDays },
  { label: 'Discover Developers', to: '/app/discover', icon: Compass },
];

const accountItems = [
  { label: 'Messages', to: '/app/messages', icon: Mail },
  { label: 'Notifications', to: '/app/notifications', icon: Bell },
  { label: 'Profile', to: '/app/profile', icon: UserRound },
  { label: 'Settings', to: '/app/settings', icon: Settings },
];

interface WorkspaceRailProps {
  className?: string;
  expanded?: boolean;
  onNavigate?: () => void;
}

export function WorkspaceRail({ className = '', expanded = false, onNavigate }: WorkspaceRailProps) {
  function renderItem(item: (typeof primaryItems)[number]) {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/app'}
        onClick={onNavigate}
        title={item.label}
        className={({ isActive }) =>
          `workspace-rail-item ${isActive ? 'active' : ''} ${expanded ? 'expanded' : ''}`
        }
      >
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        {expanded ? <span>{item.label}</span> : null}
      </NavLink>
    );
  }

  return (
    <nav
      className={`workspace-rail ${expanded ? 'workspace-rail-expanded' : ''} ${className}`}
      aria-label="Workspace navigation"
    >
      <NavLink
        to="/"
        onClick={onNavigate}
        className="workspace-rail-brand"
        aria-label="devcommons home"
        title="devcommons home"
      >
        <BrandMark className="workspace-rail-brand-mark" />
      </NavLink>
      {expanded ? <p className="workspace-rail-label">MENU</p> : null}
      <div className="workspace-rail-items">{primaryItems.map(renderItem)}</div>
      <div className="workspace-rail-divider" role="separator" />
      <div className="workspace-rail-items">{accountItems.map(renderItem)}</div>
      <div className="workspace-rail-bottom">
        <ThemeToggle className="workspace-rail-theme" />
      </div>
    </nav>
  );
}
