
/**
 * TapzaCare
 * Doctor, Appointment Slot and Booking Types
 *
 * React Native CLI 0.88.0
 * TypeScript
 *
 * Used by:
 * - mockApi.ts
 * - useBooking.ts
 * - bookingStore.ts
 * - DoctorCard.tsx
 * - DoctorsScreen.tsx
 * - BookingScreen.tsx
 * - BookingsScreen.tsx
 * - DoctorCarousel.tsx
 * - SlotBottomSheet.tsx
 * - BookingSuccess.tsx
 */

/* =====================================================
   DOCTOR TYPES
===================================================== */

/**
 * Doctor information returned by GET /doctors.
 */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photoUrl: string;
  feeInr: number;
  languages: string[];
}

/**
 * Optional doctor details for future
 * API extensions.
 *
 * The existing Doctor interface remains
 * unchanged for compatibility.
 */
export interface DoctorDetails extends Doctor {
  qualification?: string;
  experienceYears?: number;
  hospitalName?: string;
  rating?: number;
  reviewCount?: number;
  about?: string;
  availableOnline?: boolean;
}

/* =====================================================
   APPOINTMENT SLOT TYPES
===================================================== */

/**
 * Slot returned by:
 *
 * GET /slots?doctorId=...&date=...
 *
 * startsAt and endsAt should contain
 * ISO 8601 timestamps.
 */
export interface Slot {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

/**
 * Appointment date format:
 *
 * YYYY-MM-DD
 */
export type AppointmentDate = string;

/* =====================================================
   BOOKING TYPES
===================================================== */

/**
 * Supported booking statuses.
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'failed';

/**
 * Booking returned by POST /bookings
 * and GET /bookings.
 */
export interface Booking {
  id: string;
  doctorId: string;
  slotId: string;
  status: BookingStatus;
  createdAt: string;
}

/**
 * Optional booking details for future
 * API extensions.
 */
export interface BookingDetails extends Booking {
  doctor?: Doctor;
  slot?: Slot;
  appointmentDate?: string;
  consultationFeeInr?: number;
  failureReason?: string;
}

/* =====================================================
   API REQUEST TYPES
===================================================== */

/**
 * Request parameters for GET /slots.
 */
export interface GetSlotsParams {
  doctorId: string;
  date: AppointmentDate;
}

/**
 * Request body for POST /bookings.
 */
export interface CreateBookingRequest {
  doctorId: string;
  slotId: string;
}

/**
 * Standard list response type.
 *
 * Use only if your API wraps arrays
 * in a data property.
 */
export interface ApiListResponse<T> {
  data: T[];
  total?: number;
}

/* =====================================================
   BOOKING ERROR TYPES
===================================================== */

/**
 * Supported booking error categories.
 */
export type BookingErrorType =
  | 'slot_conflict'
  | 'network'
  | 'validation'
  | 'unknown';

/**
 * Error information for booking UI.
 */
export interface BookingError {
  type: BookingErrorType;
  message: string;
  status?: number;
}

/* =====================================================
   RUNTIME VALIDATION
===================================================== */

/**
 * Check whether value is a plain object.
 */
function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Validate doctor response.
 */
export function isDoctor(
  value: unknown,
): value is Doctor {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    typeof value.specialty === 'string' &&
    typeof value.photoUrl === 'string' &&
    typeof value.feeInr === 'number' &&
    Number.isFinite(value.feeInr) &&
    value.feeInr >= 0 &&
    Array.isArray(value.languages) &&
    value.languages.every(
      language =>
        typeof language === 'string',
    )
  );
}

/**
 * Validate doctor list.
 */
export function isDoctorList(
  value: unknown,
): value is Doctor[] {
  return (
    Array.isArray(value) &&
    value.every(isDoctor)
  );
}

/**
 * Validate appointment slot.
 */
