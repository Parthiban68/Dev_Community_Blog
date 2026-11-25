import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface WorkspaceDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  side?: 'left' | 'right';
  children: ReactNode;
}

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function WorkspaceDrawer({
  open,
  title,
  onClose,
  side = 'right',
  children,
}: WorkspaceDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(focusableSelector);
    focusables?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="workspace-modal-backdrop" onMouseDown={() => onCloseRef.current()}>
      <div
        ref={panelRef}
        className={`workspace-drawer ${side === 'left' ? 'workspace-drawer-left' : 'workspace-drawer-right'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="workspace-drawer-header">
          <h2 id={titleId} className="truncate text-sm font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="workspace-icon-button h-9 w-9"
            onClick={() => onCloseRef.current()}
            aria-label="Close panel"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="workspace-drawer-body">{children}</div>
      </div>
    </div>
  );
}
