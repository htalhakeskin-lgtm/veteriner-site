/* ═══════════════════════════════════════════════════
   PANEL LOGIC — Admin Management & Calendar Control
   ═══════════════════════════════════════════════════ */

const PanelManager = {
  init: function() {
    const user = AuthManager.getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.href = '../giris.html';
      return;
    }
    this.renderAppointmentsTable();
    this.renderCustomersTable();
  },

  renderAppointmentsTable: function() {
    const tbody = document.getElementById('adminAppointmentsTableBody');
    if (!tbody) return;

    const appointments = Utils.getStorage('vet_appointments', []);

    if (appointments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">Kayıtlı randevu bulunmamaktadır.</td></tr>`;
      return;
    }

    tbody.innerHTML = appointments.map(rnd => `
      <tr>
        <td><strong>#${rnd.id}</strong></td>
        <td>${rnd.petName || 'Boncuk'}</td>
        <td>${rnd.serviceTitle || 'Muayene'}</td>
        <td>${Utils.formatDateTR(rnd.date)} ${rnd.time}</td>
        <td><span class="status-badge status-${rnd.status}">${rnd.status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="PanelManager.changeStatus('${rnd.id}', 'confirmed')">Onayla</button>
          <button class="btn btn-sm btn-secondary" onclick="PanelManager.changeStatus('${rnd.id}', 'cancelled')">İptal</button>
        </td>
      </tr>
    `).join('');
  },

  renderCustomersTable: function() {
    const tbody = document.getElementById('adminCustomersTableBody');
    if (!tbody) return;

    const users = Utils.getStorage('vet_users', []).filter(u => u.role === 'customer');

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${u.createdAt}</td>
        <td><button class="btn btn-sm btn-outline">Detay</button></td>
      </tr>
    `).join('');
  },

  changeStatus: function(rndId, newStatus) {
    const appointments = Utils.getStorage('vet_appointments', []);
    const idx = appointments.findIndex(r => r.id === rndId);
    if (idx !== -1) {
      appointments[idx].status = newStatus;
      Utils.setStorage('vet_appointments', appointments);
      Utils.showToast(`Randevu durumu '${newStatus}' olarak güncellendi.`, 'success');
      this.renderAppointmentsTable();
    }
  }
};
