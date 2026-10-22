
import React, {memo, useEffect} from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  Check,
  CalendarDays,
  Clock3,
  UserRound,
  ArrowRight,
} from 'lucide-react-native';

import type {Booking, Doctor, Slot} from '../../types/doctor';

interface BookingSuccessProps {
  booking: Booking;
  doctor: Doctor;
  slot: Slot;
  onDone: () => void;
  primaryColor?: string;
}

const DEFAULT_PRIMARY_COLOR = '#2563EB';

function formatAppointmentDate(dateTime: string): string {
  const datePart = dateTime.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return datePart;
  }

  return new Date(year, month - 1, day).toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );
}

function formatAppointmentTime(dateTime: string): string {
  const timePart = dateTime.split('T')[1]?.slice(0, 5);

  if (!timePart) {
    return '--:--';
  }

  const [hours, minutes] = timePart.split(':').map(Number);

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function BookingSuccess({
  booking,
  doctor,
  slot,
  onDone,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: BookingSuccessProps) {
  const circleScale = useSharedValue(0.5);
  const circleOpacity = useSharedValue(0);

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);

  useEffect(() => {
    circleScale.value = withSpring(1, {
      damping: 12,
      stiffness: 130,
    });

    circleOpacity.value = withTiming(1, {
      duration: 300,
    });

    checkScale.value = withDelay(
      220,
      withSpring(1, {
        damping: 10,
        stiffness: 160,
      }),
    );

    checkOpacity.value = withDelay(
      220,
      withTiming(1, {
        duration: 220,
      }),
    );

    contentOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      }),
    );

    contentTranslateY.value = withDelay(
      300,
      withTiming(0, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [
    checkOpacity,
    checkScale,
    circleOpacity,
    circleScale,
    contentOpacity,
    contentTranslateY,
  ]);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: circleScale.value}],
    opacity: circleOpacity.value,
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: checkScale.value}],
    opacity: checkOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      {translateY: contentTranslateY.value},
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.successCircle,
              circleAnimatedStyle,
            ]}>
            <Animated.View
              style={checkAnimatedStyle}>
              <Check
                size={54}
                strokeWidth={3}
                color="#FFFFFF"
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.detailsContainer,
            contentAnimatedStyle,
          ]}>
          <Text style={styles.successTitle}>
            Booking Confirmed!
          </Text>

          <Text style={styles.successDescription}>
            Your appointment has been booked
            successfully. We look forward to seeing you!
          </Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              Confirmed
            </Text>
          </View>

          <View style={styles.appointmentCard}>
            <Text style={styles.cardHeading}>
              Appointment Details
            </Text>

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <UserRound
                  size={19}
                  color={primaryColor}
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Doctor
                </Text>

                <Text style={styles.detailValue}>
                  {doctor.name}
                </Text>

                <Text style={styles.detailSecondary}>
                  {doctor.specialty}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <CalendarDays
                  size={19}
                  color={primaryColor}
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Appointment Date
                </Text>

                <Text style={styles.detailValue}>
                  {formatAppointmentDate(slot.startsAt)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Clock3
                  size={19}
                  color={primaryColor}
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Appointment Time
                </Text>

                <Text style={styles.detailValue}>
                  {formatAppointmentTime(slot.startsAt)}
                  {' - '}
                  {formatAppointmentTime(slot.endsAt)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bookingIdRow}>
              <Text style={styles.bookingIdLabel}>
                Booking ID
              </Text>

              <Text
                style={styles.bookingIdValue}
                selectable>
                {booking.id}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Please arrive 10 minutes before your
              scheduled appointment.
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="View my appointments"
          style={({pressed}) => [
            styles.doneButton,
            {backgroundColor: primaryColor},
            pressed && styles.pressedButton,
          ]}>
          <Text style={styles.doneButtonText}>
            View My Appointments
          </Text>

          <ArrowRight
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </View>
  );
}

export default memo(BookingSuccess);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  detailsContainer: {
    alignItems: 'center',
  },

  successTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#172033',
    textAlign: 'center',
  },

  successDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 9,
    paddingHorizontal: 10,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 20,
    gap: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  appointmentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EDF3',
  },

  cardHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 18,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  detailContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },

  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  detailSecondary: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#EDF1F5',
    marginVertical: 14,
  },

  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  bookingIdLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  bookingIdValue: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },

  infoBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },

  infoText: {
    fontSize: 12,
    color: '#1D4ED8',
    textAlign: 'center',
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  doneButton: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  pressedButton: {
    opacity: 0.85,
  },
});
