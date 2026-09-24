import { useEffect, useRef, useState } from 'react';

import { formatNumber } from '~/lib/format';

/**
 * Sayaç animasyonu.
 *
 * Sunucu tarafında ve hareket kapalıyken DOĞRUDAN son değeri başar:
 * prerender edilen HTML'de "0" görünmesi hem SEO hem de JavaScript
 * çalışmayan durumlar için yanlış olurdu.
 */
export function CountUp({
  to,
  decimals = 0,
  suffix = '',
  duration = 1500,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.motion === 'off') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setAnimate(true);
    setValue(0);
  }, []);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, to, duration]);

  const text = decimals
    ? value.toFixed(decimals)
    : formatNumber(Math.round(value));

  return (
    <span ref={ref}>
      {text}
      {suffix}
    </span>
  );
}
