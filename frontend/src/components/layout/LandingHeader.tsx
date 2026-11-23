import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { BrandMark } from '../common/BrandMark';
import { LinkButton } from '../ui/LinkButton';

const navigation = [
  { label: 'Features', href: '#features' },
  { label: 'Communities', href: '#communities' },
  { label: 'Projects', href: '#projects' },
  { label: 'Events', href: '#events' },
  { label: 'How it works', href: '#how-it-works' },
];

const AUTHENTICATED_HOME_PATH = '/app';

function HeaderAuthActions({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean;
  onNavigate?: () => void;
}) {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return (
      <LinkButton
        to={AUTHENTICATED_HOME_PATH}
        className={stacked ? 'w-full sm:w-auto sm:flex-1' : undefined}
        onClick={onNavigate}
      >
        Access Community
        <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
      </LinkButton>
    );
  }

  if (stacked) {
    return (
      <>
        <LinkButton
          to="/login"
          variant="secondary"
          className="w-full sm:w-auto sm:flex-1"
          onClick={onNavigate}
        >
          Sign in
        </LinkButton>
        <LinkButton to="/register" className="w-full sm:w-auto sm:flex-1" onClick={onNavigate}>
          Join free
        </LinkButton>
      </>
    );
  }

  return (
    <>
      <Link to="/login" className="nav-link hidden sm:inline-flex">
        Sign in
      </Link>
      <LinkButton to="/register" className="hidden sm:inline-flex">
        Join free
      </LinkButton>
    </>
  );
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background">
      <div className="container-page flex h-[68px] items-center justify-between gap-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="devcommons home">
          <BrandMark />
          <span className="truncate text-[15px] font-bold tracking-[-0.03em]">devcommons</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          <HeaderAuthActions />
          <button
            type="button"
            className="btn btn-quiet h-11 w-11 px-0 lg:hidden"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-controls="landing-mobile-nav"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="landing-mobile-nav"
          className="border-t border-line bg-background lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="container-page flex flex-col py-6">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-line py-4 text-[12px] font-medium uppercase tracking-[0.08em]"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HeaderAuthActions stacked onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
