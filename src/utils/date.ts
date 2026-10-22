
import type {
  Doctor,
  Slot,
  Booking,
} from '../types/doctor';

import type {
  Prescription,
} from '../types/prescription';

/**
 * TapzaCare Mock Data
 *
 * All records in this file are fictional.
 *
 * Used by:
 * - mockApi.ts
 * - DoctorsScreen.tsx
 * - BookingScreen.tsx
 * - BookingsScreen.tsx
 * - PrescriptionsScreen.tsx
 * - PrescriptionDetailScreen.tsx
 * - RemindersScreen.tsx
 */

/* =====================================================
   DATE UTILITIES
===================================================== */

/**
 * Return local YYYY-MM-DD.
 */
export function getDateKey(
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


export function addDays(
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
 * Create a local ISO timestamp for
 * a selected date and time.
 *
 * The returned string includes the
 * local timezone offset.
 */
function createLocalTimestamp(
  dateKey: string,
  hour: number,
  minute: number = 0,
): string {
  const [year, month, day] =
    dateKey.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );

  return date.toISOString();
}

/* =====================================================
   DOCTORS
===================================================== */

export const doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ananya Reddy',
    specialty: 'General Physician',
    photoUrl:
      'https://randomuser.me/api/portraits/women/44.jpg',
    feeInr: 499,
    languages: [
      'English',
      'Hindi',
      'Telugu',
    ],
  },
  {
    id: 'doc-2',
    name: 'Dr. Rahul Sharma',
    specialty: 'Cardiologist',
    photoUrl:
      'https://randomuser.me/api/portraits/men/32.jpg',
    feeInr: 799,
    languages: [
      'English',
      'Hindi',
    ],
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    photoUrl:
      'https://randomuser.me/api/portraits/women/68.jpg',
    feeInr: 599,
    languages: [
      'English',
      'Hindi',
      'Malayalam',
    ],
  },
  {
    id: 'doc-4',
    name: 'Dr. Arjun Mehta',
    specialty: 'Orthopedic',
    photoUrl:
      'https://randomuser.me/api/portraits/men/75.jpg',
    feeInr: 699,
    languages: [
      'English',
      'Hindi',
    ],
  },
  {
    id: 'doc-5',
    name: 'Dr. Sneha Kapoor',
    specialty: 'Pediatrician',
    photoUrl:
      'https://randomuser.me/api/portraits/women/26.jpg',
    feeInr: 549,
    languages: [
      'English',
      'Hindi',
    ],
  },
  {
    id: 'doc-6',
    name: 'Dr. Vikram Singh',
    specialty: 'Neurologist',
    photoUrl:
      'https://randomuser.me/api/portraits/men/46.jpg',
    feeInr: 899,
    languages: [
      'English',
      'Hindi',
    ],
  },
];

/**
 * Find a doctor by ID.
 */
export function findDoctor(
  doctorId: string,
): Doctor | undefined {
  return doctors.find(
    doctor => doctor.id === doctorId,
  );
}

/* =====================================================
   APPOINTMENT SLOTS
===================================================== */

/**
 * Appointment slot templates.
 *
 * Each slot lasts 30 minutes.
 */
const SLOT_TIMES = [
  {hour: 9, minute: 0},
  {hour: 9, minute: 30},
  {hour: 10, minute: 0},
  {hour: 10, minute: 30},
  {hour: 11, minute: 0},
  {hour: 11, minute: 30},
  {hour: 14, minute: 0},
  {hour: 14, minute: 30},
  {hour: 15, minute: 0},
  {hour: 15, minute: 30},
  {hour: 16, minute: 0},
  {hour: 16, minute: 30},
] as const;

/**
 * Generate appointment slots for
 * a doctor and date.
 *
 * Slot IDs are deterministic, so
 * booking conflicts can be simulated.
 *
 * Example:
 * 2026-10-22_doc-1_09-00
 */
export function generateSlots(
  doctorId: string,
  dateKey: string,
): Slot[] {
  const doctor = findDoctor(doctorId);

  if (!doctor) {
    return [];
  }

  const now = Date.now();

  return SLOT_TIMES.map(
    ({hour, minute}, index) => {
      const startsAt =
        createLocalTimestamp(
          dateKey,
          hour,
          minute,
        );

      const endsAt =
        createLocalTimestamp(
          dateKey,
          hour,
          minute + 30,
        );

      const timeKey =
        `${String(hour).padStart(2, '0')}-` +
        `${String(minute).padStart(2, '0')}`;

      const id =
        `${dateKey}_${doctorId}_${timeKey}`;

      /**
       * A few slots are unavailable
       * to demonstrate disabled states.
       *
       * This is deterministic demo data,
       * not actual doctor availability.
       */
      const blockedByDemo =
        index === 2 || index === 7;

      const isFuture =
        new Date(startsAt).getTime() > now;

      return {
        id,
        doctorId,
        startsAt,
        endsAt,
        available:
          isFuture && !blockedByDemo,
      };
    },
  );
}

