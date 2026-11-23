interface FeatureVisualProps {
  id: string;
  large?: boolean;
}

export function FeatureVisual({ id, large = false }: FeatureVisualProps) {
  if (id === 'connect') {
    return (
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-line pb-3" aria-hidden="true">
        <span className={`${large ? 'text-5xl' : 'text-3xl'} font-black tracking-[-0.08em]`}>{'</>'}</span>
        <span className={`${large ? 'text-4xl' : 'text-2xl'} font-light tracking-[-0.06em]`}>{'{ }'}</span>
        <span className={`${large ? 'text-4xl' : 'text-2xl'} font-bold tracking-[-0.06em]`}>#</span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted">peers</span>
      </div>
    );
  }

  if (id === 'share') {
    return (
      <div className="space-y-2 border-l border-line pl-5 text-[11px] uppercase tracking-[0.12em] text-muted" aria-hidden="true">
        <div className="font-bold text-foreground">POST / 01</div>
        <div>MARKDOWN → ARTICLE</div>
        <div>CODE / READABLE</div>
        <div className="pt-2 font-medium text-foreground">PUBLISH → SHARE</div>
      </div>
    );
  }

  if (id === 'questions') {
    return (
      <div className="flex items-baseline gap-4" aria-hidden="true">
        <span className={`${large ? 'text-7xl' : 'text-5xl'} font-light leading-none tracking-[-0.09em]`}>Q</span>
        <span className="h-px flex-1 bg-line" />
        <span className={`${large ? 'text-7xl' : 'text-5xl'} font-black leading-none tracking-[-0.09em]`}>A</span>
      </div>
    );
  }

  if (id === 'collaborate') {
    return (
      <div className="flex flex-wrap items-center gap-3 border-y border-line py-3" aria-hidden="true">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">role</span>
        <span className="text-base font-bold tracking-[-0.03em]">frontend</span>
        <span className="text-lg font-light">→</span>
        <span className="text-base font-bold tracking-[-0.03em]">backend</span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted">shared work</span>
      </div>
    );
  }

  if (id === 'communities') {
    return (
      <div
        className={`grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 font-bold tracking-[-0.04em] [overflow-wrap:anywhere] sm:gap-x-4 ${large ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}
        aria-hidden="true"
      >
        <span>REACT</span>
        <span>NODE.JS</span>
        <span>TYPESCRIPT</span>
        <span>PYTHON</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-secondary" aria-hidden="true">
      <span className="font-bold text-foreground">TypeScript</span>
      <span>React</span>
      <span>Rust</span>
      <span>Go</span>
      <span>Design systems</span>
    </div>
  );
}
