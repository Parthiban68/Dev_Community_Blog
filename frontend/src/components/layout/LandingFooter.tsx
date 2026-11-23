import { Link } from 'react-router-dom';
import { BrandMark } from '../common/BrandMark';
import { Reveal } from '../ui/Reveal';

const columns = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Join the community', href: '/register' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Communities', href: '/communities' },
      { label: 'Projects', href: '/projects' },
      { label: 'Events', href: '/events' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create an account', href: '/register' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="container-page grid gap-16 py-16 lg:grid-cols-[1.4fr_2fr] lg:py-24">
        <Reveal>
          <div>
            <Link to="/" className="flex items-center gap-3" aria-label="devcommons home">
              <BrandMark />
              <span className="text-[15px] font-bold tracking-[-0.03em]">devcommons</span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-secondary">
              An independent global community for people who learn, build and share in the open.
            </p>
            <p className="mt-5 text-sm font-medium">Build connections. Create together.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((column, index) => (
            <Reveal key={column.title} delay={index * 70}>
              <div>
                <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                  {column.title}
                </h3>
                <ul className="mt-6 space-y-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link
                          to={link.href}
                          className="text-sm text-foreground underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-foreground underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-7 text-[11px] uppercase tracking-[0.08em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} devcommons. One global community.</span>
          <span>Independent · Developer-focused · Built for collaboration</span>
        </div>
      </div>
    </footer>
  );
}
