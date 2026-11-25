import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toneIcon = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      const timer = window.setTimeout(() => dismiss(id), 4500);
      timers.current.push(timer);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="workspace-toast-viewport"
        aria-label="Workspace messages"
        role="region"
      >
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <div
              key={toast.id}
              className={`workspace-toast workspace-toast-${toast.tone}`}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
              <span className="min-w-0 flex-1 break-words">{toast.message}</span>
              <button
                type="button"
                className="workspace-icon-button h-7 w-7"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss message"
              >
                <X size={14} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
