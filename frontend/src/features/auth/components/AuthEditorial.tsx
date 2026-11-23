interface AuthEditorialProps {
  variant: 'login' | 'register';
}

const editorialContent = {
  login: {
    index: '01 / 02',
    kicker: 'YOUR GLOBAL DEVELOPER COMMUNITY',
    headline: 'Good to have you back.',
    description: 'Pick up where you left off. Your community is waiting.',
    words: ['CONNECT.', 'LEARN.', 'BUILD.'],
    footer: 'SECURE ACCESS',
  },
  register: {
    index: '02 / 02',
    kicker: 'ONE COMMUNITY. MANY POSSIBILITIES.',
    headline: 'Your next chapter starts here.',
    description:
      'Meet developers, share what you know and build something meaningful together.',
    words: ['CONNECT.', 'CREATE.', 'COLLABORATE.'],
    footer: 'OPEN COMMUNITY',
  },
} as const;

export function AuthEditorial({ variant }: AuthEditorialProps) {
  const content = editorialContent[variant];

  return (
    <aside className={`auth-editorial auth-editorial-${variant}`} aria-label="devcommons community introduction">
      <div className="auth-editorial-inner">
        <div className="auth-editorial-top">
          <span className="auth-editorial-brand">devcommons</span>
          <span className="auth-editorial-index">{content.index}</span>
        </div>
        <div className="auth-editorial-main">
          <p className="auth-editorial-kicker">{content.kicker}</p>
          <h2 className="auth-editorial-headline">{content.headline}</h2>
          <p className="auth-editorial-description">{content.description}</p>
          <div className="auth-editorial-words" aria-hidden="true">
            {content.words.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </div>
        <div className="auth-editorial-footer">
          <span>DEV / COMMONS</span>
          <span>{content.footer}</span>
        </div>
      </div>
    </aside>
  );
}
