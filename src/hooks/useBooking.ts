
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {mockApi} from '../api/mockApi';

import type {
  Booking,
  Slot,
} from '../types/doctor';

/**
 * Booking hook parameters.
 */
export interface UseBookingParams {
  doctorId: string;
  initialDate?: string;
}

/**
 * Booking hook return type.
 */
export interface UseBookingReturn {
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  slots: Slot[];
  selectedSlot: Slot | null;
  selectSlot: (slot: Slot | null) => void;

  slotsLoading: boolean;
  bookingLoading: boolean;

  slotsError: string | null;
  bookingError: string | null;

  booking: Booking | null;
  bookingSuccess: boolean;

  fetchSlots: () => Promise<void>;
  confirmBooking: () => Promise<Booking | null>;
  resetBooking: () => void;
}

/**
 * Returns the device's local date as YYYY-MM-DD.
 *
 * Avoids the UTC date mismatch caused by
 * new Date().toISOString().split('T')[0].
 */
function getLocalDate(): string {
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
 * Extract an API error status.
 *
 * Compatible with errors exposing:
 * - error.status
 * - error.statusCode
 * - error.response.status
 */
function getErrorStatus(error: unknown): number | null {
  if (
    typeof error !== 'object' ||
    error === null
  ) {
    return null;
  }

  const value = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: {
      status?: unknown;
    };
  };

  const status =
    value.status ??
    value.statusCode ??
    value.response?.status;

  return typeof status === 'number'
    ? status
    : null;
}

/**
 * Convert unknown API errors into readable messages.
 */
function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return fallback;
}

/**
 * Custom booking hook.
 *
 * Features:
 * - Fetch available slots
 * - Change appointment date
 * - Select appointment slot
 * - Optimistic booking confirmation
 * - Handle 409 booking conflicts
 * - Refresh slots after conflicts
 * - Prevent duplicate submissions
 * - Ignore outdated API responses
 * - Prevent updates after unmount
 */
