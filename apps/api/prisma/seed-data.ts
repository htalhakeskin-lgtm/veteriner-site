/**
 * Seed içeriği — statik demo verisi.
 * Mantık prisma/seed.ts içinde; burada sadece "ne" var, "nasıl" değil.
 *
 * DİKKAT: slug alanları bilerek ASCII kalır (genel-muayene, dis-bakimi…).
 * Türkçe karaktere çevrilirlerse URL'ler ve kayıtlı bağlantılar kırılır.
 */

/**
 * Demo görselleri Unsplash'ten (telifsiz) çekiliyor.
 *
 * Gerçek kurulumda kliniğin kendi fotoğrafları yönetim panelinden
 * yüklenmeli. Bunlar yalnızca sunum sırasında sitenin boş görünmemesi
 * için; internet bağlantısı gerektirirler.
 */
const STOCK = 'https://images.unsplash.com/photo-';

export const SERVICES = [
  {
    slug: 'genel-muayene',
    title: 'Genel Muayene',
    shortDesc: 'Baştan ayağa kontrol, kilo ve beslenme değerlendirmesi.',
    longDesc:
      'Vücut sıcaklığı, kalp ve akciğer dinlemesi, karın palpasyonu, göz-kulak-ağız kontrolü ve kilo takibi yapılır. Ortalama 30 dakika ayrılır; acele ettirilmez.',
    icon: 'stethoscope',
    category: 'Genel',
    durationMinutes: 30,
    isFeatured: true,
    price: 750,
  },
  {
    slug: 'asilama',
    title: 'Aşılama & Koruyucu Hekimlik',
    shortDesc: 'Karma, kuduz ve iç-dış parazit programı.',
    longDesc:
      'Yaşa ve yaşam tarzına göre kişiselleştirilmiş aşı takvimi oluşturulur. Takvim sistem tarafından takip edilir, zamanı gelince hatırlatma gönderilir.',
    icon: 'syringe',
    category: 'Koruyucu',
    durationMinutes: 20,
    isFeatured: true,
    price: 600,
  },
  {
    slug: 'cerrahi',
    title: 'Cerrahi Operasyonlar',
    shortDesc: 'Modern anestezi ve kesintisiz monitörizasyon.',
    longDesc:
      'Yumuşak doku ve ortopedik operasyonlar, tam donanımlı ameliyathanede yapılır. Operasyon boyunca kalp ritmi, oksijen satürasyonu ve tansiyon izlenir.',
    icon: 'scissors',
    category: 'Cerrahi',
    durationMinutes: 90,
    isFeatured: true,
    price: 4500,
  },
  {
    slug: 'dis-bakimi',
    title: 'Diş Bakımı',
    shortDesc: 'Ultrasonik diş taşı temizliği ve ağız sağlığı.',
    longDesc:
      'Ultrasonik diş taşı temizliği, diş çekimi, ağız içi muayene ve periodontal tedaviler. Ağız sağlığı genel sağlığın ayrılmaz parçasıdır.',
    icon: 'smile',
    category: 'Genel',
    durationMinutes: 45,
    isFeatured: true,
    price: 2200,
  },
  {
    slug: 'dermatoloji',
    title: 'Dermatoloji',
    shortDesc: 'Cilt hastalıkları, alerji testleri ve tedavi.',
    longDesc:
      'Kaşıntı, tüy dökülmesi, mantar ve alerji problemlerinin tanı ve tedavisi. Deri kazıntı, sitoloji ve kültür testleri uygulanır.',
    icon: 'shield',
    category: 'Uzmanlık',
    durationMinutes: 30,
    isFeatured: false,
    price: 900,
  },
  {
    slug: 'radyoloji',
    title: 'Radyoloji & Görüntüleme',
    shortDesc: 'Dijital röntgen ve ultrason ile hassas tanı.',
    longDesc:
      'Dijital röntgen ve ultrason ile iç organların detaylı görüntülenmesi. Sonuçlar aynı ziyarette ekranda birlikte incelenir.',
    icon: 'scan',
    category: 'Tanı',
    durationMinutes: 30,
    isFeatured: false,
    price: 1100,
  },
  {
    slug: 'laboratuvar',
    title: 'Laboratuvar Hizmetleri',
    shortDesc: 'Hemogram, biyokimya, idrar ve dışkı analizleri.',
    longDesc:
      'Tam kan sayımı, biyokimya paneli, idrar analizi ve dışkı parazit taraması klinik içinde yapılır; çoğu sonuç 20 dakikada çıkar.',
    icon: 'flask',
    category: 'Tanı',
    durationMinutes: 20,
    isFeatured: false,
    price: 850,
  },
  {
    slug: 'kisirlastirma',
    title: 'Kısırlaştırma',
    shortDesc: 'Güvenli operasyon ve sonrası bakım takibi.',
    longDesc:
      'Kedi ve köpekler için güvenli anestezi altında kısırlaştırma. Operasyon sonrası bakım talimatları yazılı verilir, kontrol randevusu planlanır.',
    icon: 'heart',
    category: 'Cerrahi',
    durationMinutes: 90,
    isFeatured: false,
    price: 3800,
  },
  {
    slug: 'dahiliye',
    title: 'İç Hastalıkları',
    shortDesc: 'Diyabet, böbrek ve karaciğer takibi.',
    longDesc:
      'Diyabet, böbrek yetmezliği, karaciğer hastalıkları ve tiroid bozukluklarının tanı, tedavi ve uzun dönem takibi.',
    icon: 'activity',
    category: 'Uzmanlık',
    durationMinutes: 40,
    isFeatured: false,
    price: 950,
  },
  {
    slug: 'mikrocip',
    title: 'Mikroçip Uygulaması',
    shortDesc: 'Kayıp riskine karşı kalıcı kimlik çözümü.',
    longDesc:
      'ISO standartlarına uygun mikroçip uygulaması ve ulusal veri tabanına kayıt. İşlem birkaç saniye sürer, anestezi gerektirmez.',
    icon: 'cpu',
    category: 'Genel',
    durationMinutes: 15,
    isFeatured: false,
    price: 700,
  },
] as const;

