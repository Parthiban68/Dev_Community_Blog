import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../../components/ui/Reveal';
import type { PlatformInfo } from '../../types/landing';

interface RegistrationCtaProps {
  cta: PlatformInfo['cta'];
}

export function RegistrationCta({ cta }: RegistrationCtaProps) {
  return (
    <section className="bg-foreground text-background">
      <div className="container-page py-24 lg:py-36">
        <Reveal>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-background/60">
            Join devcommons
          </p>
          <h2 className="mt-8 max-w-6xl text-[clamp(3rem,8vw,7.5rem)] font-black uppercase leading-[0.9] tracking-[-0.07em]">
            {cta.title}
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-8 text-background/70">{cta.description}</p>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link
              to={cta.primaryHref}
              className="inline-flex h-11 items-center justify-center gap-2 bg-background px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-line"
            >
              {cta.primaryLabel}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link
              to={cta.secondaryHref}
              className="inline-flex h-11 items-center justify-center border border-background px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-background transition-colors hover:bg-background hover:text-foreground"
            >
              {cta.secondaryLabel}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
