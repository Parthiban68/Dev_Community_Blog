export function HeroVisual() {
  return (
    <div className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>Developer vocabulary</span>
        <span>01 / 05</span>
      </div>

      <div className="mt-8 sm:mt-10">
        <div className="font-black uppercase leading-[0.82] tracking-[-0.08em] text-[clamp(2.6rem,8.5vw,8rem)] [overflow-wrap:anywhere]">
          CONNECT
        </div>
        <div className="mt-4 flex justify-end sm:mt-5">
          <span className="font-light uppercase leading-[0.85] tracking-[-0.06em] text-[clamp(2.2rem,6.8vw,6.2rem)] [overflow-wrap:anywhere]">
            LEARN
          </span>
        </div>
        <div className="mt-5 flex items-start gap-4 sm:mt-7 sm:gap-6">
          <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted">/ 03</span>
          <span className="font-bold uppercase leading-[0.85] tracking-[-0.07em] text-[clamp(2.4rem,7.4vw,7rem)] [overflow-wrap:anywhere]">
            SHARE
          </span>
        </div>
        <div className="mt-5 font-black uppercase leading-[0.82] tracking-[-0.08em] text-[clamp(2.8rem,9vw,8.5rem)] [overflow-wrap:anywhere] sm:mt-7">
          BUILD
        </div>
        <div className="mt-6 flex justify-center sm:mt-8">
          <span className="font-light uppercase leading-[0.9] tracking-[-0.07em] text-[clamp(1.8rem,5vw,4.6rem)] [overflow-wrap:anywhere]">
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