export const STAFF = [
  {
    slug: 'dr-ahmet-yilmaz',
    fullName: 'Dr. Ahmet Yılmaz',
    title: 'Baş Veteriner Hekim',
    speciality: 'Genel Cerrahi & İç Hastalıkları',
    experienceYears: 15,
    education: 'İstanbul Üniversitesi Veteriner Fakültesi',
    bio: 'İstanbul Üniversitesi mezunu. 15 yıldır küçük hayvan cerrahisi ve iç hastalıkları alanında çalışıyor; ortopedik vakalar özel ilgi alanı.',
    photoUrl: `${STOCK}1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80`,
    // Bu hekim her hizmeti verebiliyor
    serviceSlugs: null,
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
    ],
  },
  {
    slug: 'dr-elif-kaya',
    fullName: 'Dr. Elif Kaya',
    title: 'Veteriner Hekim',
    speciality: 'Dermatoloji & Beslenme',
    experienceYears: 10,
    education: 'Ankara Üniversitesi Veteriner Fakültesi',
    bio: 'Ankara Üniversitesi mezunu. Kaşıntı ve alerji vakalarında sabırlı takip yapar, sahibe özel diyet planları hazırlar.',
    photoUrl: `${STOCK}1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80`,
    serviceSlugs: [
      'genel-muayene',
      'asilama',
      'dermatoloji',
      'laboratuvar',
      'dahiliye',
      'dis-bakimi',
      'mikrocip',
    ],
    schedule: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '19:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
    ],
  },
  {
    slug: 'dr-mehmet-demir',
    fullName: 'Dr. Mehmet Demir',
    title: 'Veteriner Hekim',
    speciality: 'Ortopedi & Radyoloji',
    experienceYears: 8,
    education: 'Uludağ Üniversitesi Veteriner Fakültesi',
    bio: 'Uludağ Üniversitesi mezunu. Kırık, eklem ve omurga vakalarında dijital görüntüleme ağırlıklı çalışır.',
    photoUrl: `${STOCK}1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=80`,
    serviceSlugs: [
      'genel-muayene',
      'radyoloji',
      'cerrahi',
      'kisirlastirma',
      'laboratuvar',
      'asilama',
    ],
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
] as const;

