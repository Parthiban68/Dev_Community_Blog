import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import type { LandingFeature } from '../../types/landing';
import { FeatureVisual } from './FeatureVisual';

interface CoreFeaturesProps {
  features: LandingFeature[];
}

const spanClasses = [
  'sm:col-span-2 lg:col-span-6 lg:row-span-2',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
  'sm:col-span-2 lg:col-span-6',
];

export function CoreFeatures({ features }: CoreFeaturesProps) {
  return (
    <section id="features" className="border-b border-line">
      <div className="container-page section-padding">
        <Reveal>
          <SectionHeading
            eyebrow="Core features"
            title="Everything you need to grow as a developer."
            description="A focused set of tools for sharing knowledge, finding collaborators and doing your best work in public."
          />
        </Reveal>

        <div className="mt-16 grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(230px,auto)]">
          {features.map((feature, index) => (
            <Reveal
              key={feature.id}
              delay={(index % 3) * 80}
              className={`h-full border-b border-r border-line ${spanClasses[index % spanClasses.length]}`}
            >
              <article className="flex h-full flex-col p-6 lg:p-10">
                <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
                  <span>Feature</span>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>

                <div className="mt-10">
                  <FeatureVisual id={feature.id} large={index === 0} />
                </div>

                <h3 className="mt-auto pt-10 text-[clamp(1.5rem,2.2vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.045em]">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-secondary">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
