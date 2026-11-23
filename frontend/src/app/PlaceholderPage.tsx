import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/common/BrandMark';
import { LinkButton } from '../components/ui/LinkButton';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="container-page flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2.5" aria-label="devcommons home">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">devcommons</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="surface-card panel-shadow max-w-xl p-8 text-center sm:p-12">
          <p className="eyebrow">Coming in the next phase</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-muted">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton to="/">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to home
            </LinkButton>
            <LinkButton to="/register" variant="secondary">
              Join the community
            </LinkButton>
          </div>
        </div>
      </div>
    </main>
  );
}
