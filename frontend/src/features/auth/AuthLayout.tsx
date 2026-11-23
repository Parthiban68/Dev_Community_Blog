import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/common/BrandMark';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function AuthLayout({ title, description, children, footer, wide = false }: AuthLayoutProps) {
  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5" aria-label="devcommons home">
          <BrandMark className="border border-auth-border" />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">devcommons</span>
        </Link>
        <ThemeToggle className="auth-theme-toggle" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <section aria-labelledby="auth-title" className={`auth-card ${wide ? 'max-w-lg' : 'max-w-md'}`}>
          <h1 id="auth-title" className="text-2xl font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="auth-muted mt-2 text-sm leading-6">{description}</p>
          <div className="mt-6">{children}</div>
        </section>
      </main>
      {footer ? (
        <footer className="flex justify-center px-4 pb-8 text-sm">{footer}</footer>
      ) : null}
    </div>
  );
}
