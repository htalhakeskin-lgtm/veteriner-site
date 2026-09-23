import { useRouteLoaderData } from 'react-router';

import { buildMeta } from '~/lib/seo';
import type { SiteSettings } from '~/lib/types';
import { PageHero } from '~/components/sections/page-hero';

export function meta() {
  return buildMeta({
    title: 'KVKK Aydınlatma Metni',
    description:
      '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metni.',
    path: '/kvkk',
  });
}

export default function Kvkk() {
  const root = useRouteLoaderData('root') as { settings: SiteSettings | null } | undefined;
  const s = root?.settings ?? null;
  const clinic = s?.clinic.name ?? 'Kliniğimiz';
  const email = s?.contact.email ?? 'info@klinikadi.com';
  const address = s?.contact.address.full ?? '';

  return (
    <>
      <PageHero
        eyebrow="Hukuki"
        title="KVKK Aydınlatma Metni"
        lede="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel verilerinizi nasıl işlediğimizi açıklıyoruz."
      />

      <section className="pb-18 md:pb-32">
        <div className="wrap prose-vet max-w-[760px]" data-reveal>
          <h2>1. Veri Sorumlusu</h2>
          <p>
            Kişisel verileriniz, veri sorumlusu sıfatıyla <strong>{clinic}</strong>{' '}
            tarafından aşağıda açıklanan kapsamda işlenmektedir.
            {address && <> Adres: {address}.</>} İletişim: {email}
          </p>

          <h2>2. İşlenen Kişisel Veriler</h2>
          <ul>
            <li>
              <strong>Kimlik ve iletişim verileri:</strong> ad, soyad, telefon
              numarası, e-posta adresi
            </li>
            <li>
              <strong>Evcil hayvan verileri:</strong> hayvanın adı, türü, ırkı,
              doğum tarihi, mikroçip numarası, sağlık geçmişi
            </li>
            <li>
              <strong>İşlem verileri:</strong> randevu kayıtları, muayene ve
              tedavi notları, aşı takvimi
            </li>
            <li>
              <strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi,
              oturum kayıtları
            </li>
          </ul>

          <h2>3. İşleme Amaçları</h2>
          <p>Kişisel verileriniz aşağıdaki amaçlarla işlenir:</p>
          <ul>
            <li>Veteriner hekimlik hizmetinin sunulması ve takibi</li>
            <li>Randevu oluşturma, onaylama ve hatırlatma</li>
            <li>Evcil hayvanınızın sağlık geçmişinin kayıt altında tutulması</li>
            <li>Aşı ve kontrol zamanlarının hatırlatılması</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İzin verdiyseniz bilgilendirme bülteni gönderimi</li>
          </ul>

          <h2>4. Hukuki Sebepler</h2>
          <p>
            Verileriniz KVKK m.5/2 uyarınca sözleşmenin kurulması ve ifası,
            hukuki yükümlülüğün yerine getirilmesi ve meşru menfaat hukuki
            sebeplerine dayanılarak işlenir. Pazarlama amaçlı iletişimler için
            <strong> açık rızanız</strong> alınır ve dilediğiniz an geri
            çekebilirsiniz.
          </p>

          <h2>5. Verilerin Aktarılması</h2>
          <p>
            Kişisel verileriniz, yalnızca hizmetin gerektirdiği ölçüde ve yasal
            zorunluluk halinde; sevk edilen uzman kliniklere, laboratuvarlara,
            yetkili kamu kurumlarına ve altyapı hizmeti aldığımız tedarikçilere
            aktarılabilir. Verileriniz pazarlama amacıyla üçüncü taraflara
            <strong> satılmaz</strong>.
          </p>

          <h2>6. Saklama Süresi</h2>
          <p>
            Sağlık kayıtları, veteriner hekimlik mevzuatının öngördüğü süre
            boyunca saklanır. Bu sürenin sonunda veriler silinir, yok edilir veya
            anonim hale getirilir. Hesabınızı silmeniz halinde kimlik ve iletişim
            verileriniz gecikmeksizin anonimleştirilir; ancak yasal saklama
            yükümlülüğü bulunan tıbbi kayıtlar süresi dolana kadar muhafaza edilir.
          </p>

          <h2>7. Haklarınız</h2>
          <p>KVKK m.11 uyarınca şu haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>İşlemeye itiraz etme</li>
            <li>Zararın giderilmesini talep etme</li>
          </ul>
          <p>
            Taleplerinizi <a href={`mailto:${email}`}>{email}</a> adresine
            iletebilirsiniz. Başvurularınız en geç 30 gün içinde sonuçlandırılır.
          </p>

          <h2>8. Çerezler</h2>
          <p>
            Sitemiz, oturumunuzun açık kalması için zorunlu çerezler kullanır.
            Bu çerezler kimlik doğrulama amaçlıdır ve reklam veya takip amacıyla
            kullanılmaz. Tarayıcınızdan çerezleri engellemeniz halinde giriş
            yapılamaz.
          </p>

          <h2>9. Veri Güvenliği</h2>
          <p>
            Şifreleriniz geri döndürülemez şekilde şifrelenerek saklanır. Oturum
            bilgileriniz yalnızca sunucunun erişebildiği güvenli çerezlerde
            tutulur. Verileriniz yetkisiz erişime karşı korunur ve yalnızca
            görevi gereği ihtiyaç duyan personel tarafından görüntülenir.
          </p>

          <hr />
          <p className="text-sm">
            Bu metin bilgilendirme amaçlıdır ve güncellenebilir. Son güncelleme:{' '}
            {new Date().toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </section>
    </>
  );
}
