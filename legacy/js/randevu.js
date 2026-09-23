/* ═══════════════════════════════════════════════════
   RANDEVU LOGIC — Multi-step Wizard & Slot Selection
   ═══════════════════════════════════════════════════ */

const RandevuManager = {
  currentStep: 1,
  formData: {
    serviceId: null,
    serviceTitle: '',
    vetId: null,
    vetName: '',
    date: '',
    time: '',
    petName: '',
    petType: 'Kedi',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  },

  init: function() {
    this.renderStepContent();
    this.bindEvents();
    this.checkAutoFillUser();
  },

  checkAutoFillUser: function() {
    const currentUser = JSON.parse(localStorage.getItem('vet_current_user'));
    if (currentUser) {
      this.formData.customerName = currentUser.name || '';
      this.formData.customerEmail = currentUser.email || '';
      this.formData.customerPhone = currentUser.phone || '';

      const pets = Utils.getStorage('vet_pets', []);
      const userPets = pets.filter(p => p.userId === currentUser.id);
      if (userPets.length > 0) {
        this.formData.petName = userPets[0].name;
        this.formData.petType = userPets[0].type;
      }
    }
  },

  renderStepContent: function() {
    const container = document.getElementById('randevuStepContainer');
    if (!container) return;

    if (this.currentStep === 1) {
      container.innerHTML = `
        <h3 class="font-heading mb-2">1. Adım: Hizmet Seçimi</h3>
        <p class="text-muted mb-4">Evcil dostunuz için ihtiyacınız olan veterinerlik hizmetini seçin.</p>
        <div class="selection-grid">
          ${SITE_CONFIG.services.map(s => `
            <div class="selectable-card ${this.formData.serviceId === s.id ? 'selected' : ''}" 
                 onclick="RandevuManager.selectService('${s.id}', '${s.title}')">
              <div style="font-size: 32px; color: var(--color-primary);">🩺</div>
              <h4 style="font-weight: 700; color: var(--color-secondary);">${s.title}</h4>
              <p style="font-size: var(--font-xs); color: var(--color-text-light);">${s.shortDesc}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (this.currentStep === 2) {
      container.innerHTML = `
        <h3 class="font-heading mb-2">2. Adım: Hekim Seçimi</h3>
        <p class="text-muted mb-4">Muayeneyi gerçekleştirmesini istediğiniz veteriner hekimi seçin.</p>
        <div class="selection-grid">
          <div class="selectable-card ${this.formData.vetId === 'any' ? 'selected' : ''}" 
               onclick="RandevuManager.selectVet('any', 'Farketmez (İlk Müsait Hekim)')">
            <div style="font-size: 32px; color: var(--color-primary);">🩺</div>
            <h4 style="font-weight: 700;">Farketmez</h4>
            <p style="font-size: var(--font-xs); color: var(--color-text-light);">İlk müsait hekime atanır</p>
          </div>
          ${SITE_CONFIG.team.map((t, idx) => `
            <div class="selectable-card ${this.formData.vetId === 'vet-' + idx ? 'selected' : ''}" 
                 onclick="RandevuManager.selectVet('vet-${idx}', '${t.name}')">
              <div style="font-size: 32px; color: var(--color-primary);">👨‍⚕️</div>
              <h4 style="font-weight: 700;">${t.name}</h4>
              <p style="font-size: var(--font-xs); color: var(--color-text-light);">${t.title}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (this.currentStep === 3) {
      const today = new Date().toISOString().split('T')[0];
      container.innerHTML = `
        <h3 class="font-heading mb-2">3. Adım: Tarih & Saat Seçimi</h3>
        <p class="text-muted mb-4">Randevu günü ve uygun saat dilimini belirleyin.</p>
        <div class="date-slot-picker">
          <div>
            <label class="form-label">Tarih Seçin <span class="required-star">*</span></label>
            <input type="date" min="${today}" value="${this.formData.date || today}" class="form-control" 
                   onchange="RandevuManager.selectDate(this.value)">
          </div>
          <div>
            <label class="form-label">Müsait Saatler <span class="required-star">*</span></label>
            <div class="slots-container">
              ${['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:00', '16:30'].map(slot => `
                <div class="time-slot ${this.formData.time === slot ? 'selected' : ''}" 
                     onclick="RandevuManager.selectTime('${slot}')">${slot}</div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (this.currentStep === 4) {
      container.innerHTML = `
        <h3 class="font-heading mb-2">4. Adım: İletişim & Hasta Bilgileri</h3>
        <p class="text-muted mb-4">Size ve minik dostumuza ulaşabilmemiz için bilgilerinizi girin.</p>
        <div class="grid grid-2 gap-4">
          <div class="form-group">
            <label class="form-label">Evcil Hayvan Adı <span class="required-star">*</span></label>
            <input type="text" value="${this.formData.petName}" placeholder="Örn: Boncuk" class="form-control" 
                   oninput="RandevuManager.formData.petName = this.value">
          </div>
          <div class="form-group">
            <label class="form-label">Tür <span class="required-star">*</span></label>
            <select class="form-control" onchange="RandevuManager.formData.petType = this.value">
              <option value="Kedi" ${this.formData.petType === 'Kedi' ? 'selected' : ''}>Kedi</option>
              <option value="Köpek" ${this.formData.petType === 'Köpek' ? 'selected' : ''}>Köpek</option>
              <option value="Kuş" ${this.formData.petType === 'Kuş' ? 'selected' : ''}>Kuş</option>
              <option value="Diğer" ${this.formData.petType === 'Diğer' ? 'selected' : ''}>Diğer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Adınız Soyadınız <span class="required-star">*</span></label>
            <input type="text" value="${this.formData.customerName}" placeholder="Örn: Ayşe Yılmaz" class="form-control" 
                   oninput="RandevuManager.formData.customerName = this.value">
          </div>
          <div class="form-group">
            <label class="form-label">Telefon Numarası <span class="required-star">*</span></label>
            <input type="tel" value="${this.formData.customerPhone}" placeholder="Örn: 0532 000 00 00" class="form-control" 
                   oninput="RandevuManager.formData.customerPhone = this.value">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Ek Notlar / Şikayetiniz</label>
          <textarea class="form-control" placeholder="Varsa evcil hayvanınızın şikayetini veya belirtilerini yazabilirsiniz..." 
                    oninput="RandevuManager.formData.notes = this.value">${this.formData.notes}</textarea>
        </div>
      `;
    } else if (this.currentStep === 5) {
      container.innerHTML = `
        <h3 class="font-heading mb-2">5. Adım: Randevu Onayı</h3>
        <p class="text-muted mb-4">Lütfen girdiğiniz randevu detaylarını kontrol edip onaylayın.</p>
        <div class="summary-box">
          <div class="summary-row">
            <span class="summary-label">Seçilen Hizmet:</span>
            <span class="summary-value">${this.formData.serviceTitle}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Veteriner Hekim:</span>
            <span class="summary-value">${this.formData.vetName}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Tarih & Saat:</span>
            <span class="summary-value">${Utils.formatDateTR(this.formData.date)} — ${this.formData.time}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Evcil Hayvan:</span>
            <span class="summary-value">${this.formData.petName} (${this.formData.petType})</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Hasta Yakını:</span>
            <span class="summary-value">${this.formData.customerName} (${this.formData.customerPhone})</span>
          </div>
        </div>
      `;
    }

    this.updateProgressBar();
  },

  updateProgressBar: function() {
    const steps = document.querySelectorAll('.progress-step');
    const bar = document.querySelector('.wizard-progress-bar');
    
    steps.forEach((step, idx) => {
      const stepNum = idx + 1;
      if (stepNum === this.currentStep) {
        step.className = 'progress-step active';
      } else if (stepNum < this.currentStep) {
        step.className = 'progress-step completed';
      } else {
        step.className = 'progress-step';
      }
    });

    if (bar) {
      bar.style.width = ((this.currentStep - 1) / 4 * 100) + '%';
    }
  },

  selectService: function(id, title) {
    this.formData.serviceId = id;
    this.formData.serviceTitle = title;
    this.nextStep();
  },

  selectVet: function(id, name) {
    this.formData.vetId = id;
    this.formData.vetName = name;
    this.nextStep();
  },

  selectDate: function(dateVal) {
    this.formData.date = dateVal;
  },

  selectTime: function(timeVal) {
    this.formData.time = timeVal;
    this.renderStepContent();
  },

  nextStep: function() {
    if (this.currentStep === 1 && !this.formData.serviceId) {
      Utils.showToast('Lütfen bir hizmet seçin', 'error'); return;
    }
    if (this.currentStep === 2 && !this.formData.vetId) {
      Utils.showToast('Lütfen hekim seçin', 'error'); return;
    }
    if (this.currentStep === 3 && (!this.formData.date || !this.formData.time)) {
      Utils.showToast('Lütfen tarih ve saat seçin', 'error'); return;
    }
    if (this.currentStep === 4 && (!this.formData.petName || !this.formData.customerName || !this.formData.customerPhone)) {
      Utils.showToast('Lütfen zorunlu alanları doldurun', 'error'); return;
    }

    if (this.currentStep < 5) {
      this.currentStep++;
      this.renderStepContent();
    } else {
      this.completeBooking();
    }
  },

  prevStep: function() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStepContent();
    }
  },

  completeBooking: function() {
    const appointments = Utils.getStorage('vet_appointments', []);
    const newAppointment = {
      id: 'rnd-' + Date.now().toString().slice(-4),
      userId: 'guest',
      petName: this.formData.petName,
      serviceTitle: this.formData.serviceTitle,
      vetName: this.formData.vetName,
      date: this.formData.date,
      time: this.formData.time,
      status: 'pending',
      notes: this.formData.notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    appointments.push(newAppointment);
    Utils.setStorage('vet_appointments', appointments);

    const container = document.getElementById('randevuStepContainer');
    if (container) {
      container.innerHTML = `
        <div class="text-center" style="padding: 40px 0;">
          <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
          <h2 class="font-heading" style="color: var(--color-secondary); font-size: var(--font-3xl);">Randevunuz Başarıyla Oluşturuldu!</h2>
          <p class="text-muted" style="margin-top: 12px; font-size: var(--font-lg);">Onay Kodu: <strong>#${newAppointment.id}</strong></p>
          <p style="margin-top: 8px; color: var(--color-text-light);">Randevu detaylarınız tarafınıza SMS ve WhatsApp ile iletilecektir.</p>
          <div style="margin-top: 32px; display: flex; justify-content: center; gap: 16px;">
            <a href="index.html" class="btn btn-primary">Ana Sayfaya Dön</a>
            <a href="profil/index.html" class="btn btn-secondary">Randevularımı Görüntüle</a>
          </div>
        </div>
      `;
      document.querySelector('.wizard-footer').style.display = 'none';
    }
  },

  bindEvents: function() {
    const nextBtn = document.getElementById('wizardNextBtn');
    const prevBtn = document.getElementById('wizardPrevBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
  }
};
