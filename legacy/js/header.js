/* ═══════════════════════════════════════════════════
   HEADER LOGIC — Scroll Glassmorphism & Mobile Drawer
   ═══════════════════════════════════════════════════ */

const HeaderManager = {
  init: function() {
    this.bindScroll();
    this.bindMobileDrawer();
    this.setActiveNavLink();
  },

  bindScroll: function() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  },

  bindMobileDrawer: function() {
    const toggleBtn = document.getElementById('mobileToggleBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileOverlay');

    if (!toggleBtn || !drawer || !overlay) return;

    const toggle = () => {
      toggleBtn.classList.toggle('active');
      drawer.classList.toggle('open');
      overlay.classList.toggle('open');
    };

    toggleBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
  },

  setActiveNavLink: function() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }
};
