
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import {
  Clock3,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Check,
  X,
} from 'lucide-react-native';

import {mockApi} from '../../api/mockApi';
import type {Slot} from '../../types/doctor';

interface SlotBottomSheetProps {
  visible: boolean;
  doctorId: string;
  selectedDate: string;
  onClose: () => void;
  onSlotSelect: (slot: Slot) => void;
  primaryColor?: string;
  selectedSlotId?: string | null;
}

const DEFAULT_PRIMARY = '#2563EB';

function formatTime(dateTime: string): string {
  const time = dateTime.split('T')[1]?.slice(0, 5);

  if (!time) {
    return '--:--';
  }

  const [hours, minutes] = time.split(':').map(Number);

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatDisplayDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SlotBottomSheet({
  visible,
  doctorId,
  selectedDate,
  onClose,
  onSlotSelect,
  primaryColor = DEFAULT_PRIMARY,
  selectedSlotId = null,
}: SlotBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const requestIdRef = useRef(0);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localSelectedSlotId, setLocalSelectedSlotId] =
    useState<string | null>(selectedSlotId);

  const snapPoints = useMemo(() => ['65%', '90%'], []);

  const loadSlots = useCallback(async () => {
    if (!doctorId || !selectedDate) {
      return;
    }

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await mockApi.getSlots(
        doctorId,
        selectedDate,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSlots(response);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load appointment slots.',
      );

      setSlots([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [doctorId, selectedDate]);

  useEffect(() => {
    if (visible) {
      setLocalSelectedSlotId(selectedSlotId);
      bottomSheetRef.current?.snapToIndex(0);
      void loadSlots();
    } else {
      requestIdRef.current += 1;
      bottomSheetRef.current?.close();
    }
  }, [visible, selectedSlotId, loadSlots]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const availableSlots = useMemo(
    () => slots.filter(slot => slot.available),
    [slots],
  );

  const selectedSlot = useMemo(
    () =>
      slots.find(
        slot =>
          slot.id === localSelectedSlotId &&
          slot.available,
      ) ?? null,
    [slots, localSelectedSlotId],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) {
      return;
    }

    onSlotSelect(selectedSlot);
    onClose();
  }, [selectedSlot, onSlotSelect, onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1 && visible) {
        onClose();
      }
    },
    [onClose, visible],
  );

  const renderSlot = (slot: Slot) => {
    const isSelected =
      localSelectedSlotId === slot.id;

    const isUnavailable = !slot.available;

    return (
      <Pressable
        key={slot.id}
        disabled={isUnavailable}
        onPress={() =>
          setLocalSelectedSlotId(slot.id)
        }
        accessibilityRole="button"
        accessibilityLabel={
          `${formatTime(slot.startsAt)} to ` +
          `${formatTime(slot.endsAt)}` +
          (isUnavailable ? ', unavailable' : '')
        }
        accessibilityState={{
          selected: isSelected,
          disabled: isUnavailable,
        }}
        style={({pressed}) => [
          styles.slotCard,
          isSelected && {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
          },
          isUnavailable && styles.unavailableSlot,
          pressed && !isUnavailable && styles.pressedSlot,
        ]}>
        <Text
          style={[
            styles.slotTime,
            isSelected && styles.selectedSlotText,
            isUnavailable && styles.unavailableText,
          ]}>
          {formatTime(slot.startsAt)}
        </Text>

        <Text
          style={[
            styles.slotEndTime,
            isSelected && styles.selectedSlotText,
          ]}>
          {formatTime(slot.endsAt)}
        </Text>

        {isSelected && (
          <Check
            size={16}
            color="#FFFFFF"
            style={styles.checkIcon}
          />
        )}

        {isUnavailable && (
          <Text style={styles.bookedLabel}>
            Booked
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            Select Time Slot
          </Text>

          <Text style={styles.subtitle}>
            Choose an available appointment time
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close time slot selector"
          style={styles.closeButton}>
          <X size={20} color="#334155" />
        </Pressable>
      </View>

      <View style={styles.dateInfo}>
        <CalendarDays
          size={18}
          color={primaryColor}
        />

        <Text style={styles.dateText}>
          {formatDisplayDate(selectedDate)}
        </Text>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={primaryColor}
            />

            <Text style={styles.infoText}>
              Checking available slots...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <AlertCircle
              size={40}
              color="#DC2626"
            />

            <Text style={styles.messageTitle}>
              Unable to load slots
            </Text>

            <Text style={styles.infoText}>
              {error}
            </Text>

            <Pressable
              onPress={() => void loadSlots()}
              accessibilityRole="button"
              style={[
                styles.retryButton,
                {backgroundColor: primaryColor},
              ]}>
              <RefreshCw size={16} color="#FFFFFF" />

              <Text style={styles.retryText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.messageContainer}>
            <Clock3 size={40} color="#94A3B8" />

            <Text style={styles.messageTitle}>
              No slots available
            </Text>

            <Text style={styles.infoText}>
              Please select another appointment date.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.availabilityRow}>
              <Text style={styles.sectionTitle}>
                Available Time Slots
              </Text>

              <Text style={styles.availableCount}>
                {availableSlots.length} available
              </Text>
            </View>

            <View style={styles.slotGrid}>
              {slots.map(renderSlot)}
            </View>

            {availableSlots.length === 0 && (
              <Text style={styles.noAvailableText}>
                All slots are booked. Please choose
                another date.
              </Text>
            )}
          </>
        )}
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionLabel}>
            Selected Time
          </Text>

          <Text style={styles.selectionValue}>
            {selectedSlot
              ? formatTime(selectedSlot.startsAt)
              : 'Not selected'}
          </Text>
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedSlot || loading}
          accessibilityRole="button"
          accessibilityState={{
            disabled: !selectedSlot || loading,
          }}
          style={[
            styles.confirmButton,
            {backgroundColor: primaryColor},
            (!selectedSlot || loading) &&
              styles.disabledConfirmButton,
          ]}>
          <Text style={styles.confirmText}>
            Confirm Slot
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export default memo(SlotBottomSheet);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  handleIndicator: {
    width: 42,
    height: 5,
    backgroundColor: '#CBD5E1',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#172033',
  },

  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateInfo: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
  },

  availableCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  slotCard: {
    width: '47%',
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  slotTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  slotEndTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },

  selectedSlotText: {
    color: '#FFFFFF',
  },

  unavailableSlot: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },

  unavailableText: {
    color: '#94A3B8',
  },

  bookedLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 4,
  },

  pressedSlot: {
    opacity: 0.8,
  },

  checkIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },

  loadingContainer: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },

  messageContainer: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },

  messageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172033',
    textAlign: 'center',
  },

  infoText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  noAvailableText: {
    marginTop: 18,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  selectionInfo: {
    flex: 1,
  },

  selectionLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  selectionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
    marginTop: 4,
  },

  confirmButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledConfirmButton: {
    opacity: 0.45,
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
