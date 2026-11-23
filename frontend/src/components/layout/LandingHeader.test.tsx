import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LandingHeader } from './LandingHeader';

describe('LandingHeader', () => {
  it('opens and closes the mobile navigation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingHeader />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close navigation' }));

    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });
});
