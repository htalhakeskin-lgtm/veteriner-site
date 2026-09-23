/**
 * ═══════════════════════════════════════════════════════════
 *  VETERİNER KLİNİK DEMO — ANA KONFİGÜRASYON DOSYASI
 * ═══════════════════════════════════════════════════════════
 *
 *  Bu dosya tüm sitenin kalbidir.
 *  Bir klinike teklif verirken sadece bu dosyayı düzenle:
 *    1. clinic.name → Klinik adını yaz
 *    2. theme.activePreset → Tema seç
 *    3. contact → İletişim bilgilerini gir
 *    4. Kaydet → Tüm site otomatik güncellenir
 *
 * ═══════════════════════════════════════════════════════════
 */

const SITE_CONFIG = {

  // ═══════════════════════════════════════
  //  KLİNİK BİLGİLERİ
  // ═══════════════════════════════════════
  clinic: {
    name: "Klinik Adı",
    slogan: "Dostlarınız İçin En İyi Bakım",
    description: "Modern veteriner hizmetleri ile evcil dostlarınıza en iyi bakımı sunuyoruz. Uzman kadromuz ve son teknoloji ekipmanlarımızla 7/24 yanınızdayız.",
    shortDescription: "Profesyonel veteriner hizmetleri",
    foundedYear: 2010,
    totalPatients: 27000,
    experienceYears: 15,
    satisfactionRate: 4.9,
    logoUrl: "", // Boşsa klinik adı metin olarak kullanılır
  },

  // ═══════════════════════════════════════
  //  İLETİŞİM BİLGİLERİ
  // ═══════════════════════════════════════
  contact: {
    phone: "0262 000 00 00",
    phoneRaw: "+902620000000",
    whatsapp: "+905000000000",
    whatsappMessage: "Merhaba, randevu almak istiyorum.",
    email: "info@klinikadi.com",
    instagram: "klinikadi",
    instagramUrl: "https://instagram.com/klinikadi",
    facebook: "",
    facebookUrl: "",
    twitter: "",
    twitterUrl: "",
    address: {
      full: "Örnek Mah. Veteriner Cad. No:1 Merkez/İstanbul",
      street: "Örnek Mah. Veteriner Cad. No:1",
      district: "Merkez",
      city: "İstanbul",
      zipCode: "34000",
      country: "Türkiye",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.1!2d28.97!3d41.01!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDAwJzI5LjQiTiAyOMKwNTgnMTIuMCJF!5e0!3m2!1str!2str!4v1",
      lat: 41.0082,
      lng: 28.9784,
    },
    workingHours: {
      weekdays: { open: "09:00", close: "20:00", label: "Pazartesi - Cuma" },
      saturday: { open: "09:00", close: "18:00", label: "Cumartesi" },
      sunday: { open: null, close: null, label: "Pazar - Kapalı" },
      emergency: true,
      emergencyPhone: "0532 000 00 00",
      emergencyLabel: "7/24 Acil Hizmet",
    },
  },

  // ═══════════════════════════════════════
  //  TEMA AYARLARI
  // ═══════════════════════════════════════
  theme: {
    activePreset: "doga",

    presets: {
      doga: {
        name: "Doğa",
        emoji: "🌿",
        primary: "#4CAF7D",
        primaryLight: "#6BC49A",
        primaryDark: "#388E5E",
        primaryRgb: "76, 175, 125",
        secondary: "#1E3A5F",
        secondaryLight: "#2C5282",
        secondaryRgb: "30, 58, 95",
        accent: "#E8A838",
        accentLight: "#F0C060",
        accentRgb: "232, 168, 56",
        background: "#FAFAF7",
        backgroundAlt: "#F0EDE6",
        surface: "#FFFFFF",
        surfaceHover: "#F8F8F5",
        text: "#2D3436",
        textLight: "#636E72",
        textMuted: "#B2BEC3",
        border: "#E0DDD6",
        borderLight: "#F0EDE6",
        success: "#27AE60",
        successLight: "#E8F8EF",
        warning: "#F39C12",
        warningLight: "#FEF5E7",
        error: "#E74C3C",
        errorLight: "#FDEDEC",
        info: "#3498DB",
        infoLight: "#EBF5FB",
        headerBg: "rgba(255, 255, 255, 0.95)",
        headerText: "#2D3436",
        footerBg: "#1E3A5F",
        footerText: "#FFFFFF",
        footerTextMuted: "rgba(255, 255, 255, 0.6)",
        heroOverlay: "linear-gradient(135deg, rgba(30, 58, 95, 0.85) 0%, rgba(76, 175, 125, 0.6) 100%)",
        gradientPrimary: "linear-gradient(135deg, #4CAF7D 0%, #388E5E 100%)",
        gradientSecondary: "linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)",
        gradientHero: "linear-gradient(135deg, #1E3A5F 0%, #2C5282 50%, #4CAF7D 100%)",
        gradientCta: "linear-gradient(135deg, #E8A838 0%, #D4922E 100%)",
        shadowColor: "rgba(76, 175, 125, 0.15)",
        mode: "light",
      },
      okyanus: {
        name: "Okyanus",
        emoji: "🌊",
        primary: "#2196F3",
        primaryLight: "#64B5F6",
        primaryDark: "#1565C0",
        primaryRgb: "33, 150, 243",
        secondary: "#0D47A1",
        secondaryLight: "#1976D2",
        secondaryRgb: "13, 71, 161",
        accent: "#FF9800",
        accentLight: "#FFB74D",
        accentRgb: "255, 152, 0",
        background: "#F5F9FF",
        backgroundAlt: "#E3F2FD",
        surface: "#FFFFFF",
        surfaceHover: "#F0F7FF",
        text: "#1A237E",
        textLight: "#5C6BC0",
        textMuted: "#9FA8DA",
        border: "#BBDEFB",
        borderLight: "#E3F2FD",
        success: "#4CAF50",
        successLight: "#E8F5E9",
        warning: "#FF9800",
        warningLight: "#FFF3E0",
        error: "#F44336",
        errorLight: "#FFEBEE",
        info: "#03A9F4",
        infoLight: "#E1F5FE",
        headerBg: "rgba(255, 255, 255, 0.95)",
        headerText: "#1A237E",
        footerBg: "#0D47A1",
        footerText: "#FFFFFF",
        footerTextMuted: "rgba(255, 255, 255, 0.6)",
        heroOverlay: "linear-gradient(135deg, rgba(13, 71, 161, 0.85) 0%, rgba(33, 150, 243, 0.6) 100%)",
        gradientPrimary: "linear-gradient(135deg, #2196F3 0%, #1565C0 100%)",
        gradientSecondary: "linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)",
        gradientHero: "linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #2196F3 100%)",
        gradientCta: "linear-gradient(135deg, #FF9800 0%, #E68900 100%)",
        shadowColor: "rgba(33, 150, 243, 0.15)",
        mode: "light",
      },
      lavanta: {
        name: "Lavanta",
        emoji: "💜",
        primary: "#7E57C2",
        primaryLight: "#B39DDB",
        primaryDark: "#4527A0",
        primaryRgb: "126, 87, 194",
        secondary: "#4A148C",
        secondaryLight: "#6A1B9A",
        secondaryRgb: "74, 20, 140",
        accent: "#FFB74D",
        accentLight: "#FFD54F",
        accentRgb: "255, 183, 77",
        background: "#FAF5FF",
        backgroundAlt: "#F3E5F5",
        surface: "#FFFFFF",
        surfaceHover: "#F8F0FF",
        text: "#311B92",
        textLight: "#7C4DFF",
        textMuted: "#CE93D8",
        border: "#E1BEE7",
        borderLight: "#F3E5F5",
        success: "#66BB6A",
        successLight: "#E8F5E9",
        warning: "#FFA726",
        warningLight: "#FFF3E0",
        error: "#EF5350",
        errorLight: "#FFEBEE",
        info: "#42A5F5",
        infoLight: "#E3F2FD",
        headerBg: "rgba(255, 255, 255, 0.95)",
        headerText: "#311B92",
        footerBg: "#4A148C",
        footerText: "#FFFFFF",
        footerTextMuted: "rgba(255, 255, 255, 0.6)",
        heroOverlay: "linear-gradient(135deg, rgba(74, 20, 140, 0.85) 0%, rgba(126, 87, 194, 0.6) 100%)",
        gradientPrimary: "linear-gradient(135deg, #7E57C2 0%, #4527A0 100%)",
        gradientSecondary: "linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%)",
        gradientHero: "linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #7E57C2 100%)",
        gradientCta: "linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)",
        shadowColor: "rgba(126, 87, 194, 0.15)",
        mode: "light",
      },
      klasik: {
        name: "Klasik",
        emoji: "🏛️",
        primary: "#C62828",
        primaryLight: "#EF5350",
        primaryDark: "#B71C1C",
        primaryRgb: "198, 40, 40",
        secondary: "#1B5E20",
        secondaryLight: "#2E7D32",
        secondaryRgb: "27, 94, 32",
        accent: "#FFC107",
        accentLight: "#FFD54F",
        accentRgb: "255, 193, 7",
        background: "#FFFDF5",
        backgroundAlt: "#FFF8E1",
        surface: "#FFFFFF",
        surfaceHover: "#FFFCF0",
        text: "#3E2723",
        textLight: "#6D4C41",
        textMuted: "#BCAAA4",
        border: "#D7CCC8",
        borderLight: "#EFEBE9",
        success: "#43A047",
        successLight: "#E8F5E9",
        warning: "#FB8C00",
        warningLight: "#FFF3E0",
        error: "#D32F2F",
        errorLight: "#FFEBEE",
        info: "#1E88E5",
        infoLight: "#E3F2FD",
        headerBg: "rgba(255, 255, 255, 0.95)",
        headerText: "#3E2723",
        footerBg: "#1B5E20",
        footerText: "#FFFFFF",
        footerTextMuted: "rgba(255, 255, 255, 0.6)",
        heroOverlay: "linear-gradient(135deg, rgba(27, 94, 32, 0.85) 0%, rgba(198, 40, 40, 0.6) 100%)",
        gradientPrimary: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
        gradientSecondary: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
        gradientHero: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #C62828 100%)",
        gradientCta: "linear-gradient(135deg, #FFC107 0%, #FFB300 100%)",
        shadowColor: "rgba(198, 40, 40, 0.15)",
        mode: "light",
      },
      midnight: {
        name: "Midnight",
        emoji: "🌙",
        primary: "#00BCD4",
        primaryLight: "#4DD0E1",
        primaryDark: "#00838F",
        primaryRgb: "0, 188, 212",
        secondary: "#FFFFFF",
        secondaryLight: "#E2E8F0",
        secondaryRgb: "255, 255, 255",
        accent: "#FF6B6B",
        accentLight: "#FF8A8A",
        accentRgb: "255, 107, 107",
        background: "#0A1628",
        backgroundAlt: "#0F1F38",
        surface: "#162A4A",
        surfaceHover: "#1E3860",
        text: "#F8FAFC",
        textLight: "#CBD5E1",
        textMuted: "#94A3B8",
        border: "rgba(255, 255, 255, 0.15)",
        borderLight: "rgba(255, 255, 255, 0.1)",
        success: "#00E676",
        successLight: "rgba(0, 230, 118, 0.15)",
        warning: "#FFAB40",
        warningLight: "rgba(255, 171, 64, 0.15)",
        error: "#FF5252",
        errorLight: "rgba(255, 82, 82, 0.15)",
        info: "#40C4FF",
        infoLight: "rgba(64, 196, 255, 0.15)",
        headerBg: "rgba(10, 22, 40, 0.95)",
        headerText: "#FFFFFF",
        footerBg: "#060E1A",
        footerText: "#FFFFFF",
        footerTextMuted: "rgba(255, 255, 255, 0.7)",
        heroOverlay: "linear-gradient(135deg, rgba(10, 22, 40, 0.9) 0%, rgba(0, 188, 212, 0.4) 100%)",
        gradientPrimary: "linear-gradient(135deg, #00BCD4 0%, #00838F 100%)",
        gradientSecondary: "linear-gradient(135deg, #00BCD4 0%, #4DD0E1 100%)",
        gradientHero: "linear-gradient(135deg, #0A1628 0%, #162A4A 50%, #00BCD4 100%)",
        gradientCta: "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
        shadowColor: "rgba(0, 188, 212, 0.25)",
        mode: "dark",
      },
    },

    // Kullanıcı özel renk seçerse
    custom: null,
  },

  // ═══════════════════════════════════════
  //  HİZMETLER
  // ═══════════════════════════════════════
  services: [
    {
      id: "genel-muayene",
      title: "Genel Muayene",
      shortDesc: "Kapsamlı sağlık kontrolü ve erken tanı ile dostunuzun sağlığını güvence altına alıyoruz.",
      longDesc: "Evcil hayvanınızın genel sağlık durumunu değerlendirmek için detaylı fiziksel muayene yapıyoruz. Kalp, akciğer, karın, göz, kulak, deri ve ağız sağlığı kontrol edilir.",
      icon: "stethoscope",
      category: "Genel",
      featured: true,
      price: null,
    },
    {
      id: "asilama",
      title: "Aşılama",
      shortDesc: "Koruyucu aşı programları ile hastalıklara karşı güçlü bağışıklık.",
      longDesc: "Karma aşı, kuduz aşısı ve diğer koruyucu aşılar ile evcil hayvanınızı bulaşıcı hastalıklardan koruyoruz. Yaşa ve türe uygun aşı takvimi oluşturulur.",
      icon: "syringe",
      category: "Koruyucu",
      featured: true,
      price: null,
    },
    {
      id: "cerrahi",
      title: "Cerrahi Operasyonlar",
      shortDesc: "Modern cerrahi teknikler ve güvenli anestezi ile operasyonlar.",
      longDesc: "Yumuşak doku cerrahisi, ortopedik operasyonlar ve acil cerrahi müdahaleler deneyimli ekibimiz tarafından gerçekleştirilir.",
      icon: "scissors",
      category: "Cerrahi",
      featured: true,
      price: null,
    },
    {
      id: "dis-bakimi",
      title: "Diş Bakımı",
      shortDesc: "Diş taşı temizliği, çekim ve ağız sağlığı tedavileri.",
      longDesc: "Ultrasonik diş taşı temizliği, diş çekimi, ağız içi muayene ve periodontal tedaviler sunuyoruz. Ağız sağlığı genel sağlığın ayrılmaz parçasıdır.",
      icon: "smile",
      category: "Genel",
      featured: true,
      price: null,
    },
    {
      id: "dermatoloji",
      title: "Dermatoloji",
      shortDesc: "Cilt hastalıkları, alerji testleri ve tedavi protokolleri.",
      longDesc: "Kaşıntı, tüy dökülmesi, mantar, alerji ve diğer cilt problemlerinin tanı ve tedavisi yapılır. Deri kazıntı ve kültür testleri uygulanır.",
      icon: "shield-plus",
      category: "Uzmanlık",
      featured: false,
      price: null,
    },
    {
      id: "radyoloji",
      title: "Radyoloji & Görüntüleme",
      shortDesc: "Dijital röntgen ve ultrason ile hassas tanı.",
      longDesc: "Son teknoloji dijital röntgen ve ultrason cihazlarımız ile iç organların detaylı görüntülenmesi sağlanır. Kırık, tümör ve iç organ hastalıklarının tanısında kullanılır.",
      icon: "scan",
      category: "Tanı",
      featured: false,
      price: null,
    },
    {
      id: "laboratuvar",
      title: "Laboratuvar Hizmetleri",
      shortDesc: "Hemogram, biyokimya, idrar ve dışkı analizleri.",
      longDesc: "Tam kan sayımı, biyokimya paneli, idrar analizi, dışkı parazit taraması ve hızlı test kitleri ile tanıya yönelik laboratuvar hizmetleri sunuyoruz.",
      icon: "flask-conical",
      category: "Tanı",
      featured: false,
      price: null,
    },
    {
      id: "kisiraştirma",
      title: "Kısırlaştırma",
      shortDesc: "Güvenli kısırlaştırma operasyonları ve sonrası bakım.",
      longDesc: "Kedi ve köpekler için güvenli anestezi altında kısırlaştırma operasyonları yapılır. Operasyon sonrası bakım ve kontrol takibi sağlanır.",
      icon: "heart-pulse",
      category: "Cerrahi",
      featured: false,
      price: null,
    },
    {
      id: "dahiliye",
      title: "İç Hastalıkları",
      shortDesc: "Kronik hastalıklar, diyabet, böbrek ve karaciğer takibi.",
      longDesc: "Diyabet, böbrek yetmezliği, karaciğer hastalıkları, tiroid bozuklukları gibi kronik hastalıkların tanı, tedavi ve takibi yapılır.",
      icon: "activity",
      category: "Uzmanlık",
      featured: false,
      price: null,
    },
    {
      id: "mikrocip",
      title: "Mikroçip Uygulaması",
      shortDesc: "Kayıp hayvan riskine karşı kalıcı kimlik çözümü.",
      longDesc: "ISO standartlarına uygun mikroçip uygulaması ile evcil hayvanınız kaybolma durumunda kolayca bulunabilir. Ulusal veri tabanına kayıt yapılır.",
      icon: "cpu",
      category: "Genel",
      featured: false,
      price: null,
    },
  ],

  // ═══════════════════════════════════════
  //  EKİP
  // ═══════════════════════════════════════
  team: [
    {
      id: "vet-ahmet",
      name: "Dr. Ahmet Yılmaz",
      title: "Baş Veteriner Hekim",
      speciality: "Genel Cerrahi & İç Hastalıkları",
      experience: "15 yıl",
      image: "assets/images/team/vet-1.jpg",
      bio: "İstanbul Üniversitesi Veteriner Fakültesi mezunu. 15 yılı aşkın deneyimi ile küçük hayvan cerrahisi ve iç hastalıkları alanında uzmanlaşmıştır. Binlerce başarılı operasyona imza atmıştır.",
      education: "İstanbul Üniversitesi Veteriner Fakültesi",
    },
    {
      id: "vet-elif",
      name: "Dr. Elif Kaya",
      title: "Veteriner Hekim",
      speciality: "Dermatoloji & Beslenme",
      experience: "10 yıl",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
      bio: "Ankara Üniversitesi Veteriner Fakültesi mezunu. Cilt hastalıkları, alerji yönetimi ve beslenme danışmanlığı konularında uzmanlaşmıştır. Hasta sahiplerine özel diyet programları hazırlar.",
      education: "Ankara Üniversitesi Veteriner Fakültesi",
    },
    {
      id: "vet-mehmet",
      name: "Dr. Mehmet Demir",
      title: "Veteriner Hekim",
      speciality: "Ortopedi & Radyoloji",
      experience: "8 yıl",
      image: "assets/images/team/vet-3.jpg",
      bio: "Uludağ Üniversitesi Veteriner Fakültesi mezunu. Kemik kırıkları, eklem problemleri ve ortopedik cerrahi alanında deneyimlidir. Dijital görüntüleme teknolojilerinde uzmandır.",
      education: "Uludağ Üniversitesi Veteriner Fakültesi",
    },
  ],

  // ═══════════════════════════════════════
  //  MÜŞTERİ YORUMLARI
  // ═══════════════════════════════════════
  testimonials: [
    {
      id: "test-1",
      name: "Ayşe Kara",
      pet: "Boncuk (British Shorthair)",
      petType: "cat",
      rating: 5,
      text: "Boncuk'un ameliyatı çok başarılı geçti. Dr. Ahmet ve ekibine sonsuz teşekkürler! Ameliyat sonrası takip de mükemmeldi.",
      date: "2026-08-15",
    },
    {
      id: "test-2",
      name: "Mehmet Yıldız",
      pet: "Karamel (Golden Retriever)",
      petType: "dog",
      rating: 5,
      text: "Karamel'in düzenli aşıları için her zaman bu kliniğe geliyoruz. İlgili ve güler yüzlü personel. Kesinlikle tavsiye ederim.",
      date: "2026-07-20",
    },
    {
      id: "test-3",
      name: "Zeynep Aksoy",
      pet: "Pamuk (İran Kedisi)",
      petType: "cat",
      rating: 5,
      text: "Pamuk'un cilt problemi Dr. Elif sayesinde tamamen düzeldi. Çok sabırlı ve özenli bir hekim. Her kontrolde gönül rahatlığıyla getiriyorum.",
      date: "2026-09-01",
    },
    {
      id: "test-4",
      name: "Ali Koç",
      pet: "Rocky (Alman Çoban)",
      petType: "dog",
      rating: 5,
      text: "Rocky'nin bacak kırığı operasyonu çok başarılı geçti. Şimdi eskisi gibi koşuyor. Klinik çok temiz ve modern.",
      date: "2026-06-10",
    },
    {
      id: "test-5",
      name: "Fatma Demir",
      pet: "Minnoş (Tekir)",
      petType: "cat",
      rating: 4,
      text: "Acil durumda gece aradığımızda hemen yönlendirdiler. Minnoş'un zehirlenme şüphesinde çok hızlı müdahale ettiler. Gerçekten 7/24 hizmet.",
      date: "2026-05-28",
    },
  ],

  // ═══════════════════════════════════════
  //  RANDEVU AYARLARI
  // ═══════════════════════════════════════
  appointment: {
    slotDuration: 30,           // dakika
    startHour: 9,
    endHour: 20,
    saturdayEndHour: 18,
    daysInAdvance: 30,          // kaç gün ileriye randevu alınabilir
    cancelBeforeHours: 72,      // kaç saat öncesine kadar iptal
    autoConfirm: false,         // true ise admin onayı gerekmez
    reminderHours: 24,          // hatırlatma
    maxDailySlots: 16,          // gün başına max randevu
    blockedDays: [0],           // 0=Pazar, 6=Cumartesi
    holidays: [],               // ["2026-01-01", "2026-04-23"] gibi
  },

  // ═══════════════════════════════════════
  //  INSTAGRAM MOCK GÖNDERİLERİ
  // ═══════════════════════════════════════
  instagramPosts: [
    { id: "ig-1", image: "assets/images/instagram/post-1.jpg", caption: "Bugünkü minik misafirimiz 🐱", likes: 124, url: "#" },
    { id: "ig-2", image: "assets/images/instagram/post-2.jpg", caption: "Aşı günü! 💉", likes: 89, url: "#" },
    { id: "ig-3", image: "assets/images/instagram/post-3.jpg", caption: "Sağlıklı patiler 🐾", likes: 156, url: "#" },
    { id: "ig-4", image: "assets/images/instagram/post-4.jpg", caption: "Operasyon sonrası gülümsemeler 😊", likes: 201, url: "#" },
    { id: "ig-5", image: "assets/images/instagram/post-5.jpg", caption: "Kliniğimizin yeni üyesi 🐶", likes: 178, url: "#" },
    { id: "ig-6", image: "assets/images/instagram/post-6.jpg", caption: "Diş bakımı günü 🦷", likes: 95, url: "#" },
  ],

  // ═══════════════════════════════════════
  //  BLOG KATEGORİLERİ
  // ═══════════════════════════════════════
  blogCategories: [
    { id: "beslenme", name: "Beslenme", icon: "utensils" },
    { id: "bakim", name: "Bakım", icon: "bath" },
    { id: "saglik", name: "Sağlık", icon: "heart-pulse" },
    { id: "egitim", name: "Eğitim", icon: "graduation-cap" },
    { id: "genel", name: "Genel", icon: "newspaper" },
  ],

  // ═══════════════════════════════════════
  //  SİTE AYARLARI
  // ═══════════════════════════════════════
  site: {
    language: "tr",
    currency: "₺",
    dateFormat: "DD.MM.YYYY",
    showEmergencyBanner: true,
    showInstagramFeed: true,
    showBlogSection: true,
    showLiveStats: true,
    showTestimonials: true,
    showTeamSection: true,
    showNewsletter: true,
    enableRegistration: true,
    enableOnlineBooking: true,
    enablePwa: true,
    maxPetsPerUser: 10,
    demoMode: true,            // Tema değiştirici panelini göster
    liveStats: {
      currentPatients: 3,
      todayTreated: 12,
      avgWaitMinutes: 15,
    },
  },

  // ═══════════════════════════════════════
  //  NAVİGASYON
  // ═══════════════════════════════════════
  navigation: {
    main: [
      { label: "Ana Sayfa", name: "Ana Sayfa", href: "index.html", url: "index.html", icon: "home" },
      { label: "Hizmetler", name: "Hizmetler", href: "hizmetler.html", url: "hizmetler.html", icon: "stethoscope" },
      { label: "Ekibimiz", name: "Ekibimiz", href: "ekibimiz.html", url: "ekibimiz.html", icon: "users" },
      { label: "Hakkımızda", name: "Hakkımızda", href: "hakkimizda.html", url: "hakkimizda.html", icon: "info" },
      { label: "Blog", name: "Blog", href: "blog.html", url: "blog.html", icon: "newspaper" },
      { label: "İletişim", name: "İletişim", href: "iletisim.html", url: "iletisim.html", icon: "map-pin" },
    ],
    footer: [
      { label: "Hizmetler", name: "Hizmetler", href: "hizmetler.html", url: "hizmetler.html" },
      { label: "Blog", name: "Blog", href: "blog.html", url: "blog.html" },
      { label: "İletişim", name: "İletişim", href: "iletisim.html", url: "iletisim.html" },
      { label: "Online Randevu", name: "Online Randevu", href: "randevu.html", url: "randevu.html" },
      { label: "Giriş Yap", name: "Giriş Yap", href: "giris.html", url: "giris.html" },
      { label: "KVKK", name: "KVKK", href: "kvkk.html", url: "kvkk.html" },
    ],
  },

  // ═══════════════════════════════════════
  // KVKK / HUKUKİ METİNLER
  // ═══════════════════════════════════════
  legal: {
    kvkkText: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel verileriniz kliniğimiz tarafından hizmet sunumu amacıyla işlenmektedir.",
    companyTitle: "Klinik Adı Veteriner Kliniği",
  },
};

// Global erişim için export
if (typeof module !== "undefined" && module.exports) {
  module.exports = SITE_CONFIG;
}
