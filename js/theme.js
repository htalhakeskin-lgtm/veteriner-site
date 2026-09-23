/* ═══════════════════════════════════════════════════
   THEME — CSS Custom Properties Injector & Demo Panel
   ═══════════════════════════════════════════════════ */

const ThemeManager = {
  init: function() {
    const savedPreset = localStorage.getItem('vet_active_theme') || SITE_CONFIG.theme.activePreset;
    this.applyTheme(savedPreset);
  },

  applyTheme: function(presetName) {
    const preset = SITE_CONFIG.theme.presets[presetName] || SITE_CONFIG.theme.presets.doga;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', preset.primary);
    root.style.setProperty('--color-primary-light', preset.primaryLight);
    root.style.setProperty('--color-primary-dark', preset.primaryDark);
    root.style.setProperty('--color-secondary', preset.secondary);
    root.style.setProperty('--color-secondary-light', preset.secondaryLight);
    root.style.setProperty('--color-accent', preset.accent);
    root.style.setProperty('--color-accent-light', preset.accentLight);
    root.style.setProperty('--color-background', preset.background);
    root.style.setProperty('--color-background-alt', preset.backgroundAlt);
    root.style.setProperty('--color-surface', preset.surface);
    root.style.setProperty('--color-text', preset.text);
    root.style.setProperty('--color-text-light', preset.textLight);
    root.style.setProperty('--header-bg', preset.headerBg);
    root.style.setProperty('--footer-bg', preset.footerBg);
    root.style.setProperty('--footer-text', preset.footerText);
    root.style.setProperty('--gradient-primary', preset.gradientPrimary);
    root.style.setProperty('--gradient-hero', preset.gradientHero);

    localStorage.setItem('vet_active_theme', presetName);
  },

  // Render Theme Selector Modal / Drawer
  renderThemeSwitcherModal: function() {
    const modalHtml = `
      <div id="themeSwitcherModal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 480px;">
          <button class="modal-close-btn" onclick="ThemeManager.closeModal()">&times;</button>
          <div style="margin-bottom: 20px;">
            <h3 class="font-heading" style="font-size: var(--font-2xl); color: var(--color-secondary);">🎨 Demo Tema Değiştirici</h3>
            <p style="font-size: var(--font-sm); color: var(--color-text-light); margin-top: 4px;">Klinik müşterilerinize gösterebileceğiniz renk paketleri:</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.keys(SITE_CONFIG.theme.presets).map(key => {
              const p = SITE_CONFIG.theme.presets[key];
              return `
                <button onclick="ThemeManager.applyTheme('${key}'); Utils.showToast('${p.name} teması uygulandı', 'success'); ThemeManager.closeModal();" 
                        style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: var(--radius-md); border: 1.5px solid var(--border-color); background: var(--color-surface); cursor: pointer; transition: all 0.2s;">
                  <span style="font-weight: 700; color: var(--color-secondary);">${p.name} Paket</span>
                  <div style="display: flex; gap: 6px;">
                    <span style="width: 20px; height: 20px; border-radius: 50%; background: ${p.primary}; inline-block;"></span>
                    <span style="width: 20px; height: 20px; border-radius: 50%; background: ${p.secondary}; inline-block;"></span>
                    <span style="width: 20px; height: 20px; border-radius: 50%; background: ${p.accent}; inline-block;"></span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  openModal: function() {
    const modal = document.getElementById('themeSwitcherModal');
    if (modal) modal.classList.add('open');
  },

  closeModal: function() {
    const modal = document.getElementById('themeSwitcherModal');
    if (modal) modal.classList.remove('open');
  }
};
