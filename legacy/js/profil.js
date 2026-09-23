/* ═══════════════════════════════════════════════════
   PROFIL LOGIC — Customer Dashboard, Pets & Health Card
   ═══════════════════════════════════════════════════ */

const ProfilManager = {
  user: null,

  init: function() {
    this.user = AuthManager.getCurrentUser();
    if (!this.user) {
      window.location.href = '../giris.html';
      return;
    }
    this.updateUserUI();
    this.renderPets();
    this.renderAppointments();
    this.renderHealthRecords();
  },

  updateUserUI: function() {
    const nameEl = document.getElementById('dashUserName');
    const emailEl = document.getElementById('dashUserEmail');
    if (nameEl) nameEl.innerText = this.user.name;
    if (emailEl) emailEl.innerText = this.user.email;
  },

  renderPets: function() {
    const container = document.getElementById('petsContainer');
    if (!container) return;

    const pets = Utils.getStorage('vet_pets', []).filter(p => p.userId === this.user.id);

    if (pets.length === 0) {
      container.innerHTML = `
        <div class="text-center w-100" style="padding: 40px; background: var(--color-surface); border-radius: var(--radius-xl); border: 1.5px dashed var(--border-color);">
          <p class="text-muted">Henüz kayıtlı bir evcil hayvanınız bulunmuyor.</p>
          <button class="btn btn-primary btn-sm mt-3" onclick="ProfilManager.openAddPetModal()">+ Evcil Hayvan Ekle</button>
        </div>
      `;
      return;
    }

    container.innerHTML = pets.map(pet => `
      <div class="pet-card">
        <div class="pet-avatar-wrapper">${pet.type === 'Kedi' ? '🐱' : '🐶'}</div>
        <div class="pet-name">${pet.name}</div>
        <div class="pet-breed">${pet.breed} — ${pet.age} Yaşında</div>
        <span class="badge badge-primary">${pet.neutered ? 'Kısırlaştırılmış' : 'Kısırlaştırılmamış'}</span>
        <a href="saglik-karti.html?petId=${pet.id}" class="btn btn-outline btn-sm w-100 mt-2">Sağlık Kartı</a>
      </div>
    `).join('') + `
      <div class="pet-card" style="border: 2px dashed var(--border-color); background: transparent; justify-content: center; cursor: pointer;" onclick="ProfilManager.openAddPetModal()">
        <div style="font-size: 36px; color: var(--color-primary);">➕</div>
        <div style="font-weight: 700; color: var(--color-secondary);">Yeni Hayvan Ekle</div>
      </div>
    `;
  },

  renderAppointments: function() {
    const container = document.getElementById('myAppointmentsContainer');
    if (!container) return;

    const appointments = Utils.getStorage('vet_appointments', []);

    if (appointments.length === 0) {
      container.innerHTML = `<p class="text-muted">Randevunuz bulunmuyor.</p>`;
      return;
    }

    container.innerHTML = appointments.map(rnd => `
      <div class="dash-stat-card mb-3">
        <div class="dash-stat-icon">📅</div>
        <div style="flex: 1;">
          <div style="font-weight: 700; color: var(--color-secondary);">${rnd.serviceTitle || rnd.serviceId}</div>
          <div style="font-size: var(--font-xs); color: var(--color-text-light);">${Utils.formatDateTR(rnd.date)} — ${rnd.time} (${rnd.vetName})</div>
        </div>
        <span class="status-badge status-${rnd.status}">${rnd.status === 'confirmed' ? 'Onaylandı' : 'Bekliyor'}</span>
      </div>
    `).join('');
  },

  renderHealthRecords: function() {
    const container = document.getElementById('healthRecordsTimeline');
    if (!container) return;

    const records = Utils.getStorage('vet_healthRecords', []);

    container.innerHTML = records.map(rec => `
      <div class="timeline-item">
        <div class="timeline-date">${Utils.formatDateTR(rec.date)}</div>
        <div class="timeline-body">
          <div class="timeline-title">${rec.title} (${rec.type})</div>
          <div class="timeline-desc">${rec.description} — Hekim: ${rec.vetName}</div>
        </div>
      </div>
    `).join('');
  },

  openAddPetModal: function() {
    const name = prompt('Evcil hayvanınızın adı:');
    if (!name) return;
    const type = prompt('Türü (Kedi / Köpek / Kuş):', 'Kedi');
    const breed = prompt('Cinsi (Örn: British Shorthair):', 'Tekir');

    const pets = Utils.getStorage('vet_pets', []);
    pets.push({
      id: 'pet-' + Date.now(),
      userId: this.user.id,
      name: name,
      type: type || 'Kedi',
      breed: breed || 'Irk Belirtilmedi',
      age: 2,
      neutered: true
    });

    Utils.setStorage('vet_pets', pets);
    Utils.showToast('Evcil hayvanınız eklendi!', 'success');
    this.renderPets();
  }
};
