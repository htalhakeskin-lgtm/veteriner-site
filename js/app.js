/* ═══════════════════════════════════════════════════
   APP — Main Application Initialization Entry Point
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Apply active theme preset
  ThemeManager.init();
  ThemeManager.renderThemeSwitcherModal();

  // 2. Inject shared components (Header, Footer, Floating Buttons)
  ComponentInjector.init();

  // 3. Initialize header navigation behavior
  HeaderManager.init();

  // 4. Initialize scroll reveal & counters
  AnimationManager.init();

  // 5. Initialize hero section if present
  if (typeof HeroManager !== 'undefined') HeroManager.init();

  // 6. Initialize testimonials carousel if present
  if (typeof CarouselManager !== 'undefined') CarouselManager.init();

  // 7. Initialize Randevu page if on appointment page
  if (typeof RandevuManager !== 'undefined' && document.getElementById('randevuStepContainer')) {
    RandevuManager.init();
  }

  // 8. Initialize Customer Profile page if on profile page
  if (typeof ProfilManager !== 'undefined' && document.getElementById('petsContainer')) {
    ProfilManager.init();
  }

  // 9. Initialize Admin Panel if on panel page
  if (typeof PanelManager !== 'undefined' && document.getElementById('adminAppointmentsTableBody')) {
    PanelManager.init();
  }
});
