/* ═══════════════════════════════════════════════════
   AUTH LOGIC — Login, Register & Session Storage
   ═══════════════════════════════════════════════════ */

const AuthManager = {
  getCurrentUser: function() {
    const userStr = localStorage.getItem('vet_current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  login: function(email, password) {
    const users = Utils.getStorage('vet_users', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
      localStorage.setItem('vet_current_user', JSON.stringify(user));
      Utils.showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = 'panel/index.html';
        } else {
          window.location.href = 'profil/index.html';
        }
      }, 1000);
      return true;
    } else {
      Utils.showToast('E-posta veya şifre hatalı!', 'error');
      return false;
    }
  },

  register: function(name, email, phone, password) {
    const users = Utils.getStorage('vet_users', []);
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      Utils.showToast('Bu e-posta adresi ile zaten kayıtlı bir hesap var.', 'error');
      return false;
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name,
      email: email,
      phone: phone,
      password: password,
      role: 'customer',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    Utils.setStorage('vet_users', users);
    localStorage.setItem('vet_current_user', JSON.stringify(newUser));

    Utils.showToast('Kayıt başarıyla oluşturuldu!', 'success');
    setTimeout(() => {
      window.location.href = 'profil/index.html';
    }, 1000);
    return true;
  },

  logout: function() {
    localStorage.removeItem('vet_current_user');
    Utils.showToast('Oturum kapatıldı.', 'info');
    setTimeout(() => {
      window.location.href = '../giris.html';
    }, 800);
  }
};
