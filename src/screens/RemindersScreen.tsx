
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Info,
  Moon,
  Pill,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react-native';

import {mockApi} from '../api/mockApi';

import type {Prescription} from '../types/prescription';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import {useAppConfig} from '../hooks/useAppConfig';

import {
  createConfigTheme,
} from '../theme/theme';

import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

/* =====================================================
   TYPES
===================================================== */

type RemindersNavigation =
  NavigationProp<RootStackParamList>;

type TimePeriod =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

interface MedicineReminder {
  id: string;
  prescriptionId: string;
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  time: string;
  period: TimePeriod;
  doctorName: string;
}

interface ReminderGroup {
  period: TimePeriod;
  title: string;
  subtitle: string;
  medicines: MedicineReminder[];
}

type TakenStatus = Record<string, boolean>;

type ReminderColors = ReturnType<
  typeof createConfigTheme
>['colors'];

interface ReminderCardProps {
  reminder: MedicineReminder;
  taken: boolean;
  disabled: boolean;
  colors: ReminderColors;
  onToggle: () => void;
  onOpenPrescription: () => void;
}

/* =====================================================
   CONSTANTS
===================================================== */

const STORAGE_PREFIX =
  '@tapza/medicine-taken/';

const DOSE_STORAGE_PREFIX =
  '@tapza/reminder-doses/';

const PERIOD_ORDER: TimePeriod[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
];

const PERIOD_DETAILS: Record<
  TimePeriod,
  {title: string; subtitle: string}
> = {
  morning: {
    title: 'Morning',
    subtitle: '6:00 AM – 11:59 AM',
  },
  afternoon: {
    title: 'Afternoon',
    subtitle: '12:00 PM – 4:59 PM',
  },
  evening: {
    title: 'Evening',
    subtitle: '5:00 PM – 8:59 PM',
  },
  night: {
    title: 'Night',
    subtitle: '9:00 PM – 5:59 AM',
  },
};

const UI_COLORS = {
  border: '#E2E8F0',
  success: '#15803D',
  successLight: '#DCFCE7',
  successBorder: '#86EFAC',
  error: '#B91C1C',
  errorLight: '#FEF2F2',
  white: '#FFFFFF',
  instructions: '#F8FAFC',
};

/* =====================================================
   SAFE DATA HELPERS
===================================================== */

function asRecord(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function readString(
  data: Record<string, unknown>,
  keys: string[],
  fallback = '',
): string {
  for (const key of keys) {
    const value = data[key];

    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim();
    }

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return String(value);
    }
  }

  return fallback;
}

function getTodayKey(): string {
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

function formatToday(): string {
  return new Date().toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );
}

/* =====================================================
   TIME HELPERS
===================================================== */

