import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { LandingHeader } from '../../components/layout/LandingHeader';
import {
  fetchFeaturedCommunities,
  fetchFeaturedProjects,
  fetchPlatform,
  fetchUpcomingEvents,
  landingKeys,
} from '../../services/landing.service';
import { CoreFeatures } from './CoreFeatures';
import { FeaturedSection } from './FeaturedSection';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { PlatformIntroduction } from './PlatformIntroduction';
import { RegistrationCta } from './RegistrationCta';

function LandingSkeleton() {
  return (
    <div className="container-page py-24" aria-label="Loading landing page">
      <div className="h-3 w-32 animate-pulse bg-line" />
      <div className="mt-10 h-24 w-full max-w-4xl animate-pulse bg-line sm:h-36" />
      <div className="mt-8 h-4 w-full max-w-xl animate-pulse bg-line" />
      <div className="mt-12 grid gap-6 border-t border-line pt-10 lg:grid-cols-2">
        <div className="h-10 w-64 animate-pulse bg-line" />
        <div className="h-64 animate-pulse bg-line" />
      </div>
    </div>
  );
}

export function LandingPage() {
  const { data: platform, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: landingKeys.platform,
    queryFn: fetchPlatform,
  });

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        {isPending ? <LandingSkeleton /> : null}

        {isError || !platform ? (
          <div className="container-page py-24">
            <div className="border-y border-line py-16 text-center">
              <h1 className="text-3xl font-bold tracking-[-0.04em]">
                The landing content could not be loaded
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-secondary">
                No placeholder copy is shown. Check that the API is running and try again.
              </p>
              <Button variant="secondary" className="mt-7" onClick={() => void refetch()} disabled={isFetching}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {platform ? (
          <>
            <Hero platform={platform} />
            <PlatformIntroduction platform={platform} />
            <CoreFeatures features={platform.features} />

            <FeaturedSection
              id="communities"
              eyebrow="Featured communities"
              title="Find a room where your technology makes sense."
              description="Focused communities for the tools, languages and practices developers use every day."
              queryKey={landingKeys.featuredCommunities}
              queryFn={fetchFeaturedCommunities}
              section="communities"
              viewAllLabel="Browse communities"
              viewAllHref="/communities"
            />

            <FeaturedSection
              id="projects"
              eyebrow="Featured projects"
              title="Build something worth shipping."
              description="Discover work with clear goals, open roles and collaborators who care about the craft."
              queryKey={landingKeys.featuredProjects}
              queryFn={fetchFeaturedProjects}
              section="projects"
              viewAllLabel="Browse projects"
              viewAllHref="/projects"
            />

            <FeaturedSection
              id="events"
              eyebrow="Upcoming events"
              title="Learn live with the community."
              description="Workshops, build sessions and conversations led by people who do the work."
              queryKey={landingKeys.upcomingEvents}
              queryFn={fetchUpcomingEvents}
              section="events"
              viewAllLabel="View events"
              viewAllHref="/events"
            />

            <HowItWorks steps={platform.steps} />
            <RegistrationCta cta={platform.cta} />
          </>
        ) : null}
      </main>
      <LandingFooter />
    </div>
  );
}
