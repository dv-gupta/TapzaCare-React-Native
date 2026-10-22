
import React, {
  memo,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ScrollViewInstance,
} from 'react-native';

import {
  defaultColors,
  semanticColors,
  spacing,
  radius,
  fontSize,
  dimensions,
} from '../../theme/theme';

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  primaryColor?: string;
  daysToShow?: number;
  disabled?: boolean;
}

interface DateItem {
  date: string;
  dayName: string;
  dayNumber: string;
  monthName: string;
  isToday: boolean;
}

const DEFAULT_DAYS_TO_SHOW = 14;

const DATE_CARD_WIDTH = 73;
const DATE_CARD_GAP = 10;
const DATE_CARD_STEP =
  DATE_CARD_WIDTH + DATE_CARD_GAP;

const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/* =====================================================
   DATE HELPERS
===================================================== */

/**
 * Convert Date to local YYYY-MM-DD.
 *
 * Avoid toISOString() because UTC conversion
 * can change the selected calendar date.
 */
function formatLocalDate(
  date: Date,
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
 * Build appointment dates starting today.
 *
 * Uses calendar arithmetic rather than
 * adding 24-hour milliseconds.
 */
function buildDates(
  daysToShow: number,
  today: Date,
): DateItem[] {
  const result: DateItem[] = [];

  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  for (
    let index = 0;
    index < daysToShow;
    index++
  ) {
    const currentDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index,
    );

    result.push({
      date: formatLocalDate(
        currentDate,
      ),

      dayName:
        WEEKDAYS[currentDate.getDay()],

      dayNumber:
        String(currentDate.getDate()),

      monthName:
        MONTHS[currentDate.getMonth()],

      isToday: index === 0,
    });
  }

  return result;
}

/* =====================================================
   DATE SELECTOR COMPONENT
===================================================== */

function DateSelector({
  selectedDate,
  onDateSelect,
  primaryColor = defaultColors.primary,
  daysToShow = DEFAULT_DAYS_TO_SHOW,
  disabled = false,
}: DateSelectorProps) {
  /**
   * React Native 0.88.0:
   *
   * ScrollView is the component.
   * ScrollViewInstance is the ref type.
   *
   * Fixes:
   * TS2339: scrollTo does not exist
   * TS2322: RefObject type mismatch
   */
  const scrollViewRef =
    useRef<ScrollViewInstance>(null);

  /**
   * Capture today's date when mounted.
   */
  const today = useMemo(
    () => new Date(),
    [],
  );

  /**
   * Prevent invalid date count.
   */
  const safeDaysToShow =
    Number.isFinite(daysToShow)
      ? Math.max(
          1,
          Math.floor(daysToShow),
        )
      : DEFAULT_DAYS_TO_SHOW;

  const dates = useMemo(
    () =>
      buildDates(
        safeDaysToShow,
        today,
      ),
    [safeDaysToShow, today],
  );

  /**
   * Find selected date index.
   */
  const selectedIndex =
    dates.findIndex(
      item =>
        item.date === selectedDate,
    );

  /**
   * Scroll to selected date.
   */
  useEffect(() => {
    if (selectedIndex > 3) {
      const scrollX = Math.max(
        0,
        selectedIndex * DATE_CARD_STEP -
          DATE_CARD_STEP,
      );

      scrollViewRef.current?.scrollTo({
        x: scrollX,
        animated: true,
      });
    } else {
      scrollViewRef.current?.scrollTo({
        x: 0,
        animated: true,
      });
    }
  }, [selectedIndex]);

  return (
    <View
      style={styles.container}
      testID="date-selector">

      {/* Heading */}
      <View style={styles.headingRow}>
        <View>
          <Text
            style={styles.heading}
            allowFontScaling>
            Select Appointment Date
          </Text>

          <Text
            style={styles.subtitle}
            allowFontScaling>
            Choose your preferred
            consultation day
          </Text>
        </View>
      </View>

      {/* Horizontal Date List */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Available appointment dates">

        {dates.map(item => {
          const isSelected =
            item.date === selectedDate;

          return (
            <Pressable
              key={item.date}
              testID={`date-${item.date}`}
              disabled={disabled}
              onPress={() =>
                onDateSelect(item.date)
              }
              accessibilityRole="button"
              accessibilityLabel={
                `${item.dayName}, ` +
                `${item.dayNumber} ` +
                `${item.monthName}` +
                (item.isToday
                  ? ', today'
                  : '')
              }
              accessibilityHint="Select this date for your appointment"
              accessibilityState={{
                selected: isSelected,
                disabled,
              }}
              style={({pressed}) => [
                styles.dateCard,

                isSelected && {
                  backgroundColor:
                    primaryColor,

                  borderColor:
                    primaryColor,
                },

                disabled &&
                  styles.disabledCard,

                pressed &&
                  !disabled &&
                  styles.pressedCard,
              ]}>

              <Text
                style={[
                  styles.dayName,

                  isSelected &&
                    styles.selectedText,
                ]}
                allowFontScaling>
                {item.isToday
                  ? 'Today'
                  : item.dayName}
              </Text>

              <Text
                style={[
                  styles.dayNumber,

                  isSelected &&
                    styles.selectedText,
                ]}
                allowFontScaling>
                {item.dayNumber}
              </Text>

              <Text
                style={[
                  styles.monthName,

                  isSelected &&
                    styles.selectedText,
                ]}
                allowFontScaling>
                {item.monthName}
              </Text>

              {isSelected && (
                <View
                  style={
                    styles.selectedDot
                  }
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default memo(DateSelector);

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },

  headingRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  heading: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    color: defaultColors.textPrimary,
  },

  subtitle: {
    fontSize: fontSize.caption,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: DATE_CARD_GAP,
  },

  dateCard: {
    width: DATE_CARD_WIDTH,
    minHeight: 105,
    backgroundColor: defaultColors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },

  disabledCard: {
    opacity: 0.5,
  },

  pressedCard: {
    opacity: 0.8,
  },

  dayName: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: defaultColors.textSecondary,
  },

  dayNumber: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: defaultColors.textPrimary,
    marginVertical: spacing.xs,
  },

  monthName: {
    fontSize: fontSize.caption,
    fontWeight: '500',
    color: defaultColors.textSecondary,
  },

  selectedText: {
    color: semanticColors.white,
  },

  selectedDot: {
    position: 'absolute',
    bottom: 7,
    width: 5,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: semanticColors.white,
  },
});
