
import {create} from 'zustand';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {mockApi} from '../api/mockApi';

import type {
  Booking,
  Doctor,
  Slot,
} from '../types/doctor';

/**
 * TapzaCare Booking Store
 *
 * Zustand + TypeScript
 *
 * Handles:
 * - Doctor selection
 * - Appointment date selection
 * - Slot selection
 * - Optimistic booking
 * - Booking confirmation
 * - Slot conflicts (HTTP 409)
 * - Booking history
 * - Local cache
 */

const BOOKINGS_CACHE_KEY =
  '@tapza/bookings-cache';

const DEFAULT_ERROR =
  'Something went wrong. Please try again.';

/**
 * Local YYYY-MM-DD date.
 */
function getTodayDate(): string {
  const date = new Date();

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
 * Generate temporary booking ID.
 */
function createTemporaryBookingId(): string {
  return (
    `temp-${Date.now()}-` +
    `${Math.random().toString(36).slice(2, 9)}`
  );
}

/**
 * Safely extract error status.
 */
function getErrorStatus(
  error: unknown,
): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  ) {
    const status = (
      error as {status?: unknown}
    ).status;

    return typeof status === 'number'
      ? status
      : null;
  }

  return null;
}

/**
 * Convert unknown error to message.
 */
function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return DEFAULT_ERROR;
}

/**
 * Validate a booking from storage/API.
 */
function isBooking(
  value: unknown,
): value is Booking {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<
    string,
    unknown
  >;

  return (
    typeof item.id === 'string' &&
    typeof item.doctorId === 'string' &&
    typeof item.slotId === 'string' &&
    typeof item.createdAt === 'string' &&
    (
      item.status === 'pending' ||
      item.status === 'confirmed' ||
      item.status === 'failed'
    )
  );
}

/**
 * Save bookings locally.
 *
 * Cache errors do not invalidate
 * successfully created API bookings.
 */
async function saveBookingsCache(
  bookings: Booking[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      BOOKINGS_CACHE_KEY,
      JSON.stringify(bookings),
    );
  } catch (error) {
    console.warn(
      '[BookingStore] Cache save failed:',
      error,
    );
  }
}

/**
 * Read cached bookings.
 */
async function readBookingsCache():
  Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem(
      BOOKINGS_CACHE_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isBooking);
  } catch (error) {
    console.warn(
      '[BookingStore] Cache read failed:',
      error,
    );

    return [];
  }
}

/**
 * Remove duplicate bookings.
 *
 * Latest booking takes priority.
 */
function mergeBookings(
  ...collections: Booking[][]
): Booking[] {
  const map = new Map<string, Booking>();

  collections.forEach(collection => {
    collection.forEach(booking => {
      map.set(booking.id, booking);
    });
  });

  return Array.from(
    map.values(),
  ).sort((a, b) => {
    const dateA = new Date(
      a.createdAt,
    ).getTime();

    const dateB = new Date(
      b.createdAt,
    ).getTime();

    return dateB - dateA;
  });
}

/**
 * Store state.
 */
export interface BookingStoreState {
  /**
   * Current booking selection.
   */
  selectedDoctor: Doctor | null;

  selectedDate: string;

  selectedSlot: Slot | null;

  /**
   * Slots for selected doctor/date.
   */
  slots: Slot[];

  /**
   * Booking history.
   */
  bookings: Booking[];

  /**
   * Current booking result.
   */
  currentBooking: Booking | null;

  /**
   * Loading states.
   */
  slotsLoading: boolean;

  bookingLoading: boolean;

  bookingsLoading: boolean;

  refreshing: boolean;

  /**
   * Error states.
   */
  slotsError: string | null;

  bookingError: string | null;

  bookingsError: string | null;

  /**
   * Conflict state.
   */
  slotConflict: boolean;

  /**
   * Cache state.
   */
  hydrated: boolean;

  /**
   * Selection actions.
   */
  setSelectedDoctor: (
    doctor: Doctor | null,
  ) => void;

  setSelectedDate: (
    date: string,
  ) => void;

  setSelectedSlot: (
    slot: Slot | null,
  ) => void;

  /**
   * API actions.
   */
  fetchSlots: (
    doctorId: string,
    date: string,
  ) => Promise<void>;

  confirmBooking: (
    doctorId?: string,
  ) => Promise<Booking | null>;

  fetchBookings: () => Promise<void>;

  refreshBookings: () => Promise<void>;

  /**
   * Cache actions.
   */
  hydrateBookings: () => Promise<void>;

  /**
   * Reset actions.
   */
  resetSelection: () => void;

  resetBookingState: () => void;

  clearBookingError: () => void;

  clearBookingsError: () => void;
}

/**
 * Prevent overlapping booking submissions.
 *
 * Kept outside React state so multiple
 * rapid taps cannot start duplicate requests.
 */
let bookingRequestInFlight = false;

/**
 * Request IDs prevent stale slot responses.
 */
let slotsRequestId = 0;

let bookingsRequestId = 0;

/**
 * Zustand store.
 */
