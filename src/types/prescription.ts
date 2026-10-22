
/**
 * TapzaCare
 * Prescription and Medicine Types
 *
 * React Native CLI 0.88.0
 * TypeScript
 *
 * Used by:
 * - mockApi.ts
 * - PrescriptionsScreen.tsx
 * - PrescriptionDetailScreen.tsx
 * - RemindersScreen.tsx
 * - storage.ts
 */

/* =====================================================
   MEDICINE TIMING TYPES
===================================================== */

export type DoseTiming =
  | 'morning'
  | 'afternoon'
  | 'night';

export const DOSE_TIMINGS: readonly DoseTiming[] = [
  'morning',
  'afternoon',
  'night',
];

export const DEFAULT_DOSE_TIMES: Record<
  DoseTiming,
  string
> = {
  morning: '08:00',
  afternoon: '14:00',
  night: '21:00',
};

export const DOSE_TIMING_LABELS: Record<
  DoseTiming,
  string
> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

/* =====================================================
   MEDICINE TYPES
===================================================== */

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  days: number;
  timing: DoseTiming[];
}

export interface MedicineDetails extends Medicine {
  instructions?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

/* =====================================================
   PRESCRIPTION TYPES
===================================================== */

export interface Prescription {
  id: string;
  issuedAt: string;
  doctorName: string;
  clinicName: string;
  medicines: Medicine[];
}

export interface PrescriptionDetails
  extends Prescription {
  patientName?: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
}

/* =====================================================
   MEDICINE REMINDER TYPES
===================================================== */

export interface MedicineReminder {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  dose: string;
  timing: DoseTiming;
  scheduledTime: string;
  date: string;
  taken: boolean;
}

export type MedicineDoseStatus =
  | 'pending'
  | 'taken'
  | 'missed';

export type DailyMedicineStatus =
  Record<string, boolean>;

export interface MedicineProgress {
  total: number;
  taken: number;
  pending: number;
  percentage: number;
}

/* =====================================================
   VALIDATION HELPERS
===================================================== */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isDoseTiming(
  value: unknown,
): value is DoseTiming {
  return (
    value === 'morning' ||
    value === 'afternoon' ||
    value === 'night'
  );
}

/**
 * Validate medicine data from API.
 *
 * Important:
 * Number.isInteger() alone does not
 * narrow unknown to number in TypeScript.
 *
 * Explicit typeof check fixes TS18046.
 */
export function isMedicine(
  value: unknown,
): value is Medicine {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== 'string' ||
    value.id.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof value.name !== 'string' ||
    value.name.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof value.dose !== 'string' ||
    value.dose.trim().length === 0
  ) {
    return false;
  }

  // TypeScript-safe duration validation.
  if (
    typeof value.days !== 'number' ||
    !Number.isInteger(value.days) ||
    value.days <= 0
  ) {
    return false;
  }

  if (
    !Array.isArray(value.timing) ||
    value.timing.length === 0 ||
    !value.timing.every(isDoseTiming)
  ) {
    return false;
  }

  return true;
}

export function isPrescription(
  value: unknown,
): value is Prescription {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.issuedAt === 'string' &&
    Number.isFinite(
      Date.parse(value.issuedAt),
    ) &&
    typeof value.doctorName === 'string' &&
    typeof value.clinicName === 'string' &&
    Array.isArray(value.medicines) &&
    value.medicines.every(isMedicine)
  );
}

export function isPrescriptionList(
  value: unknown,
): value is Prescription[] {
  return (
    Array.isArray(value) &&
    value.every(isPrescription)
  );
}

/* =====================================================
   DATE HELPERS
===================================================== */

/**
 * Return local date in YYYY-MM-DD format.
 *
 * Avoid using toISOString() here because
 * it can shift dates due to UTC conversion.
 */