export function isSlot(
  value: unknown,
): value is Slot {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.doctorId !== 'string' ||
    typeof value.startsAt !== 'string' ||
    typeof value.endsAt !== 'string' ||
    typeof value.available !== 'boolean'
  ) {
    return false;
  }

  const startTime =
    Date.parse(value.startsAt);

  const endTime =
    Date.parse(value.endsAt);

  return (
    value.id.trim().length > 0 &&
    value.doctorId.trim().length > 0 &&
    Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    endTime > startTime
  );
}

/**
 * Validate slot list.
 */
export function isSlotList(
  value: unknown,
): value is Slot[] {
  return (
    Array.isArray(value) &&
    value.every(isSlot)
  );
}

/**
 * Validate booking status.
 */
export function isBookingStatus(
  value: unknown,
): value is BookingStatus {
  return (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'failed'
  );
}

/**
 * Validate booking response.
 */
export function isBooking(
  value: unknown,
): value is Booking {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.doctorId === 'string' &&
    value.doctorId.trim().length > 0 &&
    typeof value.slotId === 'string' &&
    value.slotId.trim().length > 0 &&
    isBookingStatus(value.status) &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(
      Date.parse(value.createdAt),
    )
  );
}

/**
 * Validate booking list.
 */
export function isBookingList(
  value: unknown,
): value is Booking[] {
  return (
    Array.isArray(value) &&
    value.every(isBooking)
  );
}

/* =====================================================
   DOCTOR HELPERS
===================================================== */

/**
 * Format doctor consultation fee.
 *
 * Example:
 * 499 -> ₹499
 */
export function formatDoctorFee(
  feeInr: number,
): string {
  if (!Number.isFinite(feeInr)) {
    return '₹0';
  }

  return `₹${Math.max(
    0,
    feeInr,
  ).toLocaleString('en-IN')}`;
}

/**
 * Search doctors by name, specialty,
 * or spoken language.
 */
export function filterDoctors(
  doctors: Doctor[],
  query: string,
): Doctor[] {
  const search =
    query.trim().toLowerCase();

  if (!search) {
    return doctors;
  }

  return doctors.filter(doctor => {
    const searchableText = [
      doctor.name,
      doctor.specialty,
      ...doctor.languages,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(search);
  });
}

/**
 * Filter doctors by specialty.
 */
export function filterDoctorsBySpecialty(
  doctors: Doctor[],
  specialty: string,
): Doctor[] {
  const normalized =
    specialty.trim().toLowerCase();

  if (
    !normalized ||
    normalized === 'all'
  ) {
    return doctors;
  }

  return doctors.filter(
    doctor =>
      doctor.specialty.toLowerCase() ===
      normalized,
  );
}

/**
 * Get unique doctor specialties.
 */
export function getDoctorSpecialties(
  doctors: Doctor[],
): string[] {
  const specialties = doctors
    .map(doctor => doctor.specialty.trim())
    .filter(Boolean);

  return Array.from(
    new Set(specialties),
  ).sort((a, b) =>
    a.localeCompare(b),
  );
}

/* =====================================================
   SLOT HELPERS
===================================================== */

/**
 * Return available appointment slots.
 */
export function getAvailableSlots(
  slots: Slot[],
): Slot[] {
  return slots.filter(
    slot => slot.available,
  );
}

/**
 * Sort slots by appointment start time.
 */
export function sortSlotsByTime(
  slots: Slot[],
): Slot[] {
  return [...slots].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() -
      new Date(b.startsAt).getTime(),
  );
}

/**
 * Format ISO timestamp to local time.
 *
 * Example:
 * 10:30 AM
 */
export function formatSlotTime(
  isoDate: string,
): string {
  const date = new Date(isoDate);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '--:--';
  }

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    },
  );
}

/**
 * Format appointment time range.
 *
 * Example:
 * 10:30 AM - 11:00 AM
 */
export function formatSlotRange(
  slot: Slot,
): string {
  return (
    `${formatSlotTime(slot.startsAt)} - ` +
    `${formatSlotTime(slot.endsAt)}`
  );
}

/**
 * Format appointment date.
 *
 * Example:
 * Wed, 21 Oct 2026
 */
export function formatAppointmentDate(
  isoDate: string,
): string {
  const date = new Date(isoDate);

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Invalid date';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
}

