import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../stores/theme.store';

const nextMode: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const modeIcon = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mode, toggle } = useTheme();
  const Icon = modeIcon[mode];
  const target = nextMode[mode];

  return (
    <button
      type="button"
      className={`btn btn-quiet h-10 w-10 px-0 ${className}`}
      onClick={toggle}
      aria-label={`Theme mode: ${mode}. Switch to ${target}.`}
      title={`Theme: ${mode}`}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