function parseTime(
  value: string,
): number | null {
  const input = value.trim().toUpperCase();

  const match = input.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
  );

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  const meridiem = match[3];

  if (minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    hour %= 12;

    if (meridiem === 'PM') {
      hour += 12;
    }
  } else if (hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

function formatTime(
  minutes: number,
): string {
  const hours24 = Math.floor(
    minutes / 60,
  );

  const minutesValue = minutes % 60;

  const suffix =
    hours24 >= 12 ? 'PM' : 'AM';

  const hours12 =
    hours24 % 12 || 12;

  return (
    `${hours12}:` +
    `${String(minutesValue).padStart(2, '0')}` +
    ` ${suffix}`
  );
}

function getPeriod(
  minutes: number,
): TimePeriod {
  const hour = Math.floor(
    minutes / 60,
  );

  if (hour >= 6 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 21) {
    return 'evening';
  }

  return 'night';
}

/* =====================================================
   MEDICINE SCHEDULE
===================================================== */

function getScheduledTimes(
  medicine: Record<string, unknown>,
): number[] {
  const timing = readString(
    medicine,
    ['timing', 'time', 'takeAt'],
  );

  const frequency = readString(
    medicine,
    ['frequency', 'schedule'],
  );

  const explicitTimes: number[] = [];

  if (timing) {
    const parts = timing.split(/[,;|]/);

    for (const part of parts) {
      const parsed = parseTime(part);

      if (parsed !== null) {
        explicitTimes.push(parsed);
      }
    }

    if (explicitTimes.length > 0) {
      return Array.from(
        new Set(explicitTimes),
      ).sort((a, b) => a - b);
    }
  }

  // These are illustrative times only.
  // Actual prescription times take priority.
  const source =
    `${timing} ${frequency}`.toLowerCase();

  const periods: number[] = [];

  if (/\bmorning\b/.test(source)) {
    periods.push(8 * 60);
  }

  if (/\bafternoon\b/.test(source)) {
    periods.push(13 * 60);
  }

  if (/\bevening\b/.test(source)) {
    periods.push(18 * 60);
  }

  if (/\bnight\b|\bbedtime\b/.test(source)) {
    periods.push(21 * 60);
  }

  return Array.from(
    new Set(periods),
  ).sort((a, b) => a - b);
}

/* =====================================================
   BUILD REMINDERS
===================================================== */

function buildReminders(
  prescriptions: Prescription[],
): MedicineReminder[] {
  const reminders: MedicineReminder[] = [];

  for (const prescription of prescriptions) {
    const data = asRecord(prescription);

    const prescriptionId = readString(
      data,
      ['id', 'prescriptionId'],
    );

    if (!prescriptionId) {
      continue;
    }

    const doctor = asRecord(
      data.doctor,
    );

    const doctorName = readString(
      data,
      ['doctorName', 'doctor_name'],
      readString(
        doctor,
        ['name'],
        'Consulting Doctor',
      ),
    );

    const rawMedicines =
      data.medicines ??
      data.medications ??
      [];

    if (!Array.isArray(rawMedicines)) {
      continue;
    }

    rawMedicines.forEach(
      (rawMedicine, index) => {
        const medicine = asRecord(
          rawMedicine,
        );

        const medicineId = readString(
          medicine,
          [
            'id',
            'medicineId',
            'medicine_id',
          ],
          `medicine-${index}`,
        );

        const name = readString(
          medicine,
          [
            'name',
            'medicineName',
            'medicine_name',
          ],
          `Medicine ${index + 1}`,
        );

        const dosage = readString(
          medicine,
          ['dosage', 'dose', 'strength'],
          'As prescribed',
        );

        const frequency = readString(
          medicine,
          ['frequency', 'schedule'],
          'As directed',
        );

        const instructions = readString(
          medicine,
          [
            'instructions',
            'instruction',
            'notes',
          ],
        );

        const times = getScheduledTimes(
          medicine,
        );

        times.forEach(minutes => {
          const period = getPeriod(
            minutes,
          );

          const time = formatTime(
            minutes,
          );

          reminders.push({
            id:
              `${prescriptionId}/` +
              `${medicineId}/` +
              `${minutes}`,
            prescriptionId,
            medicineId,
            name,
            dosage,
            frequency,
            instructions,
            time,
            period,
            doctorName,
          });
        });
      },
    );
  }

  return reminders.sort(
    (a, b) =>
      (parseTime(a.time) ?? 0) -
      (parseTime(b.time) ?? 0),
  );
}

/* =====================================================
   STORAGE HELPERS
===================================================== */

function getDoseStorageKey(
  dateKey: string,
): string {
  return `${DOSE_STORAGE_PREFIX}${dateKey}`;
}

function getPrescriptionStorageKey(
  prescriptionId: string,
  dateKey: string,
): string {
  return (
    `${STORAGE_PREFIX}` +
    `${prescriptionId}/${dateKey}`
  );
}

function parseTakenStatus(
  raw: string | null,
): TakenStatus {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown =
      JSON.parse(raw);

    const record = asRecord(parsed);
    const result: TakenStatus = {};

    Object.entries(record).forEach(
      ([key, value]) => {
        if (typeof value === 'boolean') {
          result[key] = value;
        }
      },
    );

    return result;
  } catch {
    return {};
  }
}

/**
 * Reads prescription-level status and
 * individual dose status.
 *
 * Individual dose status takes priority.
 */
