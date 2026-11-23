import {
  BookOpen,
  Compass,
  GitPullRequest,
  Layers,
  MessageSquare,
  Users,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Compass,
  GitPullRequest,
  Layers,
  MessageSquare,
  Users,
};

export function getLandingIcon(name: string): LucideIcon {
  return iconMap[name] ?? Compass;
}
