import logoAsset from '@/assets/logo-rui.svg';

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <img
      src={logoAsset}
      alt="Logótipo O Rui dos Computadores"
      width={40}
      height={40}
      className={`size-10 shrink-0 rounded-full ${className}`}
    />
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`leading-none ${className}`}>
      <span
        className="block text-sm font-bold uppercase tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        O Rui dos
      </span>
      <span
        className="block text-sm font-bold uppercase tracking-tight text-electric-soft"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Computadores
      </span>
    </span>
  );
}
