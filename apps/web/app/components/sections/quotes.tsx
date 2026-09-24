import { useEffect, useState } from 'react';

import { speciesLabel } from '~/lib/format';
import type { Testimonial } from '~/lib/types';
import { Icon, cx } from '~/components/ui';

/** Müşteri yorumları karuseli. 6 saniyede bir yumuşakça geçer. */
export function Quotes({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const hasGoogle = items.some((t) => t.source === 'GOOGLE');

  return (
    <div
      className="wrap max-w-[760px] text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="eyebrow mb-4 justify-center" data-reveal="fade">
        <span className="h-px w-6 bg-brand opacity-60" />
        {hasGoogle ? 'Google Yorumları' : 'Müşteri Yorumları'}
      </span>
      <h2 className="text-[clamp(2rem,4vw,3rem)]" data-reveal>
        Sahiplerin anlattığı
      </h2>

      {/*
        aria-live: karusel kendiliginden değiştiği için ekran okuyucu
        yeni yorumu duyurabilsin.
      */}
      <div
        className="relative mt-12 min-h-58"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((item, i) => (
          <figure
            key={item.id}
            aria-hidden={i !== index}
            className={cx(
              'absolute inset-0 flex flex-col items-center gap-6 transition-all duration-700 ease-soft',
              i === index
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-3.5 opacity-0',
            )}
          >
            <div className="flex gap-1 text-brand">
              {Array.from({ length: item.rating }).map((_, n) => (
                <Icon key={n} name="star" size={16} />
              ))}
            </div>

            <blockquote className="max-w-[26ch] font-display text-[clamp(1.2rem,2.6vw,1.7rem)] leading-snug md:max-w-[34ch]">
              “{item.text}”
            </blockquote>

            <figcaption className="text-sm text-ink-muted">
              <b className="block font-semibold text-ink">{item.authorName}</b>
              {item.petName && (
                <>
                  {item.petName}
                  {item.petSpecies && ` · ${speciesLabel(item.petSpecies)}`}
                </>
              )}
            </figcaption>

            {item.source === 'GOOGLE' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
                <Icon name="google" size={14} /> Google'da doğrulanmış yorum
              </span>
            )}
          </figure>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. yorum`}
              aria-current={i === index}
              className={cx(
                'h-1.5 rounded-full transition-all duration-500 ease-soft',
                i === index ? 'w-6.5 bg-brand' : 'w-1.5 bg-line hover:bg-ink-faint',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
