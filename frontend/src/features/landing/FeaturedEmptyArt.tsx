type FeaturedSectionKey = 'communities' | 'projects' | 'events';

interface FeaturedEmptyArtProps {
  section: FeaturedSectionKey;
}

const communityCategories = ['REACT', 'NODE.JS', 'TYPESCRIPT', 'PYTHON', 'AI / ML', 'OPEN SOURCE'];

export function FeaturedEmptyArt({ section }: FeaturedEmptyArtProps) {
  if (section === 'communities') {
    return (
      <div className="border-y border-line py-10" aria-hidden="true">
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {communityCategories.map((category, index) => (
            <span
              key={category}
              className={
                index % 2 === 0
                  ? 'text-[clamp(1.5rem,4vw,3.4rem)] font-black uppercase leading-none tracking-[-0.06em] [overflow-wrap:anywhere]'
                  : 'text-[clamp(1.5rem,4vw,3.4rem)] font-light uppercase leading-none tracking-[-0.06em] [overflow-wrap:anywhere]'
              }
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'projects') {
    return (
      <div className="border-y border-line" aria-hidden="true">
        {['SCOPE', 'ROLE', 'STACK'].map((label, index) => (
          <div
            key={label}
            className="flex items-baseline justify-between border-b border-line py-5 last:border-b-0"
          >
            <span className="text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-none tracking-[-0.06em]">
              {label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">0{index + 1}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 border-y border-line" aria-hidden="true">
      {['01', '02', '03'].map((number) => (
        <div key={number} className="border-r border-line py-8 text-center last:border-r-0">
          <span className="text-[clamp(2.5rem,6vw,5rem)] font-light leading-none tracking-[-0.08em]">
            {number}
          </span>
        </div>
      ))}
    </div>
  );
}