/** Demo müşterileri — Türkçe isimler, gerçekçi telefon formatı. */
export const CUSTOMER_NAMES = [
  'Ayşe Kara', 'Mehmet Yıldız', 'Zeynep Aksoy', 'Ali Koç', 'Fatma Demir',
  'Mustafa Şahin', 'Elif Yılmaz', 'Can Öztürk', 'Merve Arslan', 'Burak Doğan',
  'Seda Çelik', 'Emre Aydın', 'Gizem Polat', 'Okan Kurt', 'Deniz Erdoğan',
  'İpek Taş', 'Kerem Bulut', 'Nazlı Özdemir', 'Serkan Avcı', 'Pelin Güler',
] as const;

export const CAT_NAMES = [
  'Boncuk', 'Pamuk', 'Minnoş', 'Tekir', 'Duman', 'Zeytin', 'Mısket',
  'Sütlaç', 'Fındık', 'Kömür', 'Lokum', 'Badem',
] as const;

export const DOG_NAMES = [
  'Karamel', 'Rocky', 'Paşa', 'Luna', 'Max', 'Çakıl', 'Bal', 'Kont',
  'Zeus', 'Mia', 'Tarçın', 'Cesur',
] as const;

export const CAT_BREEDS = [
  'British Shorthair', 'Tekir', 'İran Kedisi', 'Scottish Fold',
  'Van Kedisi', 'Ankara Kedisi', 'Siyam',
] as const;

export const DOG_BREEDS = [
  'Golden Retriever', 'Alman Çoban', 'Labrador', 'Pomeranian',
  'Kangal', 'Beagle', 'Cocker Spaniel', 'Terrier',
] as const;

export const BLOG_CATEGORIES = [
  { slug: 'beslenme', name: 'Beslenme', icon: 'utensils', sortOrder: 1 },
  { slug: 'bakim', name: 'Bakım', icon: 'bath', sortOrder: 2 },
  { slug: 'saglik', name: 'Sağlık', icon: 'heart', sortOrder: 3 },
  { slug: 'egitim', name: 'Eğitim', icon: 'graduation-cap', sortOrder: 4 },
  { slug: 'genel', name: 'Genel', icon: 'newspaper', sortOrder: 5 },
] as const;

