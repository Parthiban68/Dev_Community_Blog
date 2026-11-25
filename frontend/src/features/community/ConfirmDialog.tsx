import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="workspace-modal-backdrop" onMouseDown={onCancel}>
      <div
        className="workspace-modal w-full max-w-md"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex gap-3">
          <span className="workspace-danger-icon" aria-hidden="true">
            <AlertTriangle size={18} strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="workspace-muted mt-2 text-sm leading-6">
              {description}
            </p>
          </div>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="workspace-button secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="workspace-button danger"
            onClick={onConfirm}
            ref={confirmRef}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
