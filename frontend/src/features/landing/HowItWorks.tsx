import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import type { LandingStep } from '../../types/landing';

interface HowItWorksProps {
  steps: LandingStep[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="border-b border-line">
      <div className="container-page section-padding">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="A simple path from reading to building."
            description="Start where you are. Join the conversations that matter and grow through work you share."
          />
        </Reveal>

        <div className="mt-16 border-t border-line sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal
              key={step.number}
              delay={index * 90}
              className="min-w-0 border-b border-line last:border-b-0 sm:border-r sm:even:border-r-0 sm:[&:nth-child(n+3)]:border-b-0 lg:border-b-0 lg:border-r lg:even:border-r lg:last:border-r-0"
            >
              <article className="flex h-full min-w-0 flex-col py-10 sm:px-8 lg:px-6 lg:py-12 xl:px-8">
                <span className="text-[clamp(4rem,8vw,7rem)] font-light leading-[0.8] tracking-[-0.08em]">
                  {step.number}
                </span>
                <h3 className="mt-10 text-xl font-bold tracking-[-0.035em] sm:text-2xl">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-secondary">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
