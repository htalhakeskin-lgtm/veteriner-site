/* ═══════════════════════════════════════════════════
   MOCK DATA — Initial LocalStorage Database
   ═══════════════════════════════════════════════════ */

const INITIAL_MOCK_DATA = {
  users: [
    {
      id: "usr-1",
      name: "Ayşe Kaya",
      email: "musteri@demo.com",
      password: "123456", // Mock plain text for demo
      phone: "0532 111 22 33",
      role: "customer",
      createdAt: "2026-01-15"
    },
    {
      id: "usr-2",
      name: "Dr. Ahmet Yılmaz (Admin)",
      email: "admin@demo.com",
      password: "admin123",
      phone: "0532 999 88 77",
      role: "admin",
      createdAt: "2025-10-01"
    }
  ],
  pets: [
    {
      id: "pet-1",
      userId: "usr-1",
      name: "Boncuk",
      type: "Kedi",
      breed: "British Shorthair",
      age: 3,
      gender: "Dişi",
      neutered: true,
      weight: 4.5,
      microchip: "TR-982000012345",
      photo: "assets/images/pets/cat.jpg"
    },
    {
      id: "pet-2",
      userId: "usr-1",
      name: "Karamel",
      type: "Köpek",
      breed: "Golden Retriever",
      age: 5,
      gender: "Erkek",
      neutered: true,
      weight: 28.0,
      microchip: "TR-982000054321",
      photo: "assets/images/pets/dog.jpg"
    }
  ],
  appointments: [
    {
      id: "rnd-101",
      userId: "usr-1",
      petId: "pet-1",
      petName: "Boncuk",
      serviceId: "genel-muayene",
      serviceTitle: "Genel Muayene",
      vetId: "vet-1",
      vetName: "Dr. Ahmet Yılmaz",
      date: "2026-09-25",
      time: "14:30",
      status: "confirmed", // confirmed | pending | cancelled | completed
      notes: "Yıllık rutine genel sağlık kontrolü",
      createdAt: "2026-09-20"
    },
    {
      id: "rnd-102",
      userId: "usr-1",
      petId: "pet-2",
      petName: "Karamel",
      serviceId: "asilama",
      serviceTitle: "Aşılama",
      vetId: "vet-2",
      vetName: "Dr. Elif Kaya",
      date: "2026-10-02",
      time: "10:00",
      status: "pending",
      notes: "Kuduz aşısı tekrarı",
      createdAt: "2026-09-21"
    }
  ],
  healthRecords: [
    {
      id: "rec-1",
      petId: "pet-1",
      date: "2026-03-15",
      title: "Karma Aşı",
      type: "Aşı",
      vetName: "Dr. Ahmet Yılmaz",
      description: "Yıllık Karma Aşı dozu başarıyla uygulandı.",
      nextDueDate: "2027-03-15"
    },
    {
      id: "rec-2",
      petId: "pet-1",
      date: "2026-05-10",
      title: "Genel Sağlık Muayenesi",
      type: "Muayene",
      vetName: "Dr. Ahmet Yılmaz",
      description: "Diş ve kulak hijyeni kontrol edildi. Sağlık durumu gayet iyi.",
      nextDueDate: null
    }
  ]
};

// Function to initialize localStorage database if empty
function initMockDatabase() {
  if (!localStorage.getItem("vet_users")) {
    localStorage.setItem("vet_users", JSON.stringify(INITIAL_MOCK_DATA.users));
  }
  if (!localStorage.getItem("vet_pets")) {
    localStorage.setItem("vet_pets", JSON.stringify(INITIAL_MOCK_DATA.pets));
  }
  if (!localStorage.getItem("vet_appointments")) {
    localStorage.setItem("vet_appointments", JSON.stringify(INITIAL_MOCK_DATA.appointments));
  }
  if (!localStorage.getItem("vet_healthRecords")) {
    localStorage.setItem("vet_healthRecords", JSON.stringify(INITIAL_MOCK_DATA.healthRecords));
  }
}

initMockDatabase();