async function readTakenStatus(
  reminders: MedicineReminder[],
  dateKey: string,
): Promise<TakenStatus> {
  const prescriptionIds = Array.from(
    new Set(
      reminders.map(
        item => item.prescriptionId,
      ),
    ),
  );

  const keys = prescriptionIds.map(
    id =>
      getPrescriptionStorageKey(
        id,
        dateKey,
      ),
  );

  /**
   * Fix for missing AsyncStorage.multiGet
   * typings in the installed package.
   */
  const storedValues: Array<
    [string, string | null]
  > = await Promise.all(
    keys.map(
      async (
        key,
      ): Promise<
        [string, string | null]
      > => {
        const value =
          await AsyncStorage.getItem(key);

        return [key, value];
      },
    ),
  );

  const combined: TakenStatus = {};

  storedValues.forEach(
    ([key, value]) => {
      const record =
        parseTakenStatus(value);

      const prescriptionId = key
        .slice(STORAGE_PREFIX.length)
        .split('/')[0];

      const matchingReminders =
        reminders.filter(
          item =>
            item.prescriptionId ===
            prescriptionId,
        );

      matchingReminders.forEach(item => {
        const medicineDoseCount =
          matchingReminders.filter(
            candidate =>
              candidate.medicineId ===
              item.medicineId,
          ).length;

        if (
          medicineDoseCount === 1 &&
          record[item.medicineId] === true
        ) {
          combined[item.id] = true;
        }
      });
    },
  );

  const doseStored =
    await AsyncStorage.getItem(
      getDoseStorageKey(dateKey),
    );

  const doseStatus =
    parseTakenStatus(doseStored);

  return {
    ...combined,
    ...doseStatus,
  };
}

/* =====================================================
   PERIOD ICON
===================================================== */

function PeriodIcon({
  period,
  color,
}: {
  period: TimePeriod;
  color: string;
}) {
  switch (period) {
    case 'morning':
      return (
        <Sunrise
          size={21}
          color={color}
        />
      );

    case 'afternoon':
      return (
        <Sun
          size={21}
          color={color}
        />
      );

    case 'evening':
      return (
        <Sunset
          size={21}
          color={color}
        />
      );

    case 'night':
      return (
        <Moon
          size={21}
          color={color}
        />
      );
  }
}

/* =====================================================
   REMINDER CARD
===================================================== */

