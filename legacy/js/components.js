/* ═══════════════════════════════════════════════════
   COMPONENTS — Injects Header, Footer & Floating Quick Action Buttons
   ═══════════════════════════════════════════════════ */

const ComponentInjector = {
  init: function() {
    this.injectEmergencyTopBar();
    this.injectHeader();
    this.injectFooter();
    this.injectFloatingQuickButtons();
  },

  injectEmergencyTopBar: function() {
    if (!SITE_CONFIG.site.showEmergencyBanner) return;
    const topBarHtml = `
      <div class="emergency-top-bar">
        <div class="container bar-inner">
          <span>🚨 <strong>7/24 Acil Veteriner Ambulans & Müdahale:</strong> Kesintisiz Hizmet</span>
          <a href="tel:${SITE_CONFIG.contact.phoneRaw}" class="emergency-phone-link">📞 ${SITE_CONFIG.contact.phone}</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', topBarHtml);
  },

  injectHeader: function() {
    const headerContainer = document.getElementById('main-header-placeholder');
    if (!headerContainer) return;

    const navLinks = SITE_CONFIG.navigation.main.map(link => {
      const href = link.href || link.url || '#';
      const label = link.label || link.name || 'Menü';
      return `<li><a href="${href}" class="nav-link">${label}</a></li>`;
    }).join('');

    const headerHtml = `
      <header class="main-header ${SITE_CONFIG.site.showEmergencyBanner ? 'has-top-bar' : ''}">
        <div class="container header-container">
          <a href="index.html" class="header-brand">
            <div class="brand-logo-icon">🐾</div>
            <div class="brand-text">
              <span class="brand-name">${SITE_CONFIG.clinic.name}</span>
              <span class="brand-slogan">${SITE_CONFIG.clinic.slogan}</span>
            </div>
          </a>

          <nav>
            <ul class="nav-menu">
              ${navLinks}
            </ul>
          </nav>

          <div class="header-actions">
            <a href="tel:${SITE_CONFIG.contact.phoneRaw}" class="header-phone">
              <i>📞</i> ${SITE_CONFIG.contact.phone}
            </a>
            <a href="randevu.html" class="btn btn-primary btn-sm">Online Randevu Al</a>
            <button class="mobile-toggle" id="mobileToggleBtn" aria-label="Menü">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <!-- Mobile Nav Drawer -->
      <div class="mobile-overlay" id="mobileOverlay"></div>
      <div class="mobile-drawer" id="mobileDrawer">
        <ul class="mobile-nav-list">
          ${SITE_CONFIG.navigation.main.map(link => {
            const href = link.href || link.url || '#';
            const label = link.label || link.name || 'Menü';
            return `<li><a href="${href}" class="mobile-nav-link">${label}</a></li>`;
          }).join('')}
        </ul>
        <div class="mobile-drawer-footer">
          <a href="randevu.html" class="btn btn-primary w-100">Online Randevu Al</a>
          <a href="tel:${SITE_CONFIG.contact.phoneRaw}" class="btn btn-secondary w-100">Hemen Ara</a>
        </div>
      </div>
    `;
    headerContainer.innerHTML = headerHtml;
  },

  injectFooter: function() {
    const footerContainer = document.getElementById('main-footer-placeholder');
    if (!footerContainer) return;

    const footerHtml = `
      <footer class="main-footer">
        <div class="footer-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        <div class="container footer-top">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="index.html" class="brand-logo">
                <div class="brand-logo-icon">🐾</div>
                <span class="brand-name">${SITE_CONFIG.clinic.name}</span>
              </a>
              <p class="footer-desc">${SITE_CONFIG.clinic.description}</p>
              <div class="social-links">
                <a href="${SITE_CONFIG.contact.instagramUrl}" target="_blank" class="social-icon" aria-label="Instagram">📷</a>
                <a href="https://wa.me/${SITE_CONFIG.contact.whatsapp.replace(/\+/g,'')}" target="_blank" class="social-icon" aria-label="WhatsApp">💬</a>
                <a href="tel:${SITE_CONFIG.contact.phoneRaw}" class="social-icon" aria-label="Telefon">📞</a>
              </div>
            </div>

            <div>
              <h4 class="footer-col-title">Hızlı Linkler</h4>
              <ul class="footer-links-list">
                <li><a href="index.html" class="footer-link">Ana Sayfa</a></li>
                <li><a href="hakkimizda.html" class="footer-link">Hakkımızda</a></li>
                <li><a href="hizmetler.html" class="footer-link">Hizmetlerimiz</a></li>
                <li><a href="ekibimiz.html" class="footer-link">Veteriner Ekibimiz</a></li>
                <li><a href="blog.html" class="footer-link">Sağlık Rehberi & Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 class="footer-col-title">Müşteri Paneli</h4>
              <ul class="footer-links-list">
                <li><a href="randevu.html" class="footer-link">Online Randevu Al</a></li>
                <li><a href="giris.html" class="footer-link">Müşteri Girişi</a></li>
                <li><a href="kayit.html" class="footer-link">Kayıt Ol</a></li>
                <li><a href="profil/index.html" class="footer-link">Randevularım & Hayvanlarım</a></li>
                <li><a href="panel/index.html" class="footer-link">Admin Girişi</a></li>
              </ul>
            </div>

            <div>
              <h4 class="footer-col-title">E-Bülten Aboneliği</h4>
              <div class="newsletter-box">
                <p class="newsletter-desc">Evcil dostunuz için bakım ipuçları ve aşı hatırlatmaları e-postanıza gelsin.</p>
                <form class="newsletter-form" onsubmit="event.preventDefault(); Utils.showToast('E-bülten kaydınız alındı!', 'success');">
                  <input type="email" placeholder="E-posta adresiniz..." required class="newsletter-input">
                  <button type="submit" class="btn btn-primary btn-sm">Abone Ol</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class="container footer-bottom">
          <p>© 2026 ${SITE_CONFIG.clinic.name}. Tüm Hakları Saklıdır.</p>
          <div class="footer-bottom-links">
            <a href="kvkk.html">KVKK & Aydınlatma Metni</a>
            <a href="kvkk.html">Gizlilik Politikası</a>
          </div>
        </div>
      </footer>
    `;
    footerContainer.innerHTML = footerHtml;
  },

  injectFloatingQuickButtons: function() {
    const waUrl = `https://wa.me/${SITE_CONFIG.contact.whatsapp.replace(/\+/g,'')}?text=${encodeURIComponent(SITE_CONFIG.contact.whatsappMessage)}`;
    
    // Position floating buttons on bottom RIGHT so they never overlap hero/page content on left
    const floatingHtml = `
      <div class="floating-quick-bar">
        <!-- Demo Theme Changer Floating Button -->
        <button onclick="ThemeManager.openModal()" title="Tema Değiştir" class="floating-btn floating-btn-theme">
          🎨
        </button>

        <!-- WhatsApp Floating Button -->
        <a href="${waUrl}" target="_blank" title="WhatsApp İle İletişim" class="floating-btn floating-btn-wa">
          💬
        </a>

        <!-- Instagram Floating Button -->
        <a href="${SITE_CONFIG.contact.instagramUrl}" target="_blank" title="Instagram Sayfamız" class="floating-btn floating-btn-ig">
          📷
        </a>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingHtml);
  }
};
