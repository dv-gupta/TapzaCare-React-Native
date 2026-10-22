
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react-native';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import type {
  Doctor,
  Slot,
} from '../types/doctor';

import {mockApi} from '../api/mockApi';
import {useAppConfig} from '../hooks/useAppConfig';
import {useBooking} from '../hooks/useBooking';

import DateSelector from '../components/booking/DateSelector';
import SlotBottomSheet from '../components/booking/SlotBottomSheet';
import BookingSuccess from '../components/booking/BookingSuccess';
import AppButton from '../components/common/AppButton';

import {
  createConfigTheme,
  semanticColors,
  spacing,
  radius,
  fontSize,
  dimensions,
} from '../theme/theme';

/* =====================================================
   TYPES
===================================================== */

type BookingRouteProp = RouteProp<
  RootStackParamList,
  'Booking'
>;

type BookingNavigationProp =
  NavigationProp<RootStackParamList>;

type BookingColors =
  ReturnType<
    typeof createConfigTheme
  >['colors'];

interface HeaderProps {
  colors: BookingColors;
  onBack: () => void;
}

interface DoctorInfoProps {
  doctor: Doctor;
  colors: BookingColors;
}

interface SummaryRowProps {
  label: string;
  value: string;
  colors: BookingColors;
  prominent?: boolean;
}

/* =====================================================
   DATE / TIME HELPERS
===================================================== */

function formatTime(
  dateTime: string,
): string {
  const date = new Date(dateTime);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '--:--';
  }

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  );
}

function formatDate(
  dateString: string,
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dateString,
    );

  if (!match) {
    return dateString;
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
    return dateString;
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

function formatSlot(
  slot: Slot,
): string {
  return (
    `${formatTime(slot.startsAt)} – ` +
    formatTime(slot.endsAt)
  );
}

function formatPrice(
  amount: number,
): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/* =====================================================
   HEADER
===================================================== */

function BookingHeader({
  colors,
  onBack,
}: HeaderProps) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor:
            colors.surface,
          borderBottomColor:
            semanticColors.border,
        },
      ]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({pressed}) => [
          styles.backButton,
          {
            backgroundColor:
              colors.secondary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <ArrowLeft
          size={22}
          color={colors.textPrimary}
        />
      </Pressable>

      <View
        style={
          styles.headerTextContainer
        }>
        <Text
          style={[
            styles.headerTitle,
            {
              color:
                colors.textPrimary,
            },
          ]}>
          Book Appointment
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.headerSubtitle,
            {
              color:
                colors.textSecondary,
            },
          ]}>
          Choose your date and time
        </Text>
      </View>
    </View>
  );
}

/* =====================================================
   DOCTOR CARD
===================================================== */

