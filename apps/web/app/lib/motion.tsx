import { useEffect, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 *  YUMUŞAK KAYDIRMA VE GİRİŞ ANİMASYONLARI
 * ═══════════════════════════════════════════════════════════════
 *
 * Tasarım önizlemesinde (tasarim-onizleme.html) belirlenen ayarlar
 * buraya taşındı. Kademe 4 = "Sakin".
 *
 * Önemli: Lenis window.load'u BEKLEMEZ. Beklerse yumuşak kaydırma
 * sayfadaki son görsel inene kadar devreye girmez ve yavaş bağlantıda
 * ilk saniyeler sert kayar.
 */

/** Kademeler geometrik ilerliyor: göz hızı orantisal algılıyor. */
const geo = (min: number, max: number, v: number) =>
  min * Math.pow(max / min, (v - 1) / 9);

export function scrollSettings(step = 4) {
  const v = Math.min(10, Math.max(1, step));
  return {
    lerp: geo(0.022, 0.26, v),
    wheelMultiplier: geo(0.4, 1.3, v),
    anchorMs: geo(2600, 800, v),
  };
}

/** Menü tıklamalarında kullanılan eğri (CSS'teki --ease-soft ile aynı his). */
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Yapışkan başlığın hedefi ortmemesi için bırakılan pay. */
export const HEADER_OFFSET = -84;

export function useSmoothScroll(step = 4): void {
  const lenisRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionOff = document.documentElement.dataset.motion === 'off';
    if (motionOff) return;

    let cancelled = false;
    let rafId = 0;

    void (async () => {
      const { default: Lenis } = await import('lenis');
      if (cancelled) return;

      const cfg = scrollSettings(step);
      const lenis = new Lenis({
        lerp: cfg.lerp,
        smoothWheel: true,
        wheelMultiplier: cfg.wheelMultiplier,
      });
      lenisRef.current = lenis;

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [step]);
}

/**
 * Scroll ile giriş animasyonları.
 * Gruplanmış öğelere sıralı gecikme verir (stagger).
 */
export function useScrollReveal(deps: unknown[] = []): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.documentElement.dataset.motion === 'off') {
      document
        .querySelectorAll('[data-reveal]')
        .forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    document.querySelectorAll('[data-stagger]').forEach((group) => {
      group.querySelectorAll('[data-reveal]').forEach((el, i) => {
        (el as HTMLElement).style.setProperty('--delay', `${i * 70}ms`);
      });
    });

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Sayfa geçişlerinde üst kisma yumuşakça dön. */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
