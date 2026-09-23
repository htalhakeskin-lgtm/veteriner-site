/**
 * Seed icerigi — statik demo verisi.
 * Mantik prisma/seed.ts icinde; burada sadece "ne" var, "nasil" degil.
 */

export const SERVICES = [
  {
    slug: 'genel-muayene',
    title: 'Genel Muayene',
    shortDesc: 'Bastan ayaga kontrol, kilo ve beslenme degerlendirmesi.',
    longDesc:
      'Vucut sicakligi, kalp ve akciger dinlemesi, karin palpasyonu, goz-kulak-agiz kontrolu ve kilo takibi yapilir. Ortalama 30 dakika ayrilir; acele ettirilmez.',
    icon: 'stethoscope',
    category: 'Genel',
    durationMinutes: 30,
    isFeatured: true,
    price: 750,
  },
  {
    slug: 'asilama',
    title: 'Asilama & Koruyucu Hekimlik',
    shortDesc: 'Karma, kuduz ve ic-dis parazit programi.',
    longDesc:
      'Yasa ve yasam tarzina gore kisisellestirilmis asi takvimi olusturulur. Takvim sistem tarafindan takip edilir, zamani gelince hatirlatma gonderilir.',
    icon: 'syringe',
    category: 'Koruyucu',
    durationMinutes: 20,
    isFeatured: true,
    price: 600,
  },
  {
    slug: 'cerrahi',
    title: 'Cerrahi Operasyonlar',
    shortDesc: 'Modern anestezi ve kesintisiz monitorizasyon.',
    longDesc:
      'Yumusak doku ve ortopedik operasyonlar, tam donanimli ameliyathanede yapilir. Operasyon boyunca kalp ritmi, oksijen satürasyonu ve tansiyon izlenir.',
    icon: 'scissors',
    category: 'Cerrahi',
    durationMinutes: 90,
    isFeatured: true,
    price: 4500,
  },
  {
    slug: 'dis-bakimi',
    title: 'Dis Bakimi',
    shortDesc: 'Ultrasonik dis tasi temizligi ve agiz sagligi.',
    longDesc:
      'Ultrasonik dis tasi temizligi, dis cekimi, agiz ici muayene ve periodontal tedaviler. Agiz sagligi genel sagligin ayrilmaz parcasidir.',
    icon: 'smile',
    category: 'Genel',
    durationMinutes: 45,
    isFeatured: true,
    price: 2200,
  },
  {
    slug: 'dermatoloji',
    title: 'Dermatoloji',
    shortDesc: 'Cilt hastaliklari, alerji testleri ve tedavi.',
    longDesc:
      'Kasinti, tuy dokulmesi, mantar ve alerji problemlerinin tani ve tedavisi. Deri kazinti, sitoloji ve kultur testleri uygulanir.',
    icon: 'shield-plus',
    category: 'Uzmanlik',
    durationMinutes: 30,
    isFeatured: false,
    price: 900,
  },
  {
    slug: 'radyoloji',
    title: 'Radyoloji & Goruntuleme',
    shortDesc: 'Dijital rontgen ve ultrason ile hassas tani.',
    longDesc:
      'Dijital rontgen ve ultrason ile ic organlarin detayli goruntulenmesi. Sonuclar ayni ziyarette ekranda birlikte incelenir.',
    icon: 'scan',
    category: 'Tani',
    durationMinutes: 30,
    isFeatured: false,
    price: 1100,
  },
  {
    slug: 'laboratuvar',
    title: 'Laboratuvar Hizmetleri',
    shortDesc: 'Hemogram, biyokimya, idrar ve diski analizleri.',
    longDesc:
      'Tam kan sayimi, biyokimya paneli, idrar analizi ve diski parazit taramasi klinik icinde yapilir; cogu sonuc 20 dakikada cikar.',
    icon: 'flask-conical',
    category: 'Tani',
    durationMinutes: 20,
    isFeatured: false,
    price: 850,
  },
  {
    slug: 'kisirlastirma',
    title: 'Kisirlastirma',
    shortDesc: 'Guvenli operasyon ve sonrasi bakim takibi.',
    longDesc:
      'Kedi ve kopekler icin guvenli anestezi altinda kisirlastirma. Operasyon sonrasi bakim talimatlari yazili verilir, kontrol randevusu planlanir.',
    icon: 'heart-pulse',
    category: 'Cerrahi',
    durationMinutes: 90,
    isFeatured: false,
    price: 3800,
  },
  {
    slug: 'dahiliye',
    title: 'Ic Hastaliklari',
    shortDesc: 'Diyabet, bobrek ve karaciger takibi.',
    longDesc:
      'Diyabet, bobrek yetmezligi, karaciger hastaliklari ve tiroid bozukluklarinin tani, tedavi ve uzun donem takibi.',
    icon: 'activity',
    category: 'Uzmanlik',
    durationMinutes: 40,
    isFeatured: false,
    price: 950,
  },
  {
    slug: 'mikrocip',
    title: 'Mikrocip Uygulamasi',
    shortDesc: 'Kayip riskine karsi kalici kimlik cozumu.',
    longDesc:
      'ISO standartlarina uygun mikrocip uygulamasi ve ulusal veri tabanina kayit. Islem birkac saniye surer, anestezi gerektirmez.',
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
    fullName: 'Dr. Ahmet Yilmaz',
    title: 'Bas Veteriner Hekim',
    speciality: 'Genel Cerrahi & Ic Hastaliklari',
    experienceYears: 15,
    education: 'Istanbul Universitesi Veteriner Fakultesi',
    bio: 'Istanbul Universitesi mezunu. 15 yildir kucuk hayvan cerrahisi ve ic hastaliklari alaninda calisiyor; ortopedik vakalar ozel ilgi alani.',
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
    education: 'Ankara Universitesi Veteriner Fakultesi',
    bio: 'Ankara Universitesi mezunu. Kasinti ve alerji vakalarinda sabirli takip yapar, sahibe ozel diyet planlari hazirlar.',
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
    education: 'Uludag Universitesi Veteriner Fakultesi',
    bio: 'Uludag Universitesi mezunu. Kirik, eklem ve omurga vakalarinda dijital goruntuleme agirlikli calisir.',
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

/** Demo musterileri — Turkce isimler, gercekci telefon formati. */
export const CUSTOMER_NAMES = [
  'Ayse Kara', 'Mehmet Yildiz', 'Zeynep Aksoy', 'Ali Koc', 'Fatma Demir',
  'Mustafa Sahin', 'Elif Yilmaz', 'Can Ozturk', 'Merve Arslan', 'Burak Dogan',
  'Seda Celik', 'Emre Aydin', 'Gizem Polat', 'Okan Kurt', 'Deniz Erdogan',
  'Ipek Tas', 'Kerem Bulut', 'Nazli Ozdemir', 'Serkan Avci', 'Pelin Guler',
] as const;

export const CAT_NAMES = [
  'Boncuk', 'Pamuk', 'Minnos', 'Tekir', 'Duman', 'Zeytin', 'Misket',
  'Sutlac', 'Findik', 'Kedi', 'Lokum', 'Badem',
] as const;

export const DOG_NAMES = [
  'Karamel', 'Rocky', 'Pasa', 'Luna', 'Max', 'Cakil', 'Bal', 'Kont',
  'Zeus', 'Mia', 'Tarcin', 'Cesur',
] as const;

export const CAT_BREEDS = [
  'British Shorthair', 'Tekir', 'Iran Kedisi', 'Scottish Fold',
  'Van Kedisi', 'Ankara Kedisi', 'Siyam',
] as const;

export const DOG_BREEDS = [
  'Golden Retriever', 'Alman Coban', 'Labrador', 'Pomeranian',
  'Kangal', 'Beagle', 'Cocker Spaniel', 'Terrier',
] as const;

export const BLOG_CATEGORIES = [
  { slug: 'beslenme', name: 'Beslenme', icon: 'utensils', sortOrder: 1 },
  { slug: 'bakim', name: 'Bakim', icon: 'bath', sortOrder: 2 },
  { slug: 'saglik', name: 'Saglik', icon: 'heart-pulse', sortOrder: 3 },
  { slug: 'egitim', name: 'Egitim', icon: 'graduation-cap', sortOrder: 4 },
  { slug: 'genel', name: 'Genel', icon: 'newspaper', sortOrder: 5 },
] as const;

export const BLOG_POSTS = [
  {
    slug: 'kedi-beslenme-rehberi',
    title: 'Kedinizin Beslenmesinde Dikkat Etmeniz Gereken 7 Nokta',
    categorySlug: 'beslenme',
    excerpt:
      'Mamanin uzerindeki etiketi okumak, su tuketimini takip etmek ve porsiyon kontrolu: kedinizin omrunu uzatan aliskanliklar.',
    readMinutes: 6,
    body: [
      'Kediler zorunlu etcildir. Bu, mamadaki protein oraninin bitkisel kaynakli olmamasi gerektigi anlamina gelir. Etiketteki ilk uc malzemeye bakin: ilk sirada "tavuk unu" degil "tavuk" yaziyorsa iyi bir isarettir.',
      'Kediler susuzluga dayanikli gorunur ama bu bir avantaj degil, risktir. Dogada avlarindan su alan kediler, kuru mama ile beslendiginde kronik su acigina girebilir ve bu bobrekleri yorar. Su kabini mama kabindan uzaga koyun; akan su cesmeleri tuketimi belirgin sekilde artirir.',
      'Porsiyon kontrolu en cok atlanan konu. Mama kabini surekli dolu tutmak yerine gunluk miktari tartip iki ogune bolmek, kilo problemlerinin buyuk bolumunu bastan onler.',
      'Ani mama degisikligi ishale yol acar. Yeni mamaya gecerken 7 gun boyunca kademeli karistirin: ilk iki gun dortte bir, sonraki iki gun yarim, sonra dortte uc.',
    ],
  },
  {
    slug: 'kopek-asi-takvimi',
    title: 'Yavru Kopeklerde Asi Takvimi Nasil Ilerler?',
    categorySlug: 'saglik',
    excerpt:
      'Ilk asi ne zaman yapilir, kuduz kacinci haftada gelir, tekrarlar neden onemlidir? Adim adim takvim.',
    readMinutes: 5,
    body: [
      'Yavrular anne sutuyle gecici bagisiklik alir. Bu koruma 6-8. haftalarda zayiflamaya baslar; asi takvimi tam bu aralikta devreye girer.',
      'Karma asi genellikle 6-8. haftada yapilir ve 3-4 hafta arayla iki tekrar gelir. Tekrarlar opsiyonel degildir: tek doz, kalici bagisiklik icin yeterli olmaz.',
      'Kuduz asisi ulkemizde yasal zorunluluktur ve genellikle 12. haftadan sonra uygulanir. Seyahat planiniz varsa mikrocip ile birlikte planlanmasi gerekir.',
      'Asi sonrasi 24 saat hafif halsizlik normaldir. Yuzde sislik, kusma veya nefes darligi normal degildir; bu durumda hemen aramaniz gerekir.',
    ],
  },
  {
    slug: 'dis-tasi-neden-tehlikeli',
    title: 'Dis Tasi Neden Sadece Bir Estetik Sorun Degil?',
    categorySlug: 'saglik',
    excerpt:
      'Agizdaki bakteriler kan dolasimina karisip kalp ve bobrekleri etkileyebilir. Erken mudahale neden onemli?',
    readMinutes: 4,
    body: [
      'Dis tasi, diseti ile dis arasinda bakteri barindiran sert bir tabakadir. Koku yalnizca gorunen sonucudur.',
      'Ilerlemis periodontal hastalikta bakteriler kan dolasimina gecebilir. Kalp kapakciklari ve bobrekler bu yukten en cok etkilenen organlardir.',
      'Evde firca aliskanligi kucukken kazandirilirsa en etkili korumadir. Insan dis macunu kullanilmaz: floru zehirlidir.',
      'Yilda bir agiz kontrolu, ileri yasta anestezi gerektiren buyuk islemlerin cogunu onler.',
    ],
  },
  {
    slug: 'kedi-stres-belirtileri',
    title: 'Kedinizde Stresi Nasil Anlarsiniz?',
    categorySlug: 'bakim',
    excerpt:
      'Kum disina tuvalet, asiri yalanma ve saklanma: cogu zaman huysuzluk degil, stres isareti.',
    readMinutes: 5,
    body: [
      'Kediler rahatsizligi gizlemekte ustadir. Davranis degisikligi genellikle ilk ve tek sinyaldir.',
      'Kum kabinin disina tuvalet yapmak cogu zaman inat degil, idrar yolu problemi veya stres gostergesidir. Once tibbi neden elenmelidir.',
      'Asiri yalanmaya bagli tuy dokulmesi, ozellikle karin ve bacak iclerinde, kaygi kaynakli olabilir.',
      'Ev degisikligi, yeni bir hayvan veya mobilya duzeni gibi kucuk gorunen olaylar kediler icin buyuk degisimdir. Dikey alan ve saklanma noktasi saglamak belirgin rahatlama yaratir.',
    ],
  },
  {
    slug: 'kisirlastirma-dogru-zaman',
    title: 'Kisirlastirma Icin Dogru Zaman Ne Zaman?',
    categorySlug: 'saglik',
    excerpt:
      'Erken mi, geç mi? Tura girmeden once yapilmasinin saglik uzerindeki somut etkileri.',
    readMinutes: 6,
    body: [
      'Kisirlastirma yalnizca populasyon kontrolu degil, ciddi bir koruyucu saglik uygulamasidir.',
      'Disilerde ilk turdan once yapilan operasyon, meme tumoru riskini belirgin olcude dusurur. Rahim iltihabi (pyometra) riski de ortadan kalkar.',
      'Erkeklerde prostat problemleri ve bazi davranis kaynakli kacma girisimleri azalir.',
      'Irk ve vucut yapisina gore ideal zamanlama degisir; ozellikle buyuk irk kopeklerde eklem gelisimi dikkate alinmalidir. Karar hekiminizle birlikte verilmelidir.',
    ],
  },
  {
    slug: 'yasli-hayvan-bakimi',
    title: 'Yaslanan Dostunuz Icin Degistirmeniz Gereken 5 Aliskanlik',
    categorySlug: 'bakim',
    excerpt:
      'Yas bir hastalik degil ama hastalik riskini artirir. Alti aylik kontroller ve ev duzenlemeleri.',
    readMinutes: 5,
    body: [
      'Yedi yasindan sonra yillik kontrol yerine alti aylik kontrol onerilir. Erken yakalanan bobrek ve tiroid problemleri cok daha iyi yonetilir.',
      'Kayan zeminler eklem agrisi olan hayvanlar icin risklidir. Hali veya kaymaz paspas belirgin fark yaratir.',
      'Mama kabini yukseltmek, boyun ve omuz uzerindeki yuku azaltir.',
      'Kilo takibi kritiktir: fazla kilo eklemlerdeki yuku katlar, zayiflama ise gizli bir hastaligin ilk isareti olabilir.',
      'Bilissel degisiklikler (gece huzursuzlugu, yon kaybi) yaslanmanin normal parcasi degildir; tedavi edilebilir.',
    ],
  },
  {
    slug: 'acil-durum-rehberi',
    title: 'Hangi Durumda Sabahi Beklememelisiniz?',
    categorySlug: 'saglik',
    excerpt:
      'Zehirlenme supheleri, nefes guclugu ve idrar yapamama: bekleyemeyecek durumlar listesi.',
    readMinutes: 4,
    body: [
      'Nefes guclugu her zaman aciltir. Acik agizla nefes alan bir kedi, hastane yolunda olmalidir.',
      'Erkek kedilerde idrar yapamama saatler icinde hayati tehlike yaratir. Kum kabina girip cikip bosaltamayan kedi beklemez.',
      'Cikolata, uzum, kuru uzum, soğan, sarimsak, ksilitol ve zambak (kedilerde) zehirlidir. Supheli tuketimde miktar bilinmese bile aranmalidir.',
      'Kusma ve ishal tek basina her zaman acil degildir, ancak kanli ise, 24 saati astiysa veya hayvan su icemiyorsa acildir.',
      'Karin sisligi ve huzursuzluk, ozellikle buyuk irk kopeklerde mide burulmasi olabilir; dakikalar onemlidir.',
    ],
  },
  {
    slug: 'yeni-yavru-eve-geldi',
    title: 'Eve Yeni Yavru Geldi: Ilk Haftada Yapilacaklar',
    categorySlug: 'egitim',
    excerpt:
      'Ilk veteriner ziyareti, tuvalet egitimi ve sosyallesme penceresi hakkinda bilmeniz gerekenler.',
    readMinutes: 6,
    body: [
      'Ilk veteriner ziyareti, yavru eve geldikten sonraki ilk birkac gun icinde yapilmalidir. Amac sadece asi degil; parazit taramasi ve genel degerlendirmedir.',
      'Sosyallesme penceresi kopeklerde yaklasik 3-14 hafta arasidir. Bu donemde guvenli sekilde karsilastigi her yeni ses, zemin ve insan, ileride sakin bir yetiskin olmasini saglar.',
      'Tuvalet egitiminde ceza ise yaramaz; dogru yere yaptiginda hemen odullendirmek ise yarar.',
      'Yalniz kalmaya aliskanligi kucuk adimlarla kazandirin. Ilk gunden uzun sureli yalnizlik, ayrilik kaygisinin en sik nedenidir.',
    ],
  },
] as const;

export const TESTIMONIALS = [
  {
    authorName: 'Ayse K.',
    petName: 'Boncuk',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Boncuk'un ameliyatindan iki gun sonra beni arayip nasil oldugunu sordular. Bunu baska hicbir yerde gormedim.",
  },
  {
    authorName: 'Mehmet Y.',
    petName: 'Karamel',
    petSpecies: 'DOG' as const,
    rating: 5,
    text: 'Karamel veterinerden cok korkardi. Burada kapidan iceri kendi giriyor artik. Acele ettirmiyorlar.',
  },
  {
    authorName: 'Fatma D.',
    petName: 'Minnos',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Gece 2'de zehirlenme suphesiyle aradik, telefonu hekim acti. On dakikada klinige aldilar.",
  },
  {
    authorName: 'Zeynep A.',
    petName: 'Pamuk',
    petSpecies: 'CAT' as const,
    rating: 5,
    text: "Pamuk'un cilt problemi aylardir gecmiyordu. Dr. Elif sabirla takip etti, diyet degisikligiyle cozuldu.",
  },
  {
    authorName: 'Ali K.',
    petName: 'Rocky',
    petSpecies: 'DOG' as const,
    rating: 5,
    text: "Rocky'nin bacak kirigi operasyonu basarili gecti. Rontgenleri ekranda tek tek anlattilar, ne yapildigini anladim.",
  },
  {
    authorName: 'Merve A.',
    petName: 'Luna',
    petSpecies: 'DOG' as const,
    rating: 4,
    text: 'Yogun saatlerde biraz beklemek gerekebiliyor ama muayenede hic acele yok. Bu takasi kabul ederim.',
  },
] as const;

export const MEDICAL_TEMPLATES = [
  { type: 'VACCINATION' as const, title: 'Karma Asi', description: 'Yillik karma asi dozu uygulandi. Reaksiyon gozlenmedi.', repeatMonths: 12 },
  { type: 'VACCINATION' as const, title: 'Kuduz Asisi', description: 'Kuduz asisi uygulandi, kayit sistemine islendi.', repeatMonths: 12 },
  { type: 'VACCINATION' as const, title: 'Ic-Dis Parazit', description: 'Parazit uygulamasi yapildi.', repeatMonths: 3 },
  { type: 'EXAMINATION' as const, title: 'Genel Saglik Muayenesi', description: 'Genel durum iyi. Kilo ve beslenme uygun.', repeatMonths: null },
  { type: 'EXAMINATION' as const, title: 'Kontrol Muayenesi', description: 'Onceki tedavinin kontrolu yapildi, iyilesme beklendigi gibi.', repeatMonths: null },
  { type: 'LAB_TEST' as const, title: 'Kan Tahlili', description: 'Hemogram ve biyokimya paneli calisildi. Degerler referans araliginda.', repeatMonths: null },
  { type: 'TREATMENT' as const, title: 'Dis Tasi Temizligi', description: 'Ultrasonik dis tasi temizligi yapildi.', repeatMonths: 12 },
  { type: 'SURGERY' as const, title: 'Kisirlastirma Operasyonu', description: 'Operasyon sorunsuz tamamlandi. Dikisler 10. gun alindi.', repeatMonths: null },
] as const;
