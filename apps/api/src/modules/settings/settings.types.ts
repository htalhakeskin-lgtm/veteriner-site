/** SiteSetting JSON kolonlarının uygulama tarafındaki sekli. */

export interface AppointmentRules {
  slotDurationMinutes: number;
  leadTimeHours: number;
  daysInAdvance: number;
  cancelBeforeHours: number;
  autoConfirm: boolean;
  maxDailySlots: number;
  blockedWeekdays: number[];
}

export const DEFAULT_APPOINTMENT_RULES: AppointmentRules = {
  slotDurationMinutes: 30,
  leadTimeHours: 2,
  daysInAdvance: 30,
  cancelBeforeHours: 24,
  autoConfirm: false,
  maxDailySlots: 20,
  blockedWeekdays: [0],
};
