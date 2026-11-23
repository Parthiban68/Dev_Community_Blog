import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../../components/ui/Reveal';
import type { PlatformInfo } from '../../types/landing';
import { HeroVisual } from './HeroVisual';

interface HeroProps {
  platform: PlatformInfo;
}

export function Hero({ platform }: HeroProps) {
  return (
    <section id="top" className="border-b border-line">
      <div className="container-page pb-24 pt-12 lg:pb-32 lg:pt-16">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="eyebrow">A global developer community</p>
            <p className="eyebrow hidden sm:block">devcommons / 01</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.65fr)] xl:gap-20">
          <Reveal delay={80} className="min-w-0">
            <h1 aria-label={platform.tagline} className="hero-display">
              <span className="block font-black uppercase [overflow-wrap:anywhere]">
                Build connections.
              </span>
              <span className="mt-3 block font-light uppercase [overflow-wrap:anywhere] xl:ml-[11%]">
                Create together.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={140} className="min-w-0 self-end">
            <p className="text-[15px] leading-7 text-secondary sm:text-base sm:leading-8">
              {platform.description}
            </p>
            <p className="mt-8 border-t border-line pt-5 text-[13px] leading-6 text-muted">
              {platform.positioning}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link to={platform.cta.primaryHref} className="editorial-link">
                {platform.cta.primaryLabel}
                <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link to={platform.cta.secondaryHref} className="editorial-link">
                {platform.cta.secondaryLabel}
                <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-24 lg:mt-32">
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}