export const BLOG_POSTS = [
  {
    slug: 'kedi-beslenme-rehberi',
    coverImageUrl: `${STOCK}1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80`,
    title: 'Kedinizin Beslenmesinde Dikkat Etmeniz Gereken 7 Nokta',
    categorySlug: 'beslenme',
    excerpt:
      'Mamanın üzerindeki etiketi okumak, su tüketimini takip etmek ve porsiyon kontrolü: kedinizin ömrünü uzatan alışkanlıklar.',
    readMinutes: 6,
    body: [
      'Kediler zorunlu etçildir. Bu, mamadaki protein oranının bitkisel kaynaklı olmaması gerektiği anlamına gelir. Etiketteki ilk üç malzemeye bakın: ilk sırada "tavuk unu" değil "tavuk" yazıyorsa iyi bir işarettir.',
      'Kediler susuzluğa dayanıklı görünür ama bu bir avantaj değil, risktir. Doğada avlarından su alan kediler, kuru mama ile beslendiğinde kronik su açığına girebilir ve bu böbrekleri yorar. Su kabını mama kabından uzağa koyun; akan su çeşmeleri tüketimi belirgin şekilde artırır.',
      'Porsiyon kontrolü en çok atlanan konu. Mama kabını sürekli dolu tutmak yerine günlük miktarı tartıp iki öğüne bölmek, kilo problemlerinin büyük bölümünü baştan önler.',
      'Ani mama değişikliği ishale yol açar. Yeni mamaya geçerken 7 gün boyunca kademeli karıştırın: ilk iki gün dörtte bir, sonraki iki gün yarım, sonra dörtte üç.',
    ],
  },
  {
    slug: 'kopek-asi-takvimi',
    coverImageUrl: `${STOCK}1601758228041-f3b2795255f1?auto=format&fit=crop&w=1200&q=80`,
    title: 'Yavru Köpeklerde Aşı Takvimi Nasıl İlerler?',
    categorySlug: 'saglik',
    excerpt:
      'İlk aşı ne zaman yapılır, kuduz kaçıncı haftada gelir, tekrarlar neden önemlidir? Adım adım takvim.',
    readMinutes: 5,
    body: [
      'Yavrular anne sütüyle geçici bağışıklık alır. Bu koruma 6-8. haftalarda zayıflamaya başlar; aşı takvimi tam bu aralıkta devreye girer.',
      'Karma aşı genellikle 6-8. haftada yapılır ve 3-4 hafta arayla iki tekrar gelir. Tekrarlar opsiyonel değildir: tek doz, kalıcı bağışıklık için yeterli olmaz.',
      'Kuduz aşısı ülkemizde yasal zorunluluktur ve genellikle 12. haftadan sonra uygulanır. Seyahat planınız varsa mikroçip ile birlikte planlanması gerekir.',
      'Aşı sonrası 24 saat hafif halsizlik normaldir. Yüzde şişlik, kusma veya nefes darlığı normal değildir; bu durumda hemen aramanız gerekir.',
    ],
  },
  {
    slug: 'dis-tasi-neden-tehlikeli',
    coverImageUrl: `${STOCK}1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80`,
    title: 'Diş Taşı Neden Sadece Bir Estetik Sorun Değil?',
    categorySlug: 'saglik',
    excerpt:
      'Ağızdaki bakteriler kan dolaşımına karışıp kalp ve böbrekleri etkileyebilir. Erken müdahale neden önemli?',
    readMinutes: 4,
    body: [
      'Diş taşı, dişeti ile diş arasında bakteri barındıran sert bir tabakadır. Koku yalnızca görünen sonucudur.',
      'İlerlemiş periodontal hastalıkta bakteriler kan dolaşımına geçebilir. Kalp kapakçıkları ve böbrekler bu yükten en çok etkilenen organlardır.',
      'Evde fırça alışkanlığı küçükken kazandırılırsa en etkili korumadır. İnsan diş macunu kullanılmaz: florü zehirlidir.',
      'Yılda bir ağız kontrolü, ileri yaşta anestezi gerektiren büyük işlemlerin çoğunu önler.',
    ],
  },
  {
    slug: 'kedi-stres-belirtileri',
    coverImageUrl: `${STOCK}1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80`,
    title: 'Kedinizde Stresi Nasıl Anlarsınız?',
    categorySlug: 'bakim',
    excerpt:
      'Kum dışına tuvalet, aşırı yalanma ve saklanma: çoğu zaman huysuzluk değil, stres işareti.',
    readMinutes: 5,
    body: [
      'Kediler rahatsızlığı gizlemekte ustadır. Davranış değişikliği genellikle ilk ve tek sinyaldir.',
      'Kum kabının dışına tuvalet yapmak çoğu zaman inat değil, idrar yolu problemi veya stres göstergesidir. Önce tıbbi neden elenmelidir.',
      'Aşırı yalanmaya bağlı tüy dökülmesi, özellikle karın ve bacak içlerinde, kaygı kaynaklı olabilir.',
      'Ev değişikliği, yeni bir hayvan veya mobilya düzeni gibi küçük görünen olaylar kediler için büyük değişimdir. Dikey alan ve saklanma noktası sağlamak belirgin rahatlama yaratır.',
    ],
  },
  {
    slug: 'kisirlastirma-dogru-zaman',
    coverImageUrl: `${STOCK}1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80`,
    title: 'Kısırlaştırma İçin Doğru Zaman Ne Zaman?',
    categorySlug: 'saglik',
    excerpt:
      'Erken mi, geç mi? Tura girmeden önce yapılmasının sağlık üzerindeki somut etkileri.',
    readMinutes: 6,
    body: [
      'Kısırlaştırma yalnızca popülasyon kontrolü değil, ciddi bir koruyucu sağlık uygulamasıdır.',
      'Dişilerde ilk türden önce yapılan operasyon, meme tümörü riskini belirgin ölçüde düşürür. Rahim iltihabı (pyometra) riski de ortadan kalkar.',
      'Erkeklerde prostat problemleri ve bazı davranış kaynaklı kaçma girişimleri azalır.',
      'Irk ve vücut yapısına göre ideal zamanlama değişir; özellikle büyük ırk köpeklerde eklem gelişimi dikkate alınmalıdır. Karar hekiminizle birlikte verilmelidir.',
    ],
  },
  {
    slug: 'yasli-hayvan-bakimi',
    coverImageUrl: `${STOCK}1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80`,
    title: 'Yaşlanan Dostunuz İçin Değiştirmeniz Gereken 5 Alışkanlık',
    categorySlug: 'bakim',
    excerpt:
      'Yaş bir hastalık değil ama hastalık riskini artırır. Altı aylık kontroller ve ev düzenlemeleri.',
    readMinutes: 5,
    body: [
      'Yedi yaşından sonra yıllık kontrol yerine altı aylık kontrol önerilir. Erken yakalanan böbrek ve tiroid problemleri çok daha iyi yönetilir.',
      'Kayan zeminler eklem ağrısı olan hayvanlar için risklidir. Halı veya kaymaz paspas belirgin fark yaratır.',
      'Mama kabını yükseltmek, boyun ve omuz üzerindeki yükü azaltır.',
      'Kilo takibi kritiktir: fazla kilo eklemlerdeki yükü katlar, zayıflama ise gizli bir hastalığın ilk işareti olabilir.',
      'Bilişsel değişiklikler (gece huzursuzluğu, yön kaybı) yaşlanmanın normal parçası değildir; tedavi edilebilir.',
    ],
  },
  {
    slug: 'acil-durum-rehberi',
    coverImageUrl: `${STOCK}1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80`,
    title: 'Hangi Durumda Sabahı Beklememelisiniz?',
    categorySlug: 'saglik',
    excerpt:
      'Zehirlenme şüpheleri, nefes güçlüğü ve idrar yapamama: bekleyemeyecek durumlar listesi.',
    readMinutes: 4,
    body: [
      'Nefes güçlüğü her zaman acildir. Açık ağızla nefes alan bir kedi, hastane yolunda olmalıdır.',
      'Erkek kedilerde idrar yapamama saatler içinde hayati tehlike yaratır. Kum kabına girip çıkıp boşaltamayan kedi beklemez.',
      'Çikolata, üzüm, kuru üzüm, soğan, sarımsak, ksilitol ve zambak (kedilerde) zehirlidir. Şüpheli tüketimde miktar bilinmese bile aranmalıdır.',
      'Kusma ve ishal tek başına her zaman acil değildir, ancak kanlı ise, 24 saati aştıysa veya hayvan su içemiyorsa acildir.',
      'Karın şişliği ve huzursuzluk, özellikle büyük ırk köpeklerde mide burulması olabilir; dakikalar önemlidir.',
    ],
  },
  {
    slug: 'yeni-yavru-eve-geldi',
    coverImageUrl: `${STOCK}1425082661705-1834bfd09dca?auto=format&fit=crop&w=1200&q=80`,
    title: 'Eve Yeni Yavru Geldi: İlk Haftada Yapılacaklar',
    categorySlug: 'egitim',
    excerpt:
      'İlk veteriner ziyareti, tuvalet eğitimi ve sosyalleşme penceresi hakkında bilmeniz gerekenler.',
    readMinutes: 6,
    body: [
      'İlk veteriner ziyareti, yavru eve geldikten sonraki ilk birkaç gün içinde yapılmalıdır. Amaç sadece aşı değil; parazit taraması ve genel değerlendirmedir.',
      'Sosyalleşme penceresi köpeklerde yaklaşık 3-14 hafta arasıdır. Bu dönemde güvenli şekilde karşılaştığı her yeni ses, zemin ve insan, ileride sakin bir yetişkin olmasını sağlar.',
      'Tuvalet eğitiminde ceza işe yaramaz; doğru yere yaptığında hemen ödüllendirmek işe yarar.',
      'Yalnız kalmaya alışkanlığı küçük adımlarla kazandırın. İlk günden uzun süreli yalnızlık, ayrılık kaygısının en sık nedenidir.',
    ],
  },
] as const;