export const useBookingStore =
  create<BookingStoreState>(
    (set, get) => ({
      /**
       * Initial state.
       */
      selectedDoctor: null,

      selectedDate: getTodayDate(),

      selectedSlot: null,

      slots: [],

      bookings: [],

      currentBooking: null,

      slotsLoading: false,

      bookingLoading: false,

      bookingsLoading: false,

      refreshing: false,

      slotsError: null,

      bookingError: null,

      bookingsError: null,

      slotConflict: false,

      hydrated: false,

      /**
       * Select doctor.
       */
      setSelectedDoctor: doctor => {
        slotsRequestId += 1;

        set({
          selectedDoctor: doctor,
          selectedSlot: null,
          slots: [],
          slotsLoading: false,
          slotsError: null,
          bookingError: null,
          slotConflict: false,
          currentBooking: null,
        });
      },

      /**
       * Select date.
       */
      setSelectedDate: date => {
        slotsRequestId += 1;

        set({
          selectedDate: date,
          selectedSlot: null,
          slots: [],
          slotsLoading: false,
          slotsError: null,
          bookingError: null,
          slotConflict: false,
          currentBooking: null,
        });
      },

      /**
       * Select appointment slot.
       */
      setSelectedSlot: slot => {
        if (
          slot &&
          !slot.available
        ) {
          set({
            selectedSlot: null,
            bookingError:
              'This slot is unavailable.',
          });

          return;
        }

        set({
          selectedSlot: slot,
          bookingError: null,
          slotConflict: false,
        });
      },

      /**
       * Fetch available slots.
       */
      fetchSlots: async (
        doctorId,
        date,
      ) => {
        const requestId =
          ++slotsRequestId;

        set({
          slotsLoading: true,
          slotsError: null,
          selectedSlot: null,
          slots: [],
          selectedDate: date,
        });

        try {
          const response =
            await mockApi.getSlots(
              doctorId,
              date,
            );

          if (
            requestId !== slotsRequestId
          ) {
            return;
          }

          set({
            slots: response,
            slotsLoading: false,
          });
        } catch (error) {
          if (
            requestId !== slotsRequestId
          ) {
            return;
          }

          set({
            slots: [],
            slotsLoading: false,
            slotsError:
              getErrorMessage(error),
          });
        }
      },

      /**
       * Confirm appointment.
       *
       * Optimistic flow:
       * 1. Add temporary pending booking.
       * 2. Call booking API.
       * 3. Replace temporary booking on success.
       * 4. Remove temporary booking on failure.
       * 5. Handle HTTP 409 slot conflict.
       */
      confirmBooking: async (
        doctorId,
      ) => {
        if (bookingRequestInFlight) {
          return null;
        }

        const state = get();

        const selectedDoctorId =
          doctorId ??
          state.selectedDoctor?.id;

        const slot =
          state.selectedSlot;

        if (!selectedDoctorId) {
          set({
            bookingError:
              'Please select a doctor.',
          });

          return null;
        }

        if (!slot) {
          set({
            bookingError:
              'Please select an appointment slot.',
          });

          return null;
        }

        if (
          !slot.available ||
          slot.doctorId !== selectedDoctorId
        ) {
          set({
            bookingError:
              'The selected slot is not valid for this doctor.',
          });

          return null;
        }

        bookingRequestInFlight = true;

        const temporaryId =
          createTemporaryBookingId();

        const optimisticBooking: Booking = {
          id: temporaryId,

          doctorId:
            selectedDoctorId,

          slotId: slot.id,

          status: 'pending',

          createdAt:
            new Date().toISOString(),
        };

        set(current => ({
          bookingLoading: true,
          bookingError: null,
          slotConflict: false,
          currentBooking:
            optimisticBooking,
          bookings: mergeBookings(
            current.bookings,
            [optimisticBooking],
          ),
        }));

        try {
          const confirmedBooking =
            await mockApi.createBooking(
              selectedDoctorId,
              slot.id,
            );

          const updatedBookings =
            mergeBookings(
              get().bookings.filter(
                item =>
                  item.id !== temporaryId,
              ),
              [confirmedBooking],
            );

          set({
            bookingLoading: false,
            bookingError: null,
            slotConflict: false,
            currentBooking:
              confirmedBooking,
            bookings: updatedBookings,
            selectedSlot: null,
          });

          void saveBookingsCache(
            updatedBookings,
          );

          return confirmedBooking;
        } catch (error) {
          const status =
            getErrorStatus(error);

          const isConflict =
            status === 409;

          const message =
            isConflict
              ? 'This appointment slot has just been booked. Please choose another available slot.'
              : getErrorMessage(error);

          const updatedBookings =
            get().bookings.filter(
              item =>
                item.id !== temporaryId,
            );

          set({
            bookingLoading: false,
            bookingError: message,
            slotConflict: isConflict,
            currentBooking: null,
            bookings: updatedBookings,
            selectedSlot: isConflict
              ? null
              : slot,
          });

          void saveBookingsCache(
            updatedBookings,
          );

          /**
           * Refresh slots after conflict.
           */
          if (isConflict) {
            void get().fetchSlots(
              selectedDoctorId,
              get().selectedDate,
            );
          }

          return null;
        } finally {
          bookingRequestInFlight = false;
        }
      },

      /**
       * Fetch booking history.
       */
      fetchBookings: async () => {
        const requestId =
          ++bookingsRequestId;

        set({
          bookingsLoading: true,
          bookingsError: null,
        });

        try {
          const response =
            await mockApi.getBookings();

          if (
            requestId !== bookingsRequestId
          ) {
            return;
          }

          const bookings =
            mergeBookings(
              response,
            );

          set({
            bookings,
            bookingsLoading: false,
            refreshing: false,
          });

          void saveBookingsCache(
            bookings,
          );
        } catch (error) {
          if (
            requestId !== bookingsRequestId
          ) {
            return;
          }

          set({
            bookingsLoading: false,
            refreshing: false,
            bookingsError:
              getErrorMessage(error),
          });
        }
      },

      /**
       * Pull-to-refresh bookings.
       */
      refreshBookings: async () => {
        set({
          refreshing: true,
        });

        await get().fetchBookings();
      },

      /**
       * Restore locally cached bookings.
       */
      hydrateBookings: async () => {
        if (get().hydrated) {
          return;
        }

        const cached =
          await readBookingsCache();

        set(current => ({
          bookings:
            current.bookings.length > 0
              ? current.bookings
              : cached,
          hydrated: true,
        }));
      },

      /**
       * Reset doctor/date/slot selection.
       */
      resetSelection: () => {
        slotsRequestId += 1;

        set({
          selectedDoctor: null,
          selectedDate: getTodayDate(),
          selectedSlot: null,
          slots: [],
          slotsLoading: false,
          slotsError: null,
          bookingError: null,
          slotConflict: false,
        });
      },

      /**
       * Reset booking flow.
       *
       * Booking history is preserved.
       */
      resetBookingState: () => {
        slotsRequestId += 1;

        set({
          selectedDoctor: null,
          selectedDate: getTodayDate(),
          selectedSlot: null,
          slots: [],
          currentBooking: null,
          slotsLoading: false,
          bookingLoading: false,
          slotsError: null,
          bookingError: null,
          slotConflict: false,
        });
      },

      /**
       * Clear booking error.
       */
      clearBookingError: () => {
        set({
          bookingError: null,
          slotConflict: false,
        });
      },

      /**
       * Clear bookings list error.
       */
      clearBookingsError: () => {
        set({
          bookingsError: null,
        });
      },
    }),
  );