const ReminderCard = memo(
  function ReminderCard({
    reminder,
    taken,
    disabled,
    colors,
    onToggle,
    onOpenPrescription,
  }: ReminderCardProps) {
    return (
      <View
        style={[
          styles.reminderCard,
          {
            backgroundColor:
              colors.surface,
            borderColor: taken
              ? UI_COLORS.successBorder
              : UI_COLORS.border,
          },
        ]}>
        <View style={styles.reminderTop}>
          <View
            style={[
              styles.pillIcon,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <Pill
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.reminderInfo}>
            <Text
              style={[
                styles.medicineName,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              {reminder.name}
            </Text>

            <Text
              style={[
                styles.dosageText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {reminder.dosage}
            </Text>
          </View>

          {taken && (
            <CheckCircle2
              size={22}
              color={UI_COLORS.success}
            />
          )}
        </View>

        <View style={styles.reminderDivider} />

        <View style={styles.detailRow}>
          <Clock3
            size={16}
            color={colors.primary}
          />

          <Text
            style={[
              styles.detailText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {reminder.time}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <CalendarDays
            size={16}
            color={colors.primary}
          />

          <Text
            style={[
              styles.detailText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {reminder.frequency}
          </Text>
        </View>

        {reminder.instructions.length >
          0 && (
          <View style={styles.instructionsBox}>
            <Info
              size={15}
              color={colors.primary}
            />

            <Text
              style={[
                styles.instructionsText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {reminder.instructions}
            </Text>
          </View>
        )}

        <View style={styles.reminderActions}>
          <Pressable
            onPress={onToggle}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: taken,
              disabled,
            }}
            accessibilityLabel={
              `${reminder.name} at ` +
              `${reminder.time}: ` +
              (taken
                ? 'mark not taken'
                : 'mark taken')
            }
            style={({pressed}) => [
              styles.takenButton,
              {
                backgroundColor: taken
                  ? UI_COLORS.successLight
                  : colors.primary,
                opacity: disabled
                  ? 0.5
                  : pressed
                    ? 0.8
                    : 1,
              },
            ]}>
            {taken ? (
              <CheckCircle2
                size={18}
                color={UI_COLORS.success}
              />
            ) : (
              <Circle
                size={18}
                color={UI_COLORS.white}
              />
            )}

            <Text
              style={[
                styles.takenButtonText,
                {
                  color: taken
                    ? UI_COLORS.success
                    : UI_COLORS.white,
                },
              ]}>
              {taken
                ? 'Taken'
                : 'Mark as Taken'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onOpenPrescription}
            accessibilityRole="button"
            accessibilityLabel={
              `View prescription for ${reminder.name}`
            }
            style={({pressed}) => [
              styles.detailButton,
              {
                borderColor:
                  colors.primary,
                opacity: pressed
                  ? 0.7
                  : 1,
              },
            ]}>
            <ClipboardList
              size={17}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>
    );
  },
);

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function RemindersScreen() {
  const navigation =
    useNavigation<RemindersNavigation>();

  const {config, mode} =
    useAppConfig();

  const theme = useMemo(
    () =>
      createConfigTheme(
        mode,
        config?.theme,
      ),
    [mode, config?.theme],
  );

  const {colors} = theme;

  const isDiwali =
    mode === 'diwali';

  const [reminders, setReminders] =
    useState<MedicineReminder[]>([]);

  const [takenStatus, setTakenStatus] =
    useState<TakenStatus>({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [trackingLoading, setTrackingLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [trackingError, setTrackingError] =
    useState<string | null>(null);

  const [todayKey, setTodayKey] =
    useState(getTodayKey);

  const requestIdRef =
    useRef(0);

  const trackingRequestRef =
    useRef(0);

  const mountedRef =
    useRef(false);

  const takenStatusRef =
    useRef<TakenStatus>({});

  const savingRef =
    useRef(false);

  /* ---------------------------------------------------
     LOAD TRACKING STATUS
  --------------------------------------------------- */

  const loadTakenStatus =
    useCallback(
      async (
        currentReminders:
          MedicineReminder[],
        dateKey: string,
      ): Promise<void> => {
        const trackingRequestId =
          ++trackingRequestRef.current;

        if (mountedRef.current) {
          setTrackingLoading(true);
          setTrackingError(null);
        }

        try {
          const combined =
            await readTakenStatus(
              currentReminders,
              dateKey,
            );

          if (
            !mountedRef.current ||
            trackingRequestId !==
              trackingRequestRef.current
          ) {
            return;
          }

          takenStatusRef.current =
            combined;

          setTakenStatus(combined);
        } catch (err) {
          console.warn(
            '[Reminders] Tracking load failed:',
            err,
          );

          if (
            mountedRef.current &&
            trackingRequestId ===
              trackingRequestRef.current
          ) {
            setTrackingError(
              'Unable to restore medicine status.',
            );
          }
        } finally {
          if (
            mountedRef.current &&
            trackingRequestId ===
              trackingRequestRef.current
          ) {
            setTrackingLoading(false);
          }
        }
      },
      [],
    );

  /* ---------------------------------------------------
     FETCH REMINDERS
  --------------------------------------------------- */

  const fetchReminders =
    useCallback(
      async (
        isRefresh = false,
      ): Promise<void> => {
        const requestId =
          ++requestIdRef.current;

        if (mountedRef.current) {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError(null);
        }

        try {
          const prescriptions =
            await mockApi.getPrescriptions();

          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          if (
            !Array.isArray(prescriptions)
          ) {
            throw new Error(
              'Invalid prescription response.',
            );
          }

          const mapped =
            buildReminders(
              prescriptions,
            );

          const currentDay =
            getTodayKey();

          setTodayKey(currentDay);
          setReminders(mapped);

          await loadTakenStatus(
            mapped,
            currentDay,
          );
        } catch (err) {
          if (
            mountedRef.current &&
            requestId ===
              requestIdRef.current
          ) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load reminders.',
            );
          }
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              requestIdRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [loadTakenStatus],
    );

  /* ---------------------------------------------------
     MOUNT / UNMOUNT
  --------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    void fetchReminders();

    return () => {
      mountedRef.current = false;

      requestIdRef.current += 1;
      trackingRequestRef.current += 1;
    };
  }, [fetchReminders]);

  /* ---------------------------------------------------
     REFRESH TRACKING ON SCREEN FOCUS
  --------------------------------------------------- */

  useFocusEffect(
    useCallback(() => {
      const currentDay =
        getTodayKey();

      if (
        currentDay !== todayKey
      ) {
        setTodayKey(currentDay);

        void fetchReminders(true);
      } else if (
        !loading &&
        !savingRef.current
      ) {
        void loadTakenStatus(
          reminders,
          currentDay,
        );
      }

      return undefined;
    }, [
      todayKey,
      loading,
      reminders,
      fetchReminders,
      loadTakenStatus,
    ]),
  );

  /* ---------------------------------------------------
     SAVE TAKEN STATUS
  --------------------------------------------------- */

  const handleToggleTaken =
    useCallback(
      async (
        reminder: MedicineReminder,
      ): Promise<void> => {
        if (
          trackingLoading ||
          savingRef.current
        ) {
          return;
        }

        const currentDay =
          getTodayKey();

        if (
          currentDay !== todayKey
        ) {
          setTodayKey(currentDay);

          void fetchReminders(true);
          return;
        }

        savingRef.current = true;
        setTrackingError(null);

        const previous = {
          ...takenStatusRef.current,
        };

        const next: TakenStatus = {
          ...previous,
          [reminder.id]:
            !previous[reminder.id],
        };

        takenStatusRef.current =
          next;

        setTakenStatus(next);

        const doseKey =
          getDoseStorageKey(
            currentDay,
          );

        const prescriptionKey =
          getPrescriptionStorageKey(
            reminder.prescriptionId,
            currentDay,
          );

        let previousDoseRaw:
          string | null = null;

        let previousPrescriptionRaw:
          string | null = null;

        let doseSaved = false;
        let prescriptionSaved = false;

        try {
          previousDoseRaw =
            await AsyncStorage.getItem(
              doseKey,
            );

          const matchingDoses =
            reminders.filter(
              item =>
                item.prescriptionId ===
                  reminder.prescriptionId &&
                item.medicineId ===
                  reminder.medicineId,
            );

          const shouldSyncPrescription =
            matchingDoses.length === 1;

          if (shouldSyncPrescription) {
            previousPrescriptionRaw =
              await AsyncStorage.getItem(
                prescriptionKey,
              );
          }

          await AsyncStorage.setItem(
            doseKey,
            JSON.stringify(next),
          );

          doseSaved = true;

          if (shouldSyncPrescription) {
            const previousData =
              parseTakenStatus(
                previousPrescriptionRaw,
              );

            const updated = {
              ...previousData,
              [reminder.medicineId]:
                next[reminder.id],
            };

            await AsyncStorage.setItem(
              prescriptionKey,
              JSON.stringify(updated),
            );

            prescriptionSaved = true;
          }
        } catch (err) {
          console.warn(
            '[Reminders] Save failed:',
            err,
          );

          takenStatusRef.current =
            previous;

          if (mountedRef.current) {
            setTakenStatus(previous);

            setTrackingError(
              'Unable to save medicine status. Please try again.',
            );
          }

          /**
           * Best-effort rollback of storage.
           */
          try {
            if (doseSaved) {
              if (
                previousDoseRaw === null
              ) {
                await AsyncStorage.removeItem(
                  doseKey,
                );
              } else {
                await AsyncStorage.setItem(
                  doseKey,
                  previousDoseRaw,
                );
              }
            }

            if (prescriptionSaved) {
              if (
                previousPrescriptionRaw ===
                null
              ) {
                await AsyncStorage.removeItem(
                  prescriptionKey,
                );
              } else {
                await AsyncStorage.setItem(
                  prescriptionKey,
                  previousPrescriptionRaw,
                );
              }
            }
          } catch (rollbackError) {
            console.warn(
              '[Reminders] Rollback failed:',
              rollbackError,
            );
          }
        } finally {
          savingRef.current = false;
        }
      },
      [
        trackingLoading,
        todayKey,
        reminders,
        fetchReminders,
      ],
    );

  /* ---------------------------------------------------
     GROUP REMINDERS
  --------------------------------------------------- */

  const groups =
    useMemo<ReminderGroup[]>(
      () =>
        PERIOD_ORDER.map(
          period => ({
            period,
            ...PERIOD_DETAILS[period],
            medicines:
              reminders.filter(
                item =>
                  item.period ===
                  period,
              ),
          }),
        ).filter(
          group =>
            group.medicines.length >
            0,
        ),
      [reminders],
    );

  /* ---------------------------------------------------
     DAILY PROGRESS
  --------------------------------------------------- */

  const progress = useMemo(() => {
    const total =
      reminders.length;

    const taken =
      reminders.filter(
        item =>
          takenStatus[
            item.id
          ] === true,
      ).length;

    return {
      total,
      taken,
      remaining:
        total - taken,
      percentage:
        total > 0
          ? Math.round(
              (taken / total) *
                100,
            )
          : 0,
    };
  }, [
    reminders,
    takenStatus,
  ]);

  /* ---------------------------------------------------
     NAVIGATION
  --------------------------------------------------- */

  const handleBack =
    useCallback(() => {
      if (
        navigation.canGoBack()
      ) {
        navigation.goBack();
      } else {
        navigation.navigate(
          'MainTabs',
          {
            screen:
              'Prescriptions',
          },
        );
      }
    }, [navigation]);

  const handleOpenPrescription =
    useCallback(
      (
        prescriptionId: string,
      ) => {
        navigation.navigate(
          'PrescriptionDetail',
          {
            prescriptionId,
          },
        );
      },
      [navigation],
    );

  const handleRefresh =
    useCallback(() => {
      setTodayKey(
        getTodayKey(),
      );

      void fetchReminders(true);
    }, [fetchReminders]);

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}>
      <StatusBar
        barStyle="dark-content"
      />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.surface,
          },
        ]}>
        <Pressable
          onPress={
            handleBack
          }
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={
            styles.headerButton
          }>
          <ArrowLeft
            size={23}
            color={
              colors.textPrimary
            }
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            {
              color:
                colors.textPrimary,
            },
          ]}>
          Medicine Reminders
        </Text>

        <View
          style={
            styles.headerButton
          }>
          <Bell
            size={21}
            color={
              colors.primary
            }
          />
        </View>
      </View>

      {/* LOADING */}

      {loading &&
      reminders.length === 0 ? (
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
            Loading medicine reminders...
          </Text>
        </View>
      ) : error &&
        reminders.length === 0 ? (
        <View
          style={
            styles.centerContainer
          }>
          <ErrorState
            message={error}
            onRetry={() => {
              void fetchReminders();
            }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              colors={[
                colors.primary,
              ]}
              tintColor={
                colors.primary
              }
            />
          }>

          {/* DIWALI BANNER */}

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
                size={19}
                color={
                  colors.primary
                }
              />

              <Text
                style={[
                  styles.festivalText,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                Stay on track with your
                medicines this Diwali!
              </Text>
            </View>
          )}

          {/* TODAY */}

          <View
            style={
              styles.titleRow
            }>
            <View
              style={
                styles.titleInfo
              }>
              <Text
                style={[
                  styles.pageTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                Today's Schedule
              </Text>

              <Text
                style={[
                  styles.dateText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {formatToday()}
              </Text>
            </View>

            <View
              style={[
                styles.calendarIcon,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              <CalendarDays
                size={23}
                color={
                  colors.primary
                }
              />
            </View>
          </View>

          {/* DAILY PROGRESS */}

          <View
            style={[
              styles.progressCard,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <View
              style={
                styles.progressHeader
              }>
              <View>
                <Text
                  style={[
                    styles.progressTitle,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}>
                  Daily Progress
                </Text>

                <Text
                  style={[
                    styles.progressSubtitle,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}>
                  {progress.taken} of{' '}
                  {progress.total}{' '}
                  scheduled doses taken
                </Text>
              </View>

              <Text
                style={[
                  styles.progressPercentage,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                {progress.percentage}%
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
              }>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      `${progress.percentage}%`,
                    backgroundColor:
                      colors.primary,
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.progressStats
              }>
              <View
                style={
                  styles.statItem
                }>
                <CheckCircle2
                  size={17}
                  color={
                    UI_COLORS.success
                  }
                />

                <Text
                  style={[
                    styles.statText,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}>
                  {progress.taken} Taken
                </Text>
              </View>

              <View
                style={
                  styles.statItem
                }>
                <Clock3
                  size={17}
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={[
                    styles.statText,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}>
                  {progress.remaining}{' '}
                  Remaining
                </Text>
              </View>
            </View>
          </View>

          {/* API ERROR */}

          {error &&
            reminders.length >
              0 && (
              <View
                style={
                  styles.errorBanner
                }>
                <AlertCircle
                  size={17}
                  color={
                    UI_COLORS.error
                  }
                />

                <Text
                  style={
                    styles.errorText
                  }>
                  {error}
                </Text>

                <Pressable
                  onPress={
                    handleRefresh
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading reminders"
                  style={
                    styles.errorRetryButton
                  }>
                  <RefreshCw
                    size={18}
                    color={
                      UI_COLORS.error
                    }
                  />
                </Pressable>
              </View>
            )}

          {/* TRACKING ERROR */}

          {trackingError && (
            <View
              style={
                styles.errorBanner
              }>
              <AlertCircle
                size={17}
                color={
                  UI_COLORS.error
                }
              />

              <Text
                style={
                  styles.errorText
                }>
                {trackingError}
              </Text>
            </View>
          )}

          {/* EMPTY STATE */}

          {reminders.length ===
          0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}>
              <EmptyState
                icon={Pill}
                title="No Scheduled Medicines"
                message="No medicines with a recognizable time schedule were found in your prescriptions."
                actionTitle="View Prescriptions"
                onAction={() => {
                  navigation.navigate(
                    'MainTabs',
                    {
                      screen:
                        'Prescriptions',
                    },
                  );
                }}
              />
            </View>
          ) : (
            groups.map(group => (
              <View
                key={
                  group.period
                }
                style={
                  styles.periodSection
                }>

                {/* PERIOD HEADER */}

                <View
                  style={
                    styles.periodHeading
                  }>
                  <View
                    style={[
                      styles.periodIcon,
                      {
                        backgroundColor:
                          colors.secondary,
                      },
                    ]}>
                    <PeriodIcon
                      period={
                        group.period
                      }
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.periodInfo
                    }>
                    <Text
                      style={[
                        styles.periodTitle,
                        {
                          color:
                            colors.textPrimary,
                        },
                      ]}>
                      {group.title}
                    </Text>

                    <Text
                      style={[
                        styles.periodSubtitle,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}>
                      {group.subtitle}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.periodCount,
                      {
                        color:
                          colors.primary,
                      },
                    ]}>
                    {
                      group.medicines
                        .length
                    }
                  </Text>
                </View>

                {/* MEDICINE CARDS */}

                {group.medicines.map(
                  reminder => (
                    <ReminderCard
                      key={
                        reminder.id
                      }
                      reminder={
                        reminder
                      }
                      taken={
                        takenStatus[
                          reminder.id
                        ] === true
                      }
                      disabled={
                        trackingLoading
                      }
                      colors={
                        colors
                      }
                      onToggle={() => {
                        void handleToggleTaken(
                          reminder,
                        );
                      }}
                      onOpenPrescription={() => {
                        handleOpenPrescription(
                          reminder.prescriptionId,
                        );
                      }}
                    />
                  ),
                )}
              </View>
            ))
          )}

          {/* IMPORTANT NOTE */}

          <View
            style={
              styles.noteContainer
            }>
            <Info
              size={17}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.noteText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              This screen tracks medicines
              locally. The displayed time
              slots are illustrative unless
              explicit times were provided
              in the prescription. Always
              follow your doctor's actual
              instructions.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 60,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      UI_COLORS.border,
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 13,
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
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 20,
  },

  titleInfo: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 23,
    fontWeight: '800',
  },

  dateText: {
    fontSize: 12,
    marginTop: 7,
  },

  calendarIcon: {
    width: 49,
    height: 49,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressCard: {
    borderRadius: 17,
    padding: 17,
    marginBottom: 23,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  progressSubtitle: {
    fontSize: 11,
    marginTop: 6,
  },

  progressPercentage: {
    fontSize: 23,
    fontWeight: '800',
  },

  progressTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor:
      'rgba(0,0,0,0.09)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  progressStats: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    marginTop: 15,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  statText: {
    fontSize: 11,
    fontWeight: '700',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    backgroundColor:
      UI_COLORS.errorLight,
    borderRadius: 11,
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    fontSize: 11,
    color:
      UI_COLORS.error,
  },

  errorRetryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor:
      UI_COLORS.border,
  },

  periodSection: {
    marginBottom: 19,
  },

  periodHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  periodIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  periodInfo: {
    flex: 1,
    marginLeft: 11,
  },

  periodTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  periodSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },

  periodCount: {
    fontSize: 14,
    fontWeight: '800',
  },

  reminderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },

  reminderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  pillIcon: {
    width: 47,
    height: 47,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderInfo: {
    flex: 1,
    marginLeft: 12,
  },

  medicineName: {
    fontSize: 14,
    fontWeight: '800',
  },

  dosageText: {
    fontSize: 11,
    marginTop: 5,
  },

  reminderDivider: {
    height: 1,
    backgroundColor:
      UI_COLORS.border,
    marginVertical: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 11,
  },

  detailText: {
    fontSize: 12,
  },

  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor:
      UI_COLORS.instructions,
    padding: 11,
    borderRadius: 10,
    marginBottom: 13,
  },

  instructionsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },

  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },

  takenButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  takenButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  detailButton: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 10,
    paddingHorizontal: 5,
  },

  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },
});