export const TESTIMONIALS = [
  {
    authorName: 'Ayşe K.',
    petName: 'Boncuk',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Boncuk'un ameliyatından iki gün sonra beni arayıp nasıl olduğunu sordular. Bunu başka hiçbir yerde görmedim.",
  },
  {
    authorName: 'Mehmet Y.',
    petName: 'Karamel',
    petSpecies: 'DOG' as const,
    rating: 5,
    text: 'Karamel veterinerden çok korkardı. Burada kapıdan içeri kendi giriyor artık. Acele ettirmiyorlar.',
  },
  {
    authorName: 'Fatma D.',
    petName: 'Minnoş',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Gece 2'de zehirlenme şüphesiyle aradık, telefonu hekim açtı. On dakikada kliniğe aldılar.",
  },
  {
    authorName: 'Zeynep A.',
    petName: 'Pamuk',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Pamuk'un cilt problemi aylardır geçmiyordu. Dr. Elif sabırla takip etti, diyet değişikliğiyle çözüldü.",
  },
  {
    authorName: 'Ali K.',
    petName: 'Rocky',
    petSpecies: 'DOG' as const,
    rating: 5,
    text: "Rocky'nın bacak kırığı operasyonu başarılı geçti. Röntgenleri ekranda tek tek anlattılar, ne yapıldığını anladım.",
  },
  {
    authorName: 'Merve A.',
    petName: 'Luna',
    petSpecies: 'DOG' as const,
    rating: 4,
    text: 'Yoğun saatlerde biraz beklemek gerekebiliyor ama muayenede hiç acele yok. Bu takası kabul ederim.',
  },
] as const;

