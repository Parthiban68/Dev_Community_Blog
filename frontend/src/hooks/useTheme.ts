import { useLayoutEffect, useEffect } from 'react';
import { useThemeStore } from '../stores/theme.store';

export function useTheme() {
  const mode = useThemeStore((state) => state.mode);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setMode = useThemeStore((state) => state.setMode);
  const toggle = useThemeStore((state) => state.toggle);
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);

  useLayoutEffect(() => {
    syncSystemTheme();
  }, [syncSystemTheme]);

  useEffect(() => {
    if (mode !== 'system' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => syncSystemTheme();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [mode, syncSystemTheme]);

  return { mode, resolvedTheme, setMode, toggle };
}