function DoctorInfoCard({
  doctor,
  colors,
}: DoctorInfoProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            colors.surface,
        },
      ]}>
      <View
        style={
          styles.doctorRow
        }>
        <View
          style={[
            styles.doctorIcon,
            {
              backgroundColor:
                colors.secondary,
            },
          ]}>
          <Stethoscope
            size={28}
            color={colors.primary}
          />
        </View>

        <View
          style={
            styles.doctorDetails
          }>
          <Text
            style={[
              styles.doctorName,
              {
                color:
                  colors.textPrimary,
              },
            ]}>
            {doctor.name}
          </Text>

          <Text
            style={[
              styles.doctorSpecialty,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {doctor.specialty}
          </Text>

          <View
            style={
              styles.consultationRow
            }>
            <MapPin
              size={14}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={[
                styles.consultationText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              Online Consultation
            </Text>
          </View>
        </View>
      </View>

      <View
        style={
          styles.divider
        }
      />

      <View
        style={
          styles.feeRow
        }>
        <Text
          style={[
            styles.feeLabel,
            {
              color:
                colors.textSecondary,
            },
          ]}>
          Consultation Fee
        </Text>

        <Text
          style={[
            styles.feeValue,
            {
              color:
                colors.primary,
            },
          ]}>
          {formatPrice(
            doctor.feeInr,
          )}
        </Text>
      </View>

      {doctor.languages.length >
        0 && (
        <Text
          style={[
            styles.languages,
            {
              color:
                colors.textSecondary,
            },
          ]}>
          Languages:{' '}
          {doctor.languages.join(
            ', ',
          )}
        </Text>
      )}
    </View>
  );
}

/* =====================================================
   SUMMARY ROW
===================================================== */

function SummaryRow({
  label,
  value,
  colors,
  prominent = false,
}: SummaryRowProps) {
  return (
    <View
      style={
        styles.summaryRow
      }>
      <Text
        style={[
          prominent
            ? styles.totalLabel
            : styles.summaryLabel,
          {
            color: prominent
              ? colors.textPrimary
              : colors.textSecondary,
          },
        ]}>
        {label}
      </Text>

      <Text
        style={[
          prominent
            ? styles.totalValue
            : styles.summaryValue,
          {
            color: prominent
              ? colors.primary
              : colors.textPrimary,
          },
        ]}
        numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* =====================================================
   BOOKING SCREEN
===================================================== */

export default function BookingScreen() {
  const navigation =
    useNavigation<BookingNavigationProp>();

  const route =
    useRoute<BookingRouteProp>();

  const doctorId =
    route.params.doctorId;

  const {
    config,
    mode,
  } = useAppConfig();

  /* ---------------------------------------------------
     DYNAMIC THEME
  --------------------------------------------------- */

  const theme = useMemo(
    () =>
      createConfigTheme(
        mode,
        config?.theme,
      ),
    [
      mode,
      config?.theme,
    ],
  );

  const {colors} = theme;

  const isDiwali =
    mode === 'diwali';

  /* ---------------------------------------------------
     LOCAL STATE
  --------------------------------------------------- */

  const [
    doctor,
    setDoctor,
  ] = useState<Doctor | null>(
    null,
  );

  const [
    doctorLoading,
    setDoctorLoading,
  ] = useState(true);

  const [
    doctorError,
    setDoctorError,
  ] = useState<
    string | null
  >(null);

  const [
    sheetVisible,
    setSheetVisible,
  ] = useState(false);

  const [
    showSuccess,
    setShowSuccess,
  ] = useState(false);

  /* ---------------------------------------------------
     ASYNC SAFETY
  --------------------------------------------------- */

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /* ---------------------------------------------------
     BOOKING HOOK
  --------------------------------------------------- */

  const {
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
  } = useBooking({
    doctorId,
  });

  /* ---------------------------------------------------
     LOAD DOCTOR
  --------------------------------------------------- */

  const fetchDoctor =
    useCallback(async () => {
      const requestId =
        ++requestIdRef.current;

      if (mountedRef.current) {
        setDoctorLoading(true);
        setDoctorError(null);
      }

      try {
        const doctors =
          await mockApi.getDoctors();

        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        const matchedDoctor =
          doctors.find(
            item =>
              item.id === doctorId,
          );

        if (!matchedDoctor) {
          throw new Error(
            'Doctor not found. Please select another doctor.',
          );
        }

        setDoctor(
          matchedDoctor,
        );
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setDoctor(null);

        setDoctorError(
          error instanceof Error
            ? error.message
            : 'Unable to load doctor details.',
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            requestIdRef.current
        ) {
          setDoctorLoading(false);
        }
      }
    }, [doctorId]);

  useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  /* ---------------------------------------------------
     AVAILABLE SLOTS
  --------------------------------------------------- */

  const availableSlotsCount =
    useMemo(
      () =>
        slots.filter(
          slot =>
            slot.available,
        ).length,
      [slots],
    );

  const canOpenSlots =
    !slotsLoading &&
    !bookingLoading &&
    !slotsError &&
    availableSlotsCount > 0;

  const canConfirmBooking =
    !!doctor &&
    !!selectedSlot &&
    selectedSlot.available &&
    !slotsLoading &&
    !bookingLoading &&
    !slotsError;

  /* ---------------------------------------------------
     NAVIGATION
  --------------------------------------------------- */

  const handleGoBack =
    useCallback(() => {
      if (
        navigation.canGoBack()
      ) {
        navigation.goBack();
      } else {
        navigation.navigate(
          'Doctors',
        );
      }
    }, [navigation]);

  const handleBookingDone =
    useCallback(() => {
      setShowSuccess(false);
      resetBooking();

      navigation.navigate(
        'MainTabs',
        {
          screen:
            'Bookings',
        },
      );
    }, [
      navigation,
      resetBooking,
    ]);

  /* ---------------------------------------------------
     DATE SELECTION
  --------------------------------------------------- */

  const handleDateChange =
    useCallback(
      (date: string) => {
        if (bookingLoading) {
          return;
        }

        setSelectedDate(date);
        setSheetVisible(false);
        setShowSuccess(false);
      },
      [
        bookingLoading,
        setSelectedDate,
      ],
    );

  /* ---------------------------------------------------
     SLOT SELECTION
  --------------------------------------------------- */

  const handleOpenSlotSheet =
    useCallback(() => {
      if (!canOpenSlots) {
        return;
      }

      setSheetVisible(true);
    }, [canOpenSlots]);

  const handleSlotSelect =
    useCallback(
      (slot: Slot) => {
        if (
          !slot.available ||
          bookingLoading
        ) {
          return;
        }

        selectSlot(slot);
        setSheetVisible(false);
      },
      [
        bookingLoading,
        selectSlot,
      ],
    );

  /* ---------------------------------------------------
     CONFIRM BOOKING
  --------------------------------------------------- */

  const handleConfirmBooking =
    useCallback(async () => {
      if (
        !canConfirmBooking
      ) {
        return;
      }

      try {
        const result =
          await confirmBooking();

        if (
          mountedRef.current &&
          result?.status ===
            'confirmed'
        ) {
          setShowSuccess(true);
          setSheetVisible(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            '[BookingScreen] Booking failed:',
            error,
          );
        }
      }
    }, [
      canConfirmBooking,
      confirmBooking,
    ]);

  /* ---------------------------------------------------
     LOADING STATE
  --------------------------------------------------- */

  if (doctorLoading) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor:
              colors.background,
          },
        ]}>
        <StatusBar
          barStyle="dark-content"
        />

        <BookingHeader
          colors={colors}
          onBack={
            handleGoBack
          }
        />

        <View
          style={
            styles.centerContainer
          }>
          <ActivityIndicator
            size="large"
            color={
              colors.primary
            }
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Loading doctor details...
          </Text>
        </View>
      </View>
    );
  }

  /* ---------------------------------------------------
     ERROR STATE
  --------------------------------------------------- */

  if (
    doctorError ||
    !doctor
  ) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor:
              colors.background,
          },
        ]}>
        <StatusBar
          barStyle="dark-content"
        />

        <BookingHeader
          colors={colors}
          onBack={
            handleGoBack
          }
        />

        <View
          style={
            styles.centerContainer
          }>
          <AlertCircle
            size={42}
            color={
              semanticColors.error
            }
          />

          <Text
            style={[
              styles.errorTitle,
              {
                color:
                  colors.textPrimary,
              },
            ]}>
            Unable to Load Doctor
          </Text>

          <Text
            style={[
              styles.errorMessage,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {doctorError ??
              'Doctor details are unavailable.'}
          </Text>

          <Pressable
            onPress={() => {
              void fetchDoctor();
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry loading doctor"
            style={[
              styles.retryButton,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}>
            <RefreshCw
              size={17}
              color={
                semanticColors.white
              }
            />

            <Text
              style={
                styles.retryText
              }>
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ---------------------------------------------------
     BOOKING SUCCESS
  --------------------------------------------------- */

  if (
    showSuccess &&
    bookingSuccess &&
    booking &&
    selectedSlot
  ) {
    return (
      <BookingSuccess
        booking={booking}
        doctor={doctor}
        slot={selectedSlot}
        onDone={
          handleBookingDone
        }
        primaryColor={
          colors.primary
        }
      />
    );
  }

  /* ===================================================
     MAIN BOOKING UI
  =================================================== */

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.background,
        },
      ]}>
      <StatusBar
        barStyle="dark-content"
      />

      <BookingHeader
        colors={colors}
        onBack={
          handleGoBack
        }
      />

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled">

        {/* FESTIVAL MESSAGE */}

        {isDiwali && (
          <View
            style={[
              styles.festivalBanner,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <Text
              style={[
                styles.festivalText,
                {
                  color:
                    colors.primary,
                },
              ]}>
              ✨ Celebrate a Healthy
              Diwali!
            </Text>
          </View>
        )}

        {/* DOCTOR DETAILS */}

        <DoctorInfoCard
          doctor={doctor}
          colors={colors}
        />

        {/* DATE SELECTION */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View
            style={
              styles.sectionHeader
            }>
            <CalendarDays
              size={21}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Appointment Date
            </Text>
          </View>

          <DateSelector
            selectedDate={
              selectedDate
            }
            onDateSelect={
              handleDateChange
            }
            primaryColor={
              colors.primary
            }
            daysToShow={15}
            disabled={
              bookingLoading
            }
          />

          <Text
            style={[
              styles.selectedDateText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Selected:{' '}
            {formatDate(
              selectedDate,
            )}
          </Text>
        </View>

        {/* SLOT SELECTION */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View
            style={
              styles.sectionHeader
            }>
            <Clock3
              size={21}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Appointment Time
            </Text>
          </View>

          {slotsLoading ? (
            <View
              style={
                styles.inlineRow
              }>
              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />

              <Text
                style={[
                  styles.inlineText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                Checking available
                slots...
              </Text>
            </View>
          ) : slotsError ? (
            <View
              style={[
                styles.inlineError,
                {
                  backgroundColor:
                    semanticColors.errorLight,
                },
              ]}>
              <AlertCircle
                size={18}
                color={
                  semanticColors.error
                }
              />

              <Text
                style={
                  styles.inlineErrorText
                }>
                {slotsError}
              </Text>

              <Pressable
                onPress={() => {
                  void fetchSlots();
                }}
                accessibilityRole="button"
                accessibilityLabel="Retry loading slots"
                style={
                  styles.inlineRetry
                }>
                <RefreshCw
                  size={19}
                  color={
                    colors.primary
                  }
                />
              </Pressable>
            </View>
          ) : (
            <View
              style={
                styles.inlineRow
              }>
              <CheckCircle2
                size={17}
                color={
                  availableSlotsCount >
                  0
                    ? semanticColors.success
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.inlineText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {availableSlotsCount >
                0
                  ? `${availableSlotsCount} slots available`
                  : 'No available slots for this date'}
              </Text>
            </View>
          )}

          <Pressable
            onPress={
              handleOpenSlotSheet
            }
            disabled={
              !canOpenSlots
            }
            accessibilityRole="button"
            accessibilityLabel={
              selectedSlot
                ? `Selected slot ${formatSlot(
                    selectedSlot,
                  )}. Change slot`
                : 'Choose an appointment time slot'
            }
            accessibilityState={{
              disabled:
                !canOpenSlots,
            }}
            style={({pressed}) => [
              styles.slotPicker,
              {
                borderColor:
                  selectedSlot
                    ? colors.primary
                    : semanticColors.border,

                backgroundColor:
                  selectedSlot
                    ? colors.secondary
                    : colors.background,

                opacity:
                  !canOpenSlots
                    ? 0.5
                    : pressed
                      ? 0.75
                      : 1,
              },
            ]}>
            <View
              style={
                styles.slotPickerText
              }>
              <Text
                style={[
                  styles.slotPickerTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                {selectedSlot
                  ? formatSlot(
                      selectedSlot,
                    )
                  : 'Choose a Time Slot'}
              </Text>

              <Text
                style={[
                  styles.slotPickerSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {selectedSlot
                  ? 'Tap to change your slot'
                  : 'View available appointment times'}
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={
                colors.primary
              }
            />
          </Pressable>
        </View>

        {/* BOOKING SUMMARY */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View
            style={
              styles.sectionHeader
            }>
            <ShieldCheck
              size={21}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Booking Summary
            </Text>
          </View>

          <SummaryRow
            label="Doctor"
            value={doctor.name}
            colors={colors}
          />

          <SummaryRow
            label="Date"
            value={formatDate(
              selectedDate,
            )}
            colors={colors}
          />

          <SummaryRow
            label="Time"
            value={
              selectedSlot
                ? formatSlot(
                    selectedSlot,
                  )
                : 'Not selected'
            }
            colors={colors}
          />

          <View
            style={
              styles.divider
            }
          />

          <SummaryRow
            label="Total Amount"
            value={formatPrice(
              doctor.feeInr,
            )}
            colors={colors}
            prominent
          />
        </View>

        {/* BOOKING ERROR */}

        {bookingError && (
          <View
            accessibilityRole="alert"
            style={[
              styles.bookingError,
              {
                backgroundColor:
                  semanticColors.errorLight,
              },
            ]}>
            <AlertCircle
              size={19}
              color={
                semanticColors.error
              }
            />

            <Text
              style={
                styles.bookingErrorText
              }>
              {bookingError}
            </Text>
          </View>
        )}

        {/* OPTIMISTIC CONFIRMATION */}

        {bookingLoading &&
          booking?.status ===
            'pending' && (
            <View
              style={[
                styles.pendingCard,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />

              <Text
                style={[
                  styles.pendingText,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                Confirming your
                appointment...
              </Text>
            </View>
          )}

        {/* SECURITY NOTE */}

        <View
          style={
            styles.securityNote
          }>
          <ShieldCheck
            size={17}
            color={
              colors.primary
            }
          />

          <Text
            style={[
              styles.securityText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Your appointment will
            be confirmed after
            successful booking.
          </Text>
        </View>
      </ScrollView>

      {/* STICKY FOOTER */}

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              colors.surface,
            borderTopColor:
              semanticColors.border,
          },
        ]}>
        <View
          style={
            styles.footerAmount
          }>
          <Text
            style={[
              styles.footerLabel,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Consultation Fee
          </Text>

          <Text
            style={[
              styles.footerPrice,
              {
                color:
                  colors.primary,
              },
            ]}>
            {formatPrice(
              doctor.feeInr,
            )}
          </Text>
        </View>

        <View
          style={
            styles.footerButton
          }>
          <AppButton
            title={
              bookingLoading
                ? 'Confirming...'
                : 'Confirm Booking'
            }
            onPress={() => {
              void handleConfirmBooking();
            }}
            loading={
              bookingLoading
            }
            disabled={
              !canConfirmBooking
            }
            fullWidth
          />
        </View>
      </View>

      {/* SLOT BOTTOM SHEET */}

      <SlotBottomSheet
        visible={
          sheetVisible
        }
        doctorId={
          doctorId
        }
        selectedDate={
          selectedDate
        }
        selectedSlotId={
          selectedSlot?.id ??
          null
        }
        onClose={() => {
          setSheetVisible(false);
        }}
        onSlotSelect={
          handleSlotSelect
        }
        primaryColor={
          colors.primary
        }
      />
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:
      spacing.lg,
    paddingVertical:
      spacing.sm,
    borderBottomWidth: 1,
  },

  backButton: {
    width:
      dimensions.touchTarget,
    height:
      dimensions.touchTarget,
    borderRadius:
      radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    marginLeft:
      spacing.md,
  },

  headerTitle: {
    fontSize:
      fontSize.subtitle,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize:
      fontSize.caption,
    marginTop:
      spacing.xxs,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding:
      spacing.lg,
    paddingBottom:
      spacing.xxl,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding:
      spacing.xl,
  },

  loadingText: {
    marginTop:
      spacing.lg,
    fontSize:
      fontSize.small,
    textAlign: 'center',
  },

  errorTitle: {
    fontSize:
      fontSize.sectionTitle,
    fontWeight: '800',
    marginTop:
      spacing.lg,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize:
      fontSize.small,
    marginTop:
      spacing.sm,
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight:
      dimensions.touchTarget,
    paddingHorizontal:
      spacing.xl,
    marginTop:
      spacing.xl,
    borderRadius:
      radius.sm,
    gap:
      spacing.sm,
  },

  retryText: {
    color:
      semanticColors.white,
    fontSize:
      fontSize.small,
    fontWeight: '700',
  },

  festivalBanner: {
    padding:
      spacing.md,
    borderRadius:
      radius.md,
    marginBottom:
      spacing.lg,
  },

  festivalText: {
    fontSize:
      fontSize.small,
    fontWeight: '800',
    textAlign: 'center',
  },

  card: {
    padding:
      spacing.lg,
    borderRadius:
      radius.lg,
    marginBottom:
      spacing.lg,
    borderWidth: 1,
    borderColor:
      semanticColors.border,
  },

  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doctorIcon: {
    width: 64,
    height: 64,
    borderRadius:
      radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doctorDetails: {
    flex: 1,
    marginLeft:
      spacing.md,
  },

  doctorName: {
    fontSize:
      fontSize.subtitle,
    fontWeight: '800',
  },

  doctorSpecialty: {
    fontSize:
      fontSize.small,
    marginTop:
      spacing.xs,
  },

  consultationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:
      spacing.sm,
    gap:
      spacing.xs,
  },

  consultationText: {
    fontSize:
      fontSize.caption,
  },

  divider: {
    height: 1,
    backgroundColor:
      semanticColors.divider,
    marginVertical:
      spacing.lg,
  },

  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  feeLabel: {
    fontSize:
      fontSize.small,
  },

  feeValue: {
    fontSize:
      fontSize.sectionTitle,
    fontWeight: '800',
  },

  languages: {
    fontSize:
      fontSize.caption,
    marginTop:
      spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:
      spacing.sm,
    marginBottom:
      spacing.md,
  },

  sectionTitle: {
    fontSize:
      fontSize.body,
    fontWeight: '800',
  },

  selectedDateText: {
    fontSize:
      fontSize.caption,
    marginTop:
      spacing.sm,
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:
      spacing.sm,
    paddingVertical:
      spacing.md,
  },

  inlineText: {
    flex: 1,
    fontSize:
      fontSize.caption,
  },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:
      spacing.md,
    gap:
      spacing.sm,
    borderRadius:
      radius.sm,
    marginBottom:
      spacing.md,
  },

  inlineErrorText: {
    flex: 1,
    fontSize:
      fontSize.caption,
    color:
      semanticColors.error,
  },

  inlineRetry: {
    width:
      dimensions.touchTarget,
    height:
      dimensions.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slotPicker: {
    minHeight: 64,
    borderWidth: 1.5,
    borderRadius:
      radius.md,
    padding:
      spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  slotPickerText: {
    flex: 1,
  },

  slotPickerTitle: {
    fontSize:
      fontSize.small,
    fontWeight: '700',
  },

  slotPickerSubtitle: {
    fontSize:
      fontSize.caption,
    marginTop:
      spacing.xs,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap:
      spacing.md,
    marginBottom:
      spacing.md,
  },

  summaryLabel: {
    fontSize:
      fontSize.small,
  },

  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize:
      fontSize.small,
    fontWeight: '600',
  },

  totalLabel: {
    fontSize:
      fontSize.body,
    fontWeight: '800',
  },

  totalValue: {
    flexShrink: 1,
    fontSize:
      fontSize.sectionTitle,
    fontWeight: '800',
    textAlign: 'right',
  },

  bookingError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding:
      spacing.md,
    borderRadius:
      radius.md,
    gap:
      spacing.sm,
    marginBottom:
      spacing.lg,
  },

  bookingErrorText: {
    flex: 1,
    color:
      semanticColors.error,
    fontSize:
      fontSize.small,
    lineHeight: 21,
  },

  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:
      spacing.md,
    borderRadius:
      radius.md,
    gap:
      spacing.sm,
    marginBottom:
      spacing.lg,
  },

  pendingText: {
    flex: 1,
    fontSize:
      fontSize.small,
    fontWeight: '700',
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap:
      spacing.sm,
    paddingHorizontal:
      spacing.xs,
    marginTop:
      spacing.xs,
  },

  securityText: {
    flex: 1,
    fontSize:
      fontSize.caption,
    lineHeight: 19,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:
      spacing.lg,
    paddingVertical:
      spacing.md,
    borderTopWidth: 1,
    gap:
      spacing.md,
  },

  footerAmount: {
    minWidth: 100,
  },

  footerLabel: {
    fontSize:
      fontSize.tiny,
  },

  footerPrice: {
    fontSize:
      fontSize.sectionTitle,
    fontWeight: '800',
    marginTop:
      spacing.xxs,
  },

  footerButton: {
    flex: 1,
  },
});
