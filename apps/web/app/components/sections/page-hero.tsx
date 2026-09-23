import type { ReactNode } from 'react';

/** Ic sayfalarin ortak ust bolumu. Tum sayfalarda ayni ritim olsun diye. */
export function PageHero({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[40%] -right-[15%] h-[50vw] max-h-[620px] w-[50vw] max-w-[620px] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, var(--color-tint) 0%, transparent 68%)',
        }}
      />
      <div className="wrap relative max-w-[62ch]">
        <span className="eyebrow mb-4" data-reveal="fade">
          <span className="h-px w-6 bg-brand opacity-60" />
          {eyebrow}
        </span>
        <h1 className="text-[clamp(2.2rem,5vw,3.6rem)]" data-reveal>
          {title}
        </h1>
        {lede && (
          <p
            className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted"
            data-reveal
            style={{ '--delay': '80ms' } as React.CSSProperties}
          >
            {lede}
          </p>
        )}
        {action && (
          <div
            className="mt-8"
            data-reveal
            style={{ '--delay': '160ms' } as React.CSSProperties}
          >
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
