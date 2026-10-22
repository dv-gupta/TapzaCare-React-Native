
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {
  CalendarDays,
  Clock3,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  ChevronRight,
  CalendarPlus,
  RefreshCw,
  Sparkles,
  IndianRupee,
  type LucideIcon,
} from 'lucide-react-native';

import {mockApi} from '../api/mockApi';

import type {
  Booking,
  Doctor,
  Slot,
} from '../types/doctor';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import {useAppConfig} from '../hooks/useAppConfig';

import {defaultColors} from '../theme/theme';

import EmptyState from '../components/common/EmptyState';

import ErrorState from '../components/common/ErrorState';

type Navigation = NavigationProp<RootStackParamList>;

type BookingStatus = Booking['status'];

interface BookingListItem {
  booking: Booking;
  doctor: Doctor | null;
  slot: Slot | null;
}

type FilterType =
  | 'all'
  | 'confirmed'
  | 'pending'
  | 'failed';

interface StatusAppearance {
  label: string;
  color: string;
  background: string;
  Icon: LucideIcon;
}

const FILTERS: Array<{
  key: FilterType;
  label: string;
}> = [
  {key: 'all', label: 'All'},
  {key: 'confirmed', label: 'Confirmed'},
  {key: 'pending', label: 'Pending'},
  {key: 'failed', label: 'Failed'},
];

function getStatusAppearance(
  status: BookingStatus,
): StatusAppearance {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        color: '#15803D',
        background: '#DCFCE7',
        Icon: CheckCircle2,
      };

    case 'pending':
      return {
        label: 'Pending',
        color: '#B45309',
        background: '#FEF3C7',
        Icon: Hourglass,
      };

    case 'failed':
      return {
        label: 'Failed',
        color: '#B91C1C',
        background: '#FEE2E2',
        Icon: AlertCircle,
      };

    default:
      return {
        label: 'Unknown',
        color: '#475569',
        background: '#F1F5F9',
        Icon: AlertCircle,
      };
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to load your bookings. Please try again.';
}

function isBookingUpcoming(
  item: BookingListItem,
): boolean {
  if (!item.slot) {
    return false;
  }

  const start = new Date(
    item.slot.startsAt,
  ).getTime();

  return (
    Number.isFinite(start) &&
    start > Date.now() &&
    item.booking.status === 'confirmed'
  );
}

/**
 * Resolve doctor and slot information.
 *
 * Bookings API returns doctorId and slotId,
 * so we join the records for display.
 */
async function enrichBookings(
  bookings: Booking[],
  doctors: Doctor[],
): Promise<BookingListItem[]> {
  const doctorMap = new Map(
    doctors.map(doctor => [
      doctor.id,
      doctor,
    ]),
  );

  const uniqueDoctorIds = Array.from(
    new Set(
      bookings.map(booking => booking.doctorId),
    ),
  );

  const slotEntries = await Promise.all(
    uniqueDoctorIds.map(async doctorId => {
      const relatedBookings = bookings.filter(
        booking => booking.doctorId === doctorId,
      );

      const dates = new Set<string>();

      for (const booking of relatedBookings) {
        // Booking only stores slotId, not slot date.
        // Without an appointment date endpoint, we
        // cannot reliably reconstruct the date.
        //
        // Attempt to read the date only if slotId
        // starts with YYYY-MM-DD.
        const dateMatch = booking.slotId.match(
          /^(\d{4}-\d{2}-\d{2})/,
        );

        if (dateMatch) {
          dates.add(dateMatch[1]);
        }
      }

      const dateResults = await Promise.all(
        Array.from(dates).map(async date => {
          try {
            return await mockApi.getSlots(
              doctorId,
              date,
            );
          } catch {
            return [] as Slot[];
          }
        }),
      );

      return dateResults.flat();
    }),
  );

  const slotMap = new Map<string, Slot>();

  slotEntries.flat().forEach(slot => {
    slotMap.set(slot.id, slot);
  });

  return bookings.map(booking => ({
    booking,
    doctor:
      doctorMap.get(booking.doctorId) ?? null,
    slot:
      slotMap.get(booking.slotId) ?? null,
  }));
}

/**
 * Booking card
 */