/**
 * Get slots for a doctor/date.
 */
export function getDoctorSlots(
  doctorId: string,
  dateKey: string,
): Slot[] {
  return generateSlots(
    doctorId,
    dateKey,
  );
}

/* =====================================================
   BOOKINGS
===================================================== */

/**
 * Mutable mock booking collection.
 *
 * This is intentionally in-memory data.
 * It resets when the JS runtime restarts.
 */
export const bookings: Booking[] = [];

/**
 * Add a booking to mock data.
 */
export function addMockBooking(
  booking: Booking,
): void {
  bookings.unshift(booking);
}

/**
 * Get a booking by ID.
 */
export function findBooking(
  bookingId: string,
): Booking | undefined {
  return bookings.find(
    booking => booking.id === bookingId,
  );
}

/**
 * Check whether a slot is already booked.
 */
export function isSlotBooked(
  slotId: string,
): boolean {
  return bookings.some(
    booking =>
      booking.slotId === slotId &&
      booking.status !== 'failed',
  );
}

/* =====================================================
   PRESCRIPTIONS
===================================================== */

/**
 * Example prescriptions.
 *
 * These are fictional records used only
 * to demonstrate the application UI.
 *
 * Medicine names and dose strings below
 * are placeholder data, not instructions
 * for taking medication.
 */
export const prescriptions: Prescription[] = [
  {
    id: 'rx-1001',
    issuedAt:
      addDays(new Date(), -1).toISOString(),
    doctorName: 'Dr. Ananya Reddy',
    clinicName: 'TapzaCare Family Clinic',
    medicines: [
      {
        id: 'med-101',
        name: 'Medicine A',
        dose: 'As prescribed',
        days: 5,
        timing: [
          'morning',
          'night',
        ],
      },
      {
        id: 'med-102',
        name: 'Medicine B',
        dose: 'As prescribed',
        days: 3,
        timing: [
          'afternoon',
        ],
      },
    ],
  },
  {
    id: 'rx-1002',
    issuedAt:
      addDays(new Date(), -2).toISOString(),
    doctorName: 'Dr. Rahul Sharma',
    clinicName: 'TapzaCare Heart Clinic',
    medicines: [
      {
        id: 'med-201',
        name: 'Medicine C',
        dose: 'As prescribed',
        days: 7,
        timing: [
          'morning',
        ],
      },
    ],
  },
  {
    id: 'rx-1003',
    issuedAt:
      addDays(new Date(), -5).toISOString(),
    doctorName: 'Dr. Priya Nair',
    clinicName: 'TapzaCare Skin Clinic',
    medicines: [
      {
        id: 'med-301',
        name: 'Medicine D',
        dose: 'As prescribed',
        days: 10,
        timing: [
          'night',
        ],
      },
    ],
  },
];

/**
 * Find prescription by ID.
 */
export function findPrescription(
  prescriptionId: string,
): Prescription | undefined {
  return prescriptions.find(
    prescription =>
      prescription.id === prescriptionId,
  );
}

/* =====================================================
   MOCK DATA HELPERS
===================================================== */

/**
 * Return a copy of doctors.
 */
export function getMockDoctors():
  Doctor[] {
  return doctors.map(
    doctor => ({
      ...doctor,
      languages: [
        ...doctor.languages,
      ],
    }),
  );
}

/**
 * Return a copy of bookings.
 */
export function getMockBookings():
  Booking[] {
  return bookings.map(
    booking => ({
      ...booking,
    }),
  );
}

/**
 * Return a copy of prescriptions.
 */
export function getMockPrescriptions():
  Prescription[] {
  return prescriptions.map(
    prescription => ({
      ...prescription,
      medicines:
        prescription.medicines.map(
          medicine => ({
            ...medicine,
            timing: [
              ...medicine.timing,
            ],
          }),
        ),
    }),
  );
}

/**
 * Reset all mock bookings.
 *
 * Useful for testing and development.
 */
export function resetMockBookings():
  void {
  bookings.splice(
    0,
    bookings.length,
  );
}
