interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : undefined}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className={`editorial-heading ${centered ? 'mx-auto' : ''}`}>{title}</h2>
      {description ? (
        <p className={`editorial-copy ${centered ? 'mx-auto' : ''}`}>{description}</p>
      ) : null}
    </div>
  );
}
