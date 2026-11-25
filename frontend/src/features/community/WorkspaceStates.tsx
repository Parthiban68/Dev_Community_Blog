import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface WorkspaceStatesProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

interface WorkspaceErrorStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function WorkspaceEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: WorkspaceStatesProps) {
  return (
    <div className="workspace-state">
      {icon ? <span className="workspace-state-icon" aria-hidden="true">{icon}</span> : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="workspace-muted mt-2 max-w-sm text-sm leading-6">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="workspace-button secondary mt-4" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function WorkspaceErrorState({
  title = 'This content could not be loaded',
  description,
  actionLabel = 'Try again',
  onAction,
}: WorkspaceErrorStateProps) {
  return (
    <div className="workspace-state" role="alert">
      <span className="workspace-state-icon workspace-danger-icon" aria-hidden="true">
        <CircleAlert size={19} strokeWidth={1.8} />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="workspace-muted mt-2 max-w-sm text-sm leading-6">{description}</p>
      {onAction ? (
        <button type="button" className="workspace-button secondary mt-4" onClick={onAction}>
          <RefreshCw size={14} strokeWidth={1.9} aria-hidden="true" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="workspace-skeleton-row" aria-hidden="true">
      <div className="workspace-skeleton-avatar" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="workspace-skeleton-line h-3 w-32" />
        <div className="workspace-skeleton-line h-3 w-4/5" />
        <div className="workspace-skeleton-line h-3 w-2/5" />
      </div>
    </div>
  );
}

export function WorkspaceSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading workspace content">
      {Array.from({ length: rows }, (_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
}
