export function HeroVisual() {
  return (
    <div className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>Developer vocabulary</span>
        <span>01 / 05</span>
      </div>

      <div className="mt-10">
        <div className="font-black uppercase leading-[0.82] tracking-[-0.08em] text-[clamp(3.4rem,8.5vw,8rem)]">
          CONNECT
        </div>
        <div className="mt-5 flex justify-end">
          <span className="font-light uppercase leading-[0.85] tracking-[-0.06em] text-[clamp(2.8rem,6.8vw,6.2rem)]">
            LEARN
          </span>
        </div>
        <div className="mt-7 flex items-start gap-6">
          <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted">/ 03</span>
          <span className="font-bold uppercase leading-[0.85] tracking-[-0.07em] text-[clamp(3rem,7.4vw,7rem)]">
            SHARE
          </span>
        </div>
        <div className="mt-7 font-black uppercase leading-[0.82] tracking-[-0.08em] text-[clamp(3.8rem,9vw,8.5rem)]">
          BUILD
        </div>
        <div className="mt-8 flex justify-center">
          <span className="font-light uppercase leading-[0.9] tracking-[-0.07em] text-[clamp(2.2rem,5vw,4.6rem)]">
            COLLABORATE
          </span>
        </div>
      </div>

      <div className="mt-10 flex items-baseline justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>One global community</span>
        <span>dev / commons</span>
      </div>
    </div>
  );
}