/**
 * Get local date as YYYY-MM-DD.
 *
 * Avoid toISOString().slice(0, 10)
 * because it uses UTC.
 */
export function getLocalAppointmentDate(
  date: Date = new Date(),
): AppointmentDate {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Check whether slot belongs to doctor.
 */
export function isSlotForDoctor(
  slot: Slot,
  doctorId: string,
): boolean {
  return slot.doctorId === doctorId;
}

/**
 * Check whether a slot can be selected.
 */
export function canSelectSlot(
  slot: Slot,
  doctorId: string,
  now: Date = new Date(),
): boolean {
  const startTime =
    new Date(slot.startsAt).getTime();

  return (
    slot.available &&
    slot.doctorId === doctorId &&
    Number.isFinite(startTime) &&
    startTime > now.getTime()
  );
}

/* =====================================================
   BOOKING HELPERS
===================================================== */

/**
 * Get booking status display text.
 */
export function getBookingStatusLabel(
  status: BookingStatus,
): string {
  switch (status) {
    case 'pending':
      return 'Pending';

    case 'confirmed':
      return 'Confirmed';

    case 'failed':
      return 'Failed';
  }
}

/**
 * Get booking status color.
 */
export function getBookingStatusColor(
  status: BookingStatus,
): string {
  switch (status) {
    case 'pending':
      return '#D97706';

    case 'confirmed':
      return '#16A34A';

    case 'failed':
      return '#DC2626';
  }
}

/**
 * Get confirmed bookings.
 */
export function getConfirmedBookings(
  bookings: Booking[],
): Booking[] {
  return bookings.filter(
    booking =>
      booking.status === 'confirmed',
  );
}

/**
 * Get pending bookings.
 */
export function getPendingBookings(
  bookings: Booking[],
): Booking[] {
  return bookings.filter(
    booking =>
      booking.status === 'pending',
  );
}

/**
 * Get failed bookings.
 */
export function getFailedBookings(
  bookings: Booking[],
): Booking[] {
  return bookings.filter(
    booking =>
      booking.status === 'failed',
  );
}

/**
 * Sort bookings by creation date.
 *
 * Newest bookings first.
 */
export function sortBookingsNewestFirst(
  bookings: Booking[],
): Booking[] {
  return [...bookings].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}

/**
 * Get booking by ID.
 */
export function getBookingById(
  bookings: Booking[],
  bookingId: string,
): Booking | undefined {
  return bookings.find(
    booking =>
      booking.id === bookingId,
  );
}

/**
 * Get bookings for a doctor.
 */
export function getBookingsByDoctor(
  bookings: Booking[],
  doctorId: string,
): Booking[] {
  return bookings.filter(
    booking =>
      booking.doctorId === doctorId,
  );
}

/**
 * =====================================================
 * BOOKING ERROR HELPERS
 * =====================================================
 */

/**
 * Extract HTTP status from unknown error.
 */
export function getBookingErrorStatus(
  error: unknown,
): number | null {
  if (!isRecord(error)) {
    return null;
  }

  const status = error.status;

  return typeof status === 'number'
    ? status
    : null;
}

/**
 * Convert API error into a UI-friendly error.
 */
export function normalizeBookingError(
  error: unknown,
): BookingError {
  const status =
    getBookingErrorStatus(error);

  if (status === 409) {
    return {
      type: 'slot_conflict',
      status,
      message:
        'This appointment slot is no longer available. Please select another slot.',
    };
  }

  if (
    status === 400 ||
    status === 422
  ) {
    return {
      type: 'validation',
      status,
      message:
        'Please check your booking details and try again.',
    };
  }

  if (
    status === 0 ||
    status === 503
  ) {
    return {
      type: 'network',
      status,
      message:
        'Unable to connect. Please check your connection and try again.',
    };
  }

  return {
    type: 'unknown',
    ...(status !== null ? {status} : {}),
    message:
      error instanceof Error &&
      error.message.trim()
        ? error.message
        : 'Something went wrong while booking. Please try again.',
  };
}
