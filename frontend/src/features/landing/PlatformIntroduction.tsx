import { Reveal } from '../../components/ui/Reveal';
import type { PlatformInfo } from '../../types/landing';

interface PlatformIntroductionProps {
  platform: PlatformInfo;
}

export function PlatformIntroduction({ platform }: PlatformIntroductionProps) {
  const { introduction } = platform;

  return (
    <section id="about" className="border-b border-line">
      <div className="container-page section-padding">
        <Reveal>
          <p className="eyebrow">{introduction.eyebrow}</p>
          <h2 className="editorial-heading max-w-5xl">{introduction.title}</h2>
          <p className="editorial-copy">{introduction.description}</p>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-16 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-line pt-4"
        >
          <span className="eyebrow">One global community</span>
          <span className="eyebrow">01 — 03</span>
        </Reveal>

        <div className="mt-8 grid border-l border-t border-line sm:grid-cols-3">
          {introduction.pillars.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delay={index * 90}
              className={`border-b border-r border-line ${index > 0 ? 'lg:border-l-0' : ''}`}
            >
              <article className="flex h-full min-w-0 flex-col p-6 sm:p-8 lg:p-10">
                <span className="text-[clamp(4rem,8vw,7rem)] font-light leading-[0.8] tracking-[-0.08em]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-10 text-xl font-bold tracking-[-0.035em] sm:text-2xl">{pillar.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-secondary">{pillar.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
