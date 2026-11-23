interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center bg-foreground text-background ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M6 10.5 12 16l-6 5.5" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M14.5 22.5h11" />
        <circle cx="24" cy="9.5" r="2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
