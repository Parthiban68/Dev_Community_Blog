import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../common/BrandMark';
import { LinkButton } from '../ui/LinkButton';

const navigation = [
  { label: 'Features', href: '#features' },
  { label: 'Communities', href: '#communities' },
  { label: 'Projects', href: '#projects' },
  { label: 'Events', href: '#events' },
  { label: 'How it works', href: '#how-it-works' },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background">
      <div className="container-page flex h-[68px] items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3" aria-label="devcommons home">
          <BrandMark />
          <span className="text-[15px] font-bold tracking-[-0.03em]">devcommons</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link to="/login" className="nav-link hidden sm:inline-flex">
            Sign in
          </Link>
          <LinkButton to="/register" className="hidden sm:inline-flex">
            Join free
          </LinkButton>
          <button
            type="button"
            className="btn btn-quiet h-10 w-10 px-0 lg:hidden"
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
            <div className="mt-6 flex gap-3">
              <LinkButton to="/login" variant="secondary" className="flex-1">
                Sign in
              </LinkButton>
              <LinkButton to="/register" className="flex-1">
                Join community
              </LinkButton>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