export function getPrescriptionDateKey(
  date: Date = new Date(),
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD as a local date.
 */
export function parseLocalDate(
  dateKey: string,
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dateKey,
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Format prescription issue date.
 *
 * Example:
 * 21 Oct 2026
 */
export function formatPrescriptionDate(
  issuedAt: string,
): string {
  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(issuedAt)
      ? parseLocalDate(issuedAt)
      : new Date(issuedAt);

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
}

/**
 * Add calendar days to a local date.
 */
export function addCalendarDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

/**
 * Calculate final day of treatment.
 *
 * A 3-day treatment starting on
 * 21 October ends on 23 October.
 */
export function getMedicineEndDate(
  startDate: Date,
  days: number,
): Date {
  return addCalendarDays(
    startDate,
    Math.max(0, days - 1),
  );
}

/**
 * Check whether medicine treatment
 * is active on a selected date.
 */
export function isMedicineActiveOnDate(
  medicine: Medicine,
  startDate: Date,
  targetDate: Date,
): boolean {
  if (
    !Number.isInteger(medicine.days) ||
    medicine.days <= 0
  ) {
    return false;
  }

  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  const target = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );

  const end = getMedicineEndDate(
    start,
    medicine.days,
  );

  return (
    target.getTime() >= start.getTime() &&
    target.getTime() <= end.getTime()
  );
}

/* =====================================================
   MEDICINE HELPERS
===================================================== */

export function formatMedicineDuration(
  days: number,
): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function formatDoseTimings(
  timing: DoseTiming[],
): string {
  return timing
    .map(
      item => DOSE_TIMING_LABELS[item],
    )
    .join(', ');
}

export function getMedicineById(
  prescription: Prescription,
  medicineId: string,
): Medicine | undefined {
  return prescription.medicines.find(
    medicine => medicine.id === medicineId,
  );
}

export function getDailyDoseCount(
  medicine: Medicine,
): number {
  return new Set(
    medicine.timing,
  ).size;
}

export function getTotalMedicineDoses(
  medicine: Medicine,
): number {
  return (
    getDailyDoseCount(medicine) *
    medicine.days
  );
}

/* =====================================================
   REMINDER HELPERS
===================================================== */

/**
 * Generate a unique reminder ID.
 *
 * Includes prescription ID, medicine ID,
 * timing and date.
 */
export function createReminderId(
  prescriptionId: string,
  medicineId: string,
  timing: DoseTiming,
  date: string,
): string {
  return [
    prescriptionId,
    medicineId,
    timing,
    date,
  ].join('/');
}

/**
 * Generate in-app reminders for
 * a selected calendar date.
 *
 * This does not schedule Android/iOS
 * local push notifications.
 */
export function createMedicineReminders(
  prescriptions: Prescription[],
  date: Date = new Date(),
  customTimes: Partial<
    Record<DoseTiming, string>
  > = {},
): MedicineReminder[] {
  const dateKey =
    getPrescriptionDateKey(date);

  const reminders: MedicineReminder[] = [];

  prescriptions.forEach(prescription => {
    const startDate =
      /^\d{4}-\d{2}-\d{2}$/.test(
        prescription.issuedAt,
      )
        ? parseLocalDate(
            prescription.issuedAt,
          )
        : new Date(
            prescription.issuedAt,
          );

    if (
      !startDate ||
      Number.isNaN(
        startDate.getTime(),
      )
    ) {
      return;
    }

    prescription.medicines.forEach(
      medicine => {
        if (
          !isMedicineActiveOnDate(
            medicine,
            startDate,
            date,
          )
        ) {
          return;
        }

        const uniqueTimings =
          Array.from(
            new Set(medicine.timing),
          );

        uniqueTimings.forEach(timing => {
          const scheduledTime =
            customTimes[timing] ??
            DEFAULT_DOSE_TIMES[timing];

          reminders.push({
            id: createReminderId(
              prescription.id,
              medicine.id,
              timing,
              dateKey,
            ),

            prescriptionId:
              prescription.id,

            medicineId:
              medicine.id,

            medicineName:
              medicine.name,

            dose:
              medicine.dose,

            timing,

            scheduledTime,

            date:
              dateKey,

            taken: false,
          });
        });
      },
    );
  });

  return reminders.sort(
    (a, b) =>
      a.scheduledTime.localeCompare(
        b.scheduledTime,
      ),
  );
}

/**
 * Apply persisted dose statuses
 * to generated reminders.
 */
export function applyDoseStatuses(
  reminders: MedicineReminder[],
  statuses: DailyMedicineStatus,
): MedicineReminder[] {
  return reminders.map(
    reminder => ({
      ...reminder,

      taken:
        statuses[reminder.id] === true,
    }),
  );
}

/**
 * Calculate daily reminder progress.
 */
export function calculateMedicineProgress(
  reminders: MedicineReminder[],
): MedicineProgress {
  const total = reminders.length;

  const taken = reminders.filter(
    reminder => reminder.taken,
  ).length;

  const pending = total - taken;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          (taken / total) * 100,
        );

  return {
    total,
    taken,
    pending,
    percentage,
  };
}

export function getRemindersByTiming(
  reminders: MedicineReminder[],
  timing: DoseTiming,
): MedicineReminder[] {
  return reminders.filter(
    reminder =>
      reminder.timing === timing,
  );
}

export function getPendingReminders(
  reminders: MedicineReminder[],
): MedicineReminder[] {
  return reminders.filter(
    reminder => !reminder.taken,
  );
}

export function getTakenReminders(
  reminders: MedicineReminder[],
): MedicineReminder[] {
  return reminders.filter(
    reminder => reminder.taken,
  );
}

/* =====================================================
   PRESCRIPTION HELPERS
===================================================== */

export function getPrescriptionById(
  prescriptions: Prescription[],
  prescriptionId: string,
): Prescription | undefined {
  return prescriptions.find(
    prescription =>
      prescription.id === prescriptionId,
  );
}

export function sortPrescriptionsNewestFirst(
  prescriptions: Prescription[],
): Prescription[] {
  return [...prescriptions].sort(
    (a, b) =>
      Date.parse(b.issuedAt) -
      Date.parse(a.issuedAt),
  );
}

/**
 * Search by doctor name, clinic,
 * prescription ID or medicine name.
 */
export function filterPrescriptions(
  prescriptions: Prescription[],
  query: string,
): Prescription[] {
  const search =
    query.trim().toLowerCase();

  if (!search) {
    return prescriptions;
  }

  return prescriptions.filter(
    prescription => {
      const medicineNames =
        prescription.medicines.map(
          medicine => medicine.name,
        );

      const searchableText = [
        prescription.id,
        prescription.doctorName,
        prescription.clinicName,
        ...medicineNames,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        search,
      );
    },
  );
}

export function getPrescriptionMedicineCount(
  prescription: Prescription,
): number {
  return prescription.medicines.length;
}

export function hasMedicines(
  prescription: Prescription,
): boolean {
  return prescription.medicines.length > 0;
}