function BookingCard({
  item,
  primaryColor,
  surfaceColor,
  textColor,
  secondaryTextColor,
  onBookAgain,
}: {
  item: BookingListItem;
  primaryColor: string;
  surfaceColor: string;
  textColor: string;
  secondaryTextColor: string;
  onBookAgain: (doctorId: string) => void;
}) {
  const {booking, doctor, slot} = item;

  const status = getStatusAppearance(
    booking.status,
  );

  const StatusIcon = status.Icon;

  const upcoming = isBookingUpcoming(item);

  return (
    <View
      style={[
        styles.bookingCard,
        {backgroundColor: surfaceColor},
      ]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.doctorAvatar,
            {
              backgroundColor:
                `${primaryColor}15`,
            },
          ]}>
          <Stethoscope
            size={25}
            color={primaryColor}
          />
        </View>

        <View style={styles.doctorInfo}>
          <Text
            numberOfLines={1}
            style={[
              styles.doctorName,
              {color: textColor},
            ]}>
            {doctor?.name ?? 'Doctor'}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.doctorSpecialty,
              {color: secondaryTextColor},
            ]}>
            {doctor?.specialty ??
              'Healthcare Consultation'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status.background,
            },
          ]}>
          <StatusIcon
            size={13}
            color={status.color}
          />

          <Text
            style={[
              styles.statusText,
              {color: status.color},
            ]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {slot ? (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <CalendarDays
              size={16}
              color={primaryColor}
            />

            <Text
              style={[
                styles.detailText,
                {color: secondaryTextColor},
              ]}>
              {formatDate(slot.startsAt)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock3
              size={16}
              color={primaryColor}
            />

            <Text
              style={[
                styles.detailText,
                {color: secondaryTextColor},
              ]}>
              {formatTime(slot.startsAt)}
              {' - '}
              {formatTime(slot.endsAt)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailRow}>
          <CalendarDays
            size={16}
            color={secondaryTextColor}
          />

          <Text
            style={[
              styles.detailText,
              {color: secondaryTextColor},
            ]}>
            Appointment time unavailable
          </Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <IndianRupee
            size={16}
            color={primaryColor}
          />

          <Text
            style={[
              styles.detailText,
              {color: secondaryTextColor},
            ]}>
            Consultation Fee:
            {' '}
            {doctor
              ? `₹${doctor.feeInr.toLocaleString('en-IN')}`
              : 'Unavailable'}
          </Text>
        </View>
      </View>

      <View style={styles.bookingIdRow}>
        <Text
          numberOfLines={1}
          style={[
            styles.bookingId,
            {color: secondaryTextColor},
          ]}>
          Booking ID: {booking.id}
        </Text>

        {upcoming && (
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingText}>
              Upcoming
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <Text
          style={[
            styles.createdAt,
            {color: secondaryTextColor},
          ]}>
          Booked on {formatDate(booking.createdAt)}
        </Text>

        {doctor && (
          <Pressable
            onPress={() =>
              onBookAgain(doctor.id)
            }
            accessibilityRole="button"
            accessibilityLabel={`Book again with ${doctor.name}`}
            style={styles.bookAgainButton}>
            <Text
              style={[
                styles.bookAgainText,
                {color: primaryColor},
              ]}>
              Book Again
            </Text>

            <ChevronRight
              size={16}
              color={primaryColor}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Loading skeleton card
 */
function BookingSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />

        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineSmall} />
        </View>
      </View>

      <View style={styles.skeletonDivider} />

      <View style={styles.skeletonLineMedium} />
      <View style={styles.skeletonLineSmall} />

      <View style={styles.skeletonDivider} />

      <View style={styles.skeletonLineMedium} />
    </View>
  );
}

/**
 * Bookings Screen
 */
export default function BookingsScreen() {
  const navigation =
    useNavigation<Navigation>();

  const {config, mode} = useAppConfig();

  const colors =
    config?.theme ?? defaultColors;

  const isDiwali = mode === 'diwali';

  const [bookings, setBookings] =
    useState<BookingListItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<FilterType>('all');

  const requestIdRef = useRef(0);

  const mountedRef = useRef(false);

  /**
   * Load bookings.
   */
  const fetchBookings = useCallback(
    async (
      isRefresh = false,
    ): Promise<void> => {
      const requestId =
        ++requestIdRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [bookingResponse, doctorResponse] =
          await Promise.all([
            mockApi.getBookings(),
            mockApi.getDoctors(),
          ]);

        const enriched =
          await enrichBookings(
            bookingResponse,
            doctorResponse,
          );

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setBookings(enriched);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  /**
   * Track mount state.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /**
   * Refresh when the tab becomes focused.
   *
   * This ensures newly confirmed bookings
   * appear after returning from BookingScreen.
   */
  useFocusEffect(
    useCallback(() => {
      void fetchBookings();

      return () => {
        requestIdRef.current += 1;
      };
    }, [fetchBookings]),
  );

  /**
   * Sort newest bookings first.
   */
  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) =>
        new Date(
          b.booking.createdAt,
        ).getTime() -
        new Date(
          a.booking.createdAt,
        ).getTime(),
    );
  }, [bookings]);

  /**
   * Apply selected status filter.
   */
  const filteredBookings = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedBookings;
    }

    return sortedBookings.filter(
      item =>
        item.booking.status === activeFilter,
    );
  }, [sortedBookings, activeFilter]);

  /**
   * Booking counts.
   */
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      confirmed: bookings.filter(
        item =>
          item.booking.status === 'confirmed',
      ).length,
      pending: bookings.filter(
        item =>
          item.booking.status === 'pending',
      ).length,
      failed: bookings.filter(
        item =>
          item.booking.status === 'failed',
      ).length,
    };
  }, [bookings]);

  /**
   * Pull-to-refresh.
   */
  const handleRefresh = useCallback(() => {
    void fetchBookings(true);
  }, [fetchBookings]);

  /**
   * Book a new appointment.
   */
  const handleBookAppointment =
    useCallback(() => {
      navigation.navigate('Doctors');
    }, [navigation]);

  /**
   * Book again with the same doctor.
   */
  const handleBookAgain = useCallback(
    (doctorId: string) => {
      navigation.navigate('Booking', {
        doctorId,
      });
    },
    [navigation],
  );

  /**
   * Render booking card.
   */
  const renderItem: ListRenderItem<
    BookingListItem
  > = useCallback(
    ({item}) => (
      <BookingCard
        item={item}
        primaryColor={colors.primary}
        surfaceColor={colors.surface}
        textColor={colors.textPrimary}
        secondaryTextColor={
          colors.textSecondary
        }
        onBookAgain={handleBookAgain}
      />
    ),
    [
      colors.primary,
      colors.surface,
      colors.textPrimary,
      colors.textSecondary,
      handleBookAgain,
    ],
  );

  /**
   * Empty state for filtered results.
   */
  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    if (error && bookings.length === 0) {
      return (
        <ErrorState
          message={error}
          onRetry={() => {
            void fetchBookings();
          }}
        />
      );
    }

    const hasFilter =
      activeFilter !== 'all';

    return (
      <EmptyState
        icon={CalendarDays}
        title={
          hasFilter
            ? `No ${activeFilter} bookings`
            : 'No Appointments Yet'
        }
        message={
          hasFilter
            ? 'There are no bookings matching this status.'
            : 'Book your first appointment with one of our trusted doctors.'
        }
        actionTitle={
          hasFilter
            ? 'View All Bookings'
            : 'Book Appointment'
        }
        onAction={
          hasFilter
            ? () => setActiveFilter('all')
            : handleBookAppointment
        }
      />
    );
  };

  /**
   * Header.
   */
  const renderHeader = () => (
    <View>
      {isDiwali && (
        <View
          style={[
            styles.festivalBanner,
            {
              backgroundColor:
                colors.secondary,
            },
          ]}>
          <Sparkles
            size={18}
            color={colors.primary}
          />

          <Text
            style={[
              styles.festivalText,
              {color: colors.primary},
            ]}>
            Wishing you a healthy Diwali!
          </Text>
        </View>
      )}

      <View style={styles.headingRow}>
        <View style={styles.headingInfo}>
          <Text
            style={[
              styles.screenTitle,
              {color: colors.textPrimary},
            ]}>
            My Bookings
          </Text>

          <Text
            style={[
              styles.screenSubtitle,
              {color: colors.textSecondary},
            ]}>
            Manage your doctor appointments
          </Text>
        </View>

        <Pressable
          onPress={handleBookAppointment}
          accessibilityRole="button"
          accessibilityLabel="Book new appointment"
          style={[
            styles.addButton,
            {
              backgroundColor:
                colors.primary,
            },
          ]}>
          <CalendarPlus
            size={21}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={item => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filterContainer
        }
        renderItem={({item}) => {
          const selected =
            activeFilter === item.key;

          return (
            <Pressable
              onPress={() =>
                setActiveFilter(item.key)
              }
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.surface,
                  borderColor: selected
                    ? colors.primary
                    : '#E2E8F0',
                },
              ]}>
              <Text
                style={[
                  styles.filterText,
                  {
                    color: selected
                      ? '#FFFFFF'
                      : colors.textSecondary,
                  },
                ]}>
                {item.label}
              </Text>

              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: selected
                      ? 'rgba(255,255,255,0.2)'
                      : colors.secondary,
                  },
                ]}>
                <Text
                  style={[
                    styles.countText,
                    {
                      color: selected
                        ? '#FFFFFF'
                        : colors.primary,
                    },
                  ]}>
                  {counts[item.key]}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      {error && bookings.length > 0 && (
        <View style={styles.inlineError}>
          <AlertCircle
            size={17}
            color="#B91C1C"
          />

          <Text style={styles.inlineErrorText}>
            {error}
          </Text>

          <Pressable
            onPress={() => {
              void fetchBookings(true);
            }}
            accessibilityRole="button">
            <RefreshCw
              size={18}
              color="#B91C1C"
            />
          </Pressable>
        </View>
      )}

      {!loading && (
        <Text
          style={[
            styles.resultsText,
            {color: colors.textSecondary},
          ]}>
          {filteredBookings.length}
          {' '}
          {filteredBookings.length === 1
            ? 'appointment'
            : 'appointments'}
        </Text>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background},
      ]}>
      {loading && bookings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingHeading}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

            <Text
              style={[
                styles.loadingText,
                {color: colors.textSecondary},
              ]}>
              Loading appointments...
            </Text>
          </View>

          <BookingSkeleton />
          <BookingSkeleton />
          <BookingSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item =>
            item.booking.id
          }
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            styles.listContent
          }
          ItemSeparatorComponent={() => (
            <View style={styles.itemSeparator} />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  listContent: {
    padding: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },

  festivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    padding: 13,
    marginBottom: 18,
  },

  festivalText: {
    fontSize: 12,
    fontWeight: '700',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  headingInfo: {
    flex: 1,
  },

  screenTitle: {
    fontSize: 25,
    fontWeight: '800',
  },

  screenSubtitle: {
    fontSize: 12,
    marginTop: 5,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 15,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },

  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 10,
    fontWeight: '800',
  },

  resultsText: {
    fontSize: 12,
    marginBottom: 15,
  },

  bookingCard: {
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doctorInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 5,
  },

  doctorName: {
    fontSize: 14,
    fontWeight: '800',
  },

  doctorSpecialty: {
    fontSize: 11,
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  detailsContainer: {
    gap: 11,
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  detailText: {
    flex: 1,
    fontSize: 12,
  },

  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  bookingId: {
    flex: 1,
    fontSize: 10,
  },

  upcomingBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  upcomingText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  createdAt: {
    flex: 1,
    fontSize: 10,
  },

  bookAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  bookAgainText: {
    fontSize: 12,
    fontWeight: '800',
  },

  itemSeparator: {
    height: 13,
  },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    gap: 9,
    marginBottom: 14,
  },

  inlineErrorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 11,
  },

  loadingContainer: {
    padding: 16,
  },

  loadingHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  loadingText: {
    fontSize: 12,
  },

  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },

  skeletonInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 9,
  },

  skeletonLineLarge: {
    width: '75%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },

  skeletonLineMedium: {
    width: '65%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },

  skeletonLineSmall: {
    width: '45%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },

  skeletonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
});