export function useBooking({
  doctorId,
  initialDate,
}: UseBookingParams): UseBookingReturn {
  const [selectedDate, setSelectedDateState] =
    useState<string>(
      initialDate ?? getLocalDate(),
    );

  const [slots, setSlots] =
    useState<Slot[]>([]);

  const [selectedSlot, setSelectedSlot] =
    useState<Slot | null>(null);

  const [slotsLoading, setSlotsLoading] =
    useState<boolean>(false);

  const [bookingLoading, setBookingLoading] =
    useState<boolean>(false);

  const [slotsError, setSlotsError] =
    useState<string | null>(null);

  const [bookingError, setBookingError] =
    useState<string | null>(null);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [bookingSuccess, setBookingSuccess] =
    useState<boolean>(false);

  /**
   * Mounted state.
   */
  const mountedRef = useRef(false);

  /**
   * Used to ignore stale slot requests.
   */
  const slotsRequestIdRef = useRef(0);

  /**
   * Prevent double booking when the user
   * taps Confirm multiple times.
   */
  const bookingInProgressRef = useRef(false);

  /**
   * Invalidate booking responses when the
   * doctor or date changes.
   */
  const bookingRequestIdRef = useRef(0);

  /**
   * Keep latest selected date accessible
   * to asynchronous callbacks.
   */
  const selectedDateRef = useRef(selectedDate);

  /**
   * Keep latest selected slot accessible.
   */
  const selectedSlotRef =
    useRef<Slot | null>(null);

  /**
   * Keep current doctor ID accessible.
   */
  const doctorIdRef = useRef(doctorId);

  /**
   * Handle mounting and cleanup.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      slotsRequestIdRef.current += 1;
      bookingRequestIdRef.current += 1;

      bookingInProgressRef.current = false;
    };
  }, []);

  /**
   * Update selected date.
   *
   * Clear previous selection and booking
   * feedback when the date changes.
   */
  const setSelectedDate = useCallback(
    (date: string) => {
      if (!date) {
        return;
      }

      if (selectedDateRef.current === date) {
        return;
      }

      selectedDateRef.current = date;

      selectedSlotRef.current = null;

      slotsRequestIdRef.current += 1;
      bookingRequestIdRef.current += 1;

      setSelectedDateState(date);
      setSelectedSlot(null);

      setSlots([]);
      setSlotsError(null);

      setBooking(null);
      setBookingError(null);
      setBookingSuccess(false);

      setBookingLoading(false);

      bookingInProgressRef.current = false;
    },
    [],
  );

  /**
   * Select an available appointment slot.
   */
  const selectSlot = useCallback(
    (slot: Slot | null) => {
      if (bookingInProgressRef.current) {
        return;
      }

      if (slot && !slot.available) {
        setBookingError(
          'This appointment slot is unavailable. Please select another slot.',
        );
        return;
      }

      if (
        slot &&
        slot.doctorId !== doctorIdRef.current
      ) {
        setBookingError(
          'The selected slot does not belong to this doctor.',
        );
        return;
      }

      selectedSlotRef.current = slot;

      setSelectedSlot(slot);
      setBookingError(null);
      setBookingSuccess(false);
      setBooking(null);
    },
    [],
  );

  /**
   * Fetch appointment slots for the
   * currently selected doctor and date.
   */
  const fetchSlots = useCallback(
    async (): Promise<void> => {
      const requestId =
        ++slotsRequestIdRef.current;

      const requestedDoctorId = doctorId;
      const requestedDate = selectedDate;

      if (!requestedDoctorId) {
        setSlots([]);
        setSlotsError('Doctor ID is missing.');
        setSlotsLoading(false);
        return;
      }

      setSlotsLoading(true);
      setSlotsError(null);

      try {
        const response = await mockApi.getSlots(
          requestedDoctorId,
          requestedDate,
        );

        if (
          !mountedRef.current ||
          requestId !== slotsRequestIdRef.current
        ) {
          return;
        }

        const nextSlots = Array.isArray(response)
          ? response
          : [];

        setSlots(nextSlots);

        /**
         * Clear selected slot if it is no
         * longer available in the response.
         */
        const currentSelected =
          selectedSlotRef.current;

        if (currentSelected) {
          const matchingSlot = nextSlots.find(
            slot =>
              slot.id === currentSelected.id &&
              slot.available,
          );

          if (matchingSlot) {
            selectedSlotRef.current = matchingSlot;
            setSelectedSlot(matchingSlot);
          } else {
            selectedSlotRef.current = null;
            setSelectedSlot(null);
          }
        }
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !== slotsRequestIdRef.current
        ) {
          return;
        }

        setSlots([]);

        selectedSlotRef.current = null;
        setSelectedSlot(null);

        setSlotsError(
          getErrorMessage(
            error,
            'Unable to load appointment slots. Please try again.',
          ),
        );
      } finally {
        if (
          mountedRef.current &&
          requestId === slotsRequestIdRef.current
        ) {
          setSlotsLoading(false);
        }
      }
    },
    [doctorId, selectedDate],
  );

  /**
   * Automatically fetch slots when
   * doctor or date changes.
   */
  useEffect(() => {
    doctorIdRef.current = doctorId;

    void fetchSlots();

    return () => {
      slotsRequestIdRef.current += 1;
    };
  }, [doctorId, fetchSlots]);

  /**
   * Reset selected slot when doctor changes.
   */
  useEffect(() => {
    doctorIdRef.current = doctorId;

    selectedSlotRef.current = null;

    bookingRequestIdRef.current += 1;
    bookingInProgressRef.current = false;

    setSelectedSlot(null);
    setBooking(null);
    setBookingError(null);
    setBookingSuccess(false);
    setBookingLoading(false);
  }, [doctorId]);

  /**
   * Confirm selected appointment.
   *
   * Optimistic UI:
   * 1. Immediately create pending booking
   * 2. Call booking API
   * 3. Replace pending booking on success
   * 4. Roll back on error
   */
  const confirmBooking =
    useCallback(async (): Promise<Booking | null> => {
      if (bookingInProgressRef.current) {
        return null;
      }

      const slot = selectedSlotRef.current;

      if (!doctorId || !slot) {
        setBookingError(
          'Please select an appointment slot.',
        );
        return null;
      }

      if (!slot.available) {
        setBookingError(
          'Selected slot is no longer available.',
        );
        return null;
      }

      bookingInProgressRef.current = true;

      const requestId =
        ++bookingRequestIdRef.current;

      const requestedDoctorId = doctorId;
      const requestedDate =
        selectedDateRef.current;

      setBookingLoading(true);
      setBookingError(null);
      setBookingSuccess(false);

      /**
       * Optimistic pending booking.
       *
       * This is temporary and is replaced
       * by the actual server booking.
       */
      const optimisticBooking: Booking = {
        id: `temp-${Date.now()}`,
        doctorId: requestedDoctorId,
        slotId: slot.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setBooking(optimisticBooking);

      try {
        const response =
          await mockApi.createBooking(
            requestedDoctorId,
            slot.id,
          );

        if (
          !mountedRef.current ||
          requestId !== bookingRequestIdRef.current
        ) {
          return null;
        }

        setBooking(response);

        setBookingSuccess(
          response.status === 'confirmed',
        );

        /**
         * Mark the booked slot unavailable
         * in the local slots list.
         */
        setSlots(previous =>
          previous.map(item =>
            item.id === slot.id
              ? {...item, available: false}
              : item,
          ),
        );

        /**
         * Keep selected slot for the
         * BookingSuccess component.
         */
        return response;
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !== bookingRequestIdRef.current
        ) {
          return null;
        }

        /**
         * Roll back optimistic booking.
         */
        setBooking(null);
        setBookingSuccess(false);

        const status = getErrorStatus(error);

        if (status === 409) {
          setBookingError(
            'This slot has just been booked by someone else. Please choose another available slot.',
          );

          selectedSlotRef.current = null;
          setSelectedSlot(null);

          /**
           * Mark conflicting slot unavailable
           * immediately.
           */
          setSlots(previous =>
            previous.map(item =>
              item.id === slot.id
                ? {...item, available: false}
                : item,
            ),
          );

          /**
           * Refresh slots from the API.
           */
          const refreshRequestId =
            ++slotsRequestIdRef.current;

          try {
            const updatedSlots =
              await mockApi.getSlots(
                requestedDoctorId,
                requestedDate,
              );

            if (
              mountedRef.current &&
              requestId === bookingRequestIdRef.current &&
              refreshRequestId ===
                slotsRequestIdRef.current
            ) {
              setSlots(
                Array.isArray(updatedSlots)
                  ? updatedSlots
                  : [],
              );
            }
          } catch (refreshError) {
            console.warn(
              '[useBooking] Unable to refresh slots after conflict:',
              refreshError,
            );
          }
        } else {
          setBookingError(
            getErrorMessage(
              error,
              'Unable to confirm booking. Please try again.',
            ),
          );
        }

        return null;
      } finally {
        if (
          requestId === bookingRequestIdRef.current
        ) {
          bookingInProgressRef.current = false;

          if (mountedRef.current) {
            setBookingLoading(false);
          }
        }
      }
    }, [doctorId]);

  /**
   * Clear booking feedback and selected slot.
   */
  const resetBooking = useCallback(() => {
    bookingRequestIdRef.current += 1;
    bookingInProgressRef.current = false;

    selectedSlotRef.current = null;

    setSelectedSlot(null);
    setBooking(null);
    setBookingError(null);
    setBookingSuccess(false);
    setBookingLoading(false);
  }, []);

  return {
    selectedDate,
    setSelectedDate,

    slots,
    selectedSlot,
    selectSlot,

    slotsLoading,
    bookingLoading,

    slotsError,
    bookingError,

    booking,
    bookingSuccess,

    fetchSlots,
    confirmBooking,
    resetBooking,
  };
}

export default useBooking;
