import { useQuery, type QueryKey } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import type { FeaturedCollection, FeaturedItem } from '../../types/landing';
import { FeaturedEmptyArt } from './FeaturedEmptyArt';

type FeaturedSectionKey = 'communities' | 'projects' | 'events';

interface FeaturedSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  queryKey: QueryKey;
  queryFn: () => Promise<FeaturedCollection>;
  section: FeaturedSectionKey;
  viewAllLabel: string;
  viewAllHref: string;
}

interface RecordListProps {
  section: FeaturedSectionKey;
  items: FeaturedItem[];
}

function DetailsLink({ to }: { to: string }) {
  return (
    <Link to={to} className="editorial-link">
      View details
      <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}

function MetaList({ meta }: { meta: string[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-muted">
      {meta.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function RecordList({ section, items }: RecordListProps) {
  if (section === 'communities') {
    return (
      <div className="border-t border-line">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 70} className="border-b border-line">
            <article className="grid gap-6 py-8 lg:grid-cols-[90px_minmax(0,1fr)_auto] lg:items-end lg:py-10">
              <span className="text-[clamp(2.5rem,5vw,4rem)] font-light leading-none tracking-[-0.08em]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[clamp(1.8rem,3.4vw,3.2rem)] font-black uppercase leading-[0.95] tracking-[-0.06em]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary">{item.description}</p>
                <MetaList meta={item.meta} />
              </div>
              <DetailsLink to={item.href} />
            </article>
          </Reveal>
        ))}
      </div>
    );
  }

  if (section === 'projects') {
    return (
      <div className="grid border-l border-t border-line lg:grid-cols-12">
        {items.map((item, index) => (
          <Reveal
            key={item.id}
            delay={index * 70}
            className={`border-b border-r border-line ${
              index === 0 ? 'lg:col-span-7' : 'lg:col-span-5'
            }`}
          >
            <article className="flex h-full flex-col p-6 lg:p-10">
              <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>Project</span>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-10 text-[clamp(1.8rem,3.2vw,3.2rem)] font-bold leading-[1] tracking-[-0.055em]">
                {item.title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-secondary">{item.description}</p>
              <MetaList meta={item.meta} />
              <div className="mt-auto pt-10">
                <DetailsLink to={item.href} />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t border-line">
      {items.map((item, index) => (
        <Reveal key={item.id} delay={index * 70} className="border-b border-line">
          <article className="grid gap-6 py-8 lg:grid-cols-[110px_minmax(0,1fr)_auto] lg:items-end lg:py-10">
            <span className="text-[clamp(3rem,6vw,5.5rem)] font-light leading-none tracking-[-0.08em]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-[clamp(1.6rem,3vw,3rem)] font-bold leading-[1.02] tracking-[-0.05em]">
                {item.title}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary">{item.description}</p>
              <MetaList meta={item.meta} />
            </div>
            <DetailsLink to={item.href} />
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export function FeaturedSection({
  id,
  eyebrow,
  title,
  description,
  queryKey,
  queryFn,
  section,
  viewAllLabel,
  viewAllHref,
}: FeaturedSectionProps) {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn,
  });

  return (
    <section id={id} className="border-b border-line">
      <div className="container-page section-padding">
        <Reveal>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow={eyebrow} title={title} description={description} />
            <Link to={viewAllHref} className="editorial-link self-start sm:self-auto">
              {viewAllLabel}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-16">
          {isPending ? (
            <div className="border-t border-line" aria-label="Loading">
              {[0, 1, 2].map((item) => (
                <div key={item} className="animate-pulse border-b border-line py-10">
                  <div className="h-3 w-24 bg-line" />
                  <div className="mt-6 h-10 w-2/3 bg-line" />
                  <div className="mt-4 h-3 w-full max-w-xl bg-line" />
                </div>
              ))}
            </div>
          ) : null}

          {isError ? (
            <div className="border-y border-line px-6 py-14 text-center lg:px-12">
              <h3 className="text-2xl font-bold tracking-[-0.04em]">Content is temporarily unavailable</h3>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-secondary">
                The API could not be reached. No placeholder records are shown.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => void refetch()} disabled={isFetching}>
                Try again
              </Button>
            </div>
          ) : null}

          {data && data.items.length === 0 ? (
            <div>
              <FeaturedEmptyArt section={section} />
              <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-[-0.04em]">{data.emptyLabel}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{data.message}</p>
                </div>
                <Link to={viewAllHref} className="editorial-link self-start sm:self-auto">
                  {viewAllLabel}
                  <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : null}

          {data && data.items.length > 0 ? <RecordList section={section} items={data.items} /> : null}
        </div>
      </div>
    </section>
  );
}
