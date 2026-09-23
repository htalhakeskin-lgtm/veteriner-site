/* ═══════════════════════════════════════════════════
   HERO LOGIC — Typewriter & Parallax Effects
   ═══════════════════════════════════════════════════ */

const HeroManager = {
  init: function() {
    this.initTypewriter();
    this.initParallax();
  },

  initTypewriter: function() {
    const titleEl = document.getElementById('heroTypewriterTitle');
    if (!titleEl) return;

    const words = ["En İyi Bakım", "7/24 Acil Hizmet", "Uzman Hekim Kadrosu", "Güvenli Tedavi"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        titleEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        titleEl.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    }

    type();
  },

  initParallax: function() {
    const heroCard = document.querySelector('.hero-media-card');
    if (!heroCard) return;

    window.addEventListener('mousemove', (e) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 45;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 45;
      heroCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
  }
};