/**
 * ==================================================
 * SELECTORS
 * ==================================================
 */

/**
 * Selected doctor.
 */
export const selectSelectedDoctor = (
  state: BookingStoreState,
) => state.selectedDoctor;

/**
 * Selected slot.
 */
export const selectSelectedSlot = (
  state: BookingStoreState,
) => state.selectedSlot;

/**
 * Available slots.
 */
export const selectAvailableSlots = (
  state: BookingStoreState,
) =>
  state.slots.filter(
    slot => slot.available,
  );

/**
 * Confirmed bookings.
 */
export const selectConfirmedBookings = (
  state: BookingStoreState,
) =>
  state.bookings.filter(
    booking =>
      booking.status === 'confirmed',
  );

/**
 * Pending bookings.
 */
export const selectPendingBookings = (
  state: BookingStoreState,
) =>
  state.bookings.filter(
    booking =>
      booking.status === 'pending',
  );

/**
 * Failed bookings.
 */
export const selectFailedBookings = (
  state: BookingStoreState,
) =>
  state.bookings.filter(
    booking =>
      booking.status === 'failed',
  );

/**
 * Booking form validity.
 */
export const selectCanConfirmBooking = (
  state: BookingStoreState,
): boolean => {
  const doctorId =
    state.selectedDoctor?.id;

  const slot =
    state.selectedSlot;

  return Boolean(
    doctorId &&
    slot &&
    slot.available &&
    slot.doctorId === doctorId &&
    !state.bookingLoading,
  );
};

/**
 * ==================================================
 * NON-REACT ACCESS
 * ==================================================
 *
 * Useful in services and event handlers.
 */

/**
 * Read current store state outside React.
 */
export function getBookingStoreState():
  BookingStoreState {
  return useBookingStore.getState();
}

/**
 * Clear booking store memory.
 *
 * Does not delete cached bookings.
 */
export function clearBookingStore():
  void {
  slotsRequestId += 1;
  bookingsRequestId += 1;

  useBookingStore.setState({
    selectedDoctor: null,
    selectedDate: getTodayDate(),
    selectedSlot: null,
    slots: [],
    bookings: [],
    currentBooking: null,
    slotsLoading: false,
    bookingLoading: false,
    bookingsLoading: false,
    refreshing: false,
    slotsError: null,
    bookingError: null,
    bookingsError: null,
    slotConflict: false,
    hydrated: false,
  });
}

/**
 * Clear locally cached booking history.
 *
 * Does not cancel or delete bookings
 * from the mock API.
 */
export async function clearBookingsCache():
  Promise<void> {
  await AsyncStorage.removeItem(
    BOOKINGS_CACHE_KEY,
  );

  useBookingStore.setState({
    bookings: [],
    hydrated: false,
  });
}
