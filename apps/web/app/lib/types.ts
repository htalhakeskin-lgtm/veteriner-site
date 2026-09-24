/** API'nin dondurdugu veri sekilleri. Backend DTO'lariyla elle hizali tutuluyor. */

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type Species = 'CAT' | 'DOG' | 'BIRD' | 'RODENT' | 'REPTILE' | 'FISH' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type RecordType =
  | 'EXAMINATION' | 'VACCINATION' | 'SURGERY' | 'LAB_TEST' | 'TREATMENT' | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
}

export interface SiteSettings {
  clinic: {
    name: string;
    slogan: string;
    description: string;
    foundedYear: number;
    totalPatients: number;
    experienceYears: number;
    satisfactionRate: number;
    logoUrl: string | null;
  };
  contact: {
    phone: string;
    phoneRaw: string;
    whatsapp: string;
    whatsappMessage: string;
    email: string;
    address: {
      full: string;
      district: string;
      city: string;
      lat: number;
      lng: number;
    };
  };
  workingHours: {
    weekdays: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string | null; close: string | null };
    emergency: boolean;
    emergencyPhone: string;
  };
  theme: { activePreset: string; customColors: unknown; scrollSpeed?: number };
  features: Record<string, boolean>;
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImageUrl: string | null;
    googleMapsEmbedUrl: string | null;
  };
  socialLinks: Record<string, string | null>;
  appointment: { daysInAdvance: number; cancelBeforeHours: number };
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  longDesc: string | null;
  icon: string | null;
  category: string;
  price: string | null;
  durationMinutes: number;
  isFeatured: boolean;
}

export interface StaffMember {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  speciality: string | null;
  experienceYears: number | null;
  bio: string | null;
  education: string | null;
  photoUrl: string | null;
  services?: Array<{ id: string; slug: string; title: string }>;
  schedules?: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

export interface Testimonial {
  id: string;
  source: 'MANUAL' | 'GOOGLE';
  authorName: string;
  authorPhotoUrl: string | null;
  petName: string | null;
  petSpecies: Species | null;
  rating: number;
  text: string;
  sourceUrl: string | null;
  displayDate: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml?: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  readMinutes: number;
  viewCount: number;
  category: { slug: string; name: string; icon: string | null } | null;
  author: { fullName: string } | null;
  related?: BlogPost[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface Slot {
  time: string;
  start: string;
  end: string;
  staffId: string;
  staffName: string;
}

export interface AvailabilityDay {
  date: string;
  isOpen: boolean;
  reason?: 'HOLIDAY' | 'WEEKLY_CLOSED' | 'NO_STAFF_SCHEDULED' | 'DAILY_LIMIT_REACHED';
  slots: Slot[];
}

export interface Availability {
  serviceId: string;
  serviceTitle: string;
  durationMinutes: number;
  days: AvailabilityDay[];
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  gender: Gender;
  weightKg: string | null;
  color: string | null;
  isNeutered: boolean;
  microchipNo: string | null;
  photoUrl: string | null;
  notes: string | null;
  _count?: { appointments: number; medicalRecords: number };
}

export interface Appointment {
  id: string;
  code: string;
  userId: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes: string | null;
  cancelReason: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  guestPetName: string | null;
  guestPetSpecies: Species | null;
  service: { id: string; slug: string; title: string; durationMinutes: number };
  staff: { id: string; slug: string; fullName: string; title: string } | null;
  pet: { id: string; name: string; species: Species; breed: string | null } | null;
  user?: { id: string; fullName: string; phone: string | null; email: string };
}

export interface MedicalRecord {
  id: string;
  type: RecordType;
  title: string;
  description: string | null;
  performedAt: string;
  nextDueAt: string | null;
  isOverdue?: boolean;
  staff: { id: string; fullName: string; title: string } | null;
  appointment: { id: string; code: string } | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardOverview {
  appointments: { today: number; thisWeek: number; pendingApproval: number };
  customers: { total: number; newThisMonth: number };
  pets: { total: number };
  inbox: { unreadMessages: number; pendingTestimonials: number };
  content: { publishedPosts: number };
}
