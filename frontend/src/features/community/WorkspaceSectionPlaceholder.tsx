import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceShell } from './CommunityWorkspacePage';

interface WorkspaceSectionPlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function WorkspaceSectionPlaceholder({
  title,
  description,
  icon,
}: WorkspaceSectionPlaceholderProps) {
  return (
    <WorkspaceShell>
      <div className="workspace-section-placeholder">
        <div className="workspace-state">
          <span className="workspace-state-icon" aria-hidden="true">
            {icon ?? <Info size={20} strokeWidth={1.7} />}
          </span>
          <p className="workspace-muted text-[10px] font-semibold uppercase tracking-[0.16em]">
            Not available in this phase
          </p>
          <h1 className="mt-3 text-lg font-semibold">{title}</h1>
          <p className="workspace-muted mt-2 max-w-md text-sm leading-6">{description}</p>
          <Link to="/app" className="workspace-button primary mt-5">
            Back to workspace
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}