export const MEDICAL_TEMPLATES = [
  {
    type: 'VACCINATION' as const,
    title: 'Karma Aşı',
    description: 'Yıllık karma aşı dozu uygulandı. Reaksiyon gözlenmedi.',
    repeatMonths: 12,
  },
  {
    type: 'VACCINATION' as const,
    title: 'Kuduz Aşısı',
    description: 'Kuduz aşısı uygulandı, kayıt sistemine işlendi.',
    repeatMonths: 12,
  },
  {
    type: 'VACCINATION' as const,
    title: 'İç-Dış Parazit',
    description: 'Parazit uygulaması yapıldı.',
    repeatMonths: 3,
  },
  {
    type: 'EXAMINATION' as const,
    title: 'Genel Sağlık Muayenesi',
    description: 'Genel durum iyi. Kilo ve beslenme uygun.',
    repeatMonths: null,
  },
  {
    type: 'EXAMINATION' as const,
    title: 'Kontrol Muayenesi',
    description: 'Önceki tedavinin kontrolü yapıldı, iyileşme beklendiği gibi.',
    repeatMonths: null,
  },
  {
    type: 'LAB_TEST' as const,
    title: 'Kan Tahlili',
    description:
      'Hemogram ve biyokimya paneli çalışıldı. Değerler referans aralığında.',
    repeatMonths: null,
  },
  {
    type: 'TREATMENT' as const,
    title: 'Diş Taşı Temizliği',
    description: 'Ultrasonik diş taşı temizliği yapıldı.',
    repeatMonths: 12,
  },
  {
    type: 'SURGERY' as const,
    title: 'Kısırlaştırma Operasyonu',
    description: 'Operasyon sorunsuz tamamlandı. Dikişler 10. gün alındı.',
    repeatMonths: null,
  },
] as const;
