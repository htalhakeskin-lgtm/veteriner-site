/* ═══════════════════════════════════════════════════
   CAROUSEL — Testimonials & Instagram Feed Slider
   ═══════════════════════════════════════════════════ */

const CarouselManager = {
  currentIndex: 0,
  timer: null,

  init: function() {
    this.renderTestimonials();
    this.startAutoSlide();
  },

  renderTestimonials: function() {
    const container = document.getElementById('testimonialCarouselPlaceholder');
    if (!container) return;

    const testimonials = SITE_CONFIG.testimonials;
    const current = testimonials[this.currentIndex];

    container.innerHTML = `
      <div class="testimonial-card">
        <div class="testimonial-quote-icon">“</div>
        <p class="testimonial-text">"${current.text}"</p>
        <div class="testimonial-author">
          <div class="author-avatar" style="background: var(--gradient-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">
            ${current.name.charAt(0)}
          </div>
          <div class="author-info">
            <div class="author-name">${current.name}</div>
            <div class="author-pet">${current.pet}</div>
          </div>
        </div>
      </div>
      <div class="carousel-controls">
        <button class="carousel-btn" onclick="CarouselManager.prev()">◄</button>
        <div class="carousel-dots">
          ${testimonials.map((_, i) => `
            <span class="carousel-dot ${i === this.currentIndex ? 'active' : ''}" onclick="CarouselManager.goTo(${i})"></span>
          `).join('')}
        </div>
        <button class="carousel-btn" onclick="CarouselManager.next()">►</button>
      </div>
    `;
  },

  next: function() {
    this.currentIndex = (this.currentIndex + 1) % SITE_CONFIG.testimonials.length;
    this.renderTestimonials();
  },

  prev: function() {
    this.currentIndex = (this.currentIndex - 1 + SITE_CONFIG.testimonials.length) % SITE_CONFIG.testimonials.length;
    this.renderTestimonials();
  },

  goTo: function(index) {
    this.currentIndex = index;
    this.renderTestimonials();
  },

  startAutoSlide: function() {
    this.timer = setInterval(() => this.next(), 6000);
  }
};
