import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { THEME_STORAGE_KEY, useThemeStore } from '../../stores/theme.store';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ mode: 'light', resolvedTheme: 'light' });
  });

  it('persists and applies a light to dark theme change', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /theme mode: light/i }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: /theme mode: dark/i })).toBeInTheDocument();
  });

  it('cycles from dark to the system preference', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ mode: 'dark', resolvedTheme: 'dark' });
    document.documentElement.classList.add('dark');
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /theme mode: dark/i }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
