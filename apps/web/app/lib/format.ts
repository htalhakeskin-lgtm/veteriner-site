/** Turkce bicimleme yardimcilari. Tum sitede ayni gorunumu saglar. */

const TR = 'tr-TR';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(TR, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(TR, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(TR, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString(TR, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(TR).format(value);
}

export function formatPrice(value: string | number | null): string {
  if (value === null) return 'Bilgi için arayın';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'Bilgi için arayın';
  return new Intl.NumberFormat(TR, {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

/** YEREL gun anahtari. toISOString() UTC'ye cevirip gunu kaydirir. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function weekdayName(d: Date): string {
  return d.toLocaleDateString(TR, { weekday: 'long' });
}

export function weekdayShort(d: Date): string {
  return d.toLocaleDateString(TR, { weekday: 'short' });
}

const SPECIES: Record<string, string> = {
  CAT: 'Kedi',
  DOG: 'Köpek',
  BIRD: 'Kuş',
  RODENT: 'Kemirgen',
  REPTILE: 'Sürüngen',
  FISH: 'Balık',
  OTHER: 'Diğer',
};

export const speciesLabel = (s: string | null | undefined) =>
  s ? (SPECIES[s] ?? s) : '—';

export const SPECIES_OPTIONS = Object.entries(SPECIES).map(([value, label]) => ({
  value,
  label,
}));

const GENDER: Record<string, string> = {
  MALE: 'Erkek',
  FEMALE: 'Dişi',
  UNKNOWN: 'Belirtilmemiş',
};

export const genderLabel = (g: string | null | undefined) =>
  g ? (GENDER[g] ?? g) : '—';

export const GENDER_OPTIONS = Object.entries(GENDER).map(([value, label]) => ({
  value,
  label,
}));

const RECORD_TYPE: Record<string, string> = {
  EXAMINATION: 'Muayene',
  VACCINATION: 'Aşı',
  SURGERY: 'Operasyon',
  LAB_TEST: 'Laboratuvar',
  TREATMENT: 'Tedavi',
  OTHER: 'Diğer',
};

export const recordTypeLabel = (t: string) => RECORD_TYPE[t] ?? t;

export const RECORD_TYPE_OPTIONS = Object.entries(RECORD_TYPE).map(
  ([value, label]) => ({ value, label }),
);

/** Hayvanin yasini dogum tarihinden hesaplar. */
export function petAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;

  if (months < 1) return 'Yenidoğan';
  if (months < 12) return `${months} aylık`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} yaşında` : `${years} yaş ${rest} ay`;
}

/** WhatsApp derin baglantisi. Turkiye numaralarini 90 ile normalize eder. */
export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('90')
    ? digits
    : digits.startsWith('0')
      ? `90${digits.slice(1)}`
      : `90${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
