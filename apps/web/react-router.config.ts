import type { Config } from '@react-router/dev/config';

export default {
  // Sunucu tarafi render acik: tanitim sayfalari botlara tam HTML dondurur.
  ssr: true,

  /**
   * Prerender: bu yollar BUILD sirasinda statik HTML'e donusturulur.
   * Icerik Google'a aninda gorunur ve ilk boyama hizlanir.
   *
   * Uygulama sayfalari (randevu, hesap, panel) bilerek disarida:
   * kisiye ozel veri iceriyorlar, statik hale getirilemezler ve
   * zaten SEO'ya ihtiyaclari yok.
   */
  async prerender() {
    return [
      '/',
      '/hizmetler',
      '/ekibimiz',
      '/hakkimizda',
      '/blog',
      '/iletisim',
      '/kvkk',
    ];
  },
} satisfies Config;
