import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../../components/common/BrandMark';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { AuthEditorial } from './AuthEditorial';

interface AuthEditorialLayoutProps {
  variant: 'login' | 'register';
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthEditorialLayout({
  variant,
  title,
  description,
  children,
  footer,
}: AuthEditorialLayoutProps) {
  return (
    <div className={`auth-shell auth-split auth-split-${variant}`}>
      <header className="auth-split-header">
        <Link to="/" className="auth-split-brand" aria-label="devcommons home">
          <BrandMark className="border border-auth-border" />
          <span>devcommons</span>
        </Link>
        <ThemeToggle className="auth-theme-toggle" />
      </header>
      <main className="auth-split-main">
        <AuthEditorial variant={variant} />
        <section className="auth-split-form" aria-labelledby="auth-title">
          <div className="auth-form-inner auth-page-enter">
            <div className="auth-form-heading">
              <h1 id="auth-title" className="auth-page-title">
                {title}
              </h1>
              <p className="auth-page-description">{description}</p>
            </div>
            <div className="auth-form-content">{children}</div>
            {footer ? <footer className="auth-form-footer">{footer}</footer> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
