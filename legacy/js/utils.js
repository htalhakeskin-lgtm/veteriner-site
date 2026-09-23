/* ═══════════════════════════════════════════════════
   UTILS — Helper Functions, Date Formatter, Toast Alert
   ═══════════════════════════════════════════════════ */

const Utils = {
  // Format Date TR
  formatDateTR: function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },

  // Toast Notification Generator
  showToast: function(message, type = 'info', duration = 3500) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    let bgColor = 'var(--color-secondary)';
    if (type === 'success') { icon = 'check-circle'; bgColor = 'var(--color-success)'; }
    if (type === 'error') { icon = 'alert-triangle'; bgColor = 'var(--color-error)'; }

    toast.style.cssText = `
      background: ${bgColor};
      color: #fff;
      padding: 14px 22px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-weight: 600;
      font-size: var(--font-sm);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideInRight 0.3s ease;
    `;

    toast.innerHTML = `<i class="lucide-${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Storage Get & Set
  getStorage: function(key, defaultVal = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  },

  setStorage: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
