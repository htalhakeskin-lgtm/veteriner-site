/* ═══════════════════════════════════════════════════
   ANIMATIONS — Intersection Observer & Counter Count-up
   ═══════════════════════════════════════════════════ */

const AnimationManager = {
  init: function() {
    this.initScrollReveal();
    this.initCounterUp();
  },

  // Intersection Observer for Scroll Reveal
  initScrollReveal: function() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach(el => observer.observe(el));
  },

  // Number Counter Animation
  initCounterUp: function() {
    const counterElements = document.querySelectorAll('[data-counter]');
    
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const endValue = parseInt(target.getAttribute('data-counter'), 10);
          const suffix = target.getAttribute('data-suffix') || '';
          let startValue = 0;
          const duration = 1800;
          const stepTime = 30;
          const steps = duration / stepTime;
          const increment = endValue / steps;

          const timer = setInterval(() => {
            startValue += increment;
            if (startValue >= endValue) {
              target.innerText = endValue.toLocaleString('tr-TR') + suffix;
              clearInterval(timer);
            } else {
              target.innerText = Math.floor(startValue).toLocaleString('tr-TR') + suffix;
            }
          }, stepTime);

          obs.unobserve(target);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach(el => counterObserver.observe(el));
  }
};
