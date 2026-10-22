
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
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  type ViewStyle,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';

import {
  ArrowLeft,
  Pill,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Bell,
  Sparkles,
  FileText,
  Info,
  UserRound,
} from 'lucide-react-native';

import {mockApi} from '../api/mockApi';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import type {
  Prescription,
} from '../types/prescription';

import {useAppConfig} from '../hooks/useAppConfig';

import {defaultColors} from '../theme/theme';

import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

/* =====================================================
   TYPES
===================================================== */

type DetailRoute = RouteProp<
  RootStackParamList,
  'PrescriptionDetail'
>;

type DetailNavigation =
  NavigationProp<RootStackParamList>;

interface MedicineDisplay {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  timing: string;
}

interface PrescriptionDisplay {
  id: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  date: string;
  diagnosis: string;
  notes: string;
  medicines: MedicineDisplay[];
}

type TakenStatus = Record<string, boolean>;

/* =====================================================
   CONSTANTS
===================================================== */

const MEDICINE_STORAGE_PREFIX =
  '@tapza/medicine-taken/';

/* =====================================================
   HELPERS
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
  record: Record<string, unknown>,
  keys: string[],
  fallback = '',
): string {
  for (const key of keys) {
    const value = record[key];

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

function formatDate(value: string): string {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function mapMedicine(
  value: unknown,
  index: number,
): MedicineDisplay {
  const item = asRecord(value);

  return {
    id: readString(
      item,
      ['id', 'medicineId', 'medicine_id'],
      `medicine-${index}`,
    ),

    name: readString(
      item,
      ['name', 'medicineName', 'medicine_name'],
      `Medicine ${index + 1}`,
    ),

    dosage: readString(
      item,
      ['dosage', 'dose', 'strength'],
      'As prescribed',
    ),

    frequency: readString(
      item,
      ['frequency', 'schedule'],
      'As directed',
    ),

    duration: readString(
      item,
      ['duration', 'durationDays', 'days'],
      'As prescribed',
    ),

    instructions: readString(
      item,
      ['instructions', 'instruction', 'notes'],
    ),

    timing: readString(
      item,
      ['timing', 'time', 'takeAt'],
    ),
  };
}

function mapPrescription(
  prescription: Prescription,
): PrescriptionDisplay {
  const data = asRecord(prescription);

  const doctor = asRecord(data.doctor);
  const patient = asRecord(data.patient);

  const medicinesValue =
    data.medicines ?? data.medications ?? [];

  const medicines = Array.isArray(medicinesValue)
    ? medicinesValue.map(mapMedicine)
    : [];

  return {
    id: readString(
      data,
      ['id', 'prescriptionId'],
    ),

    doctorName: readString(
      data,
      ['doctorName', 'doctor_name'],
      readString(
        doctor,
        ['name'],
        'Consulting Doctor',
      ),
    ),

    specialty: readString(
      data,
      ['specialty', 'doctorSpecialty'],
      readString(
        doctor,
        ['specialty'],
        'Healthcare Consultation',
      ),
    ),

    patientName: readString(
      data,
      ['patientName', 'patient_name'],
      readString(
        patient,
        ['name'],
        'Patient',
      ),
    ),

    date: readString(
      data,
      [
        'issuedAt',
        'createdAt',
        'date',
        'prescriptionDate',
      ],
    ),

    diagnosis: readString(
      data,
      ['diagnosis', 'condition'],
    ),

    notes: readString(
      data,
      ['notes', 'doctorNotes', 'advice'],
    ),

    medicines,
  };
}

function parseTakenStatus(
  value: string | null,
): TakenStatus {
  if (!value) {
    return {};
  }

  const parsed: unknown = JSON.parse(value);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    return {};
  }

  const result: TakenStatus = {};

  Object.entries(parsed).forEach(
    ([key, status]) => {
      if (typeof status === 'boolean') {
        result[key] = status;
      }
    },
  );

  return result;
}

/* =====================================================
   DETAIL ROW
===================================================== */

function DetailRow({
  label,
  value,
  textColor,
  secondaryColor,
}: {
  label: string;
  value: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text
        style={[
          styles.detailLabel,
          {color: secondaryColor},
        ]}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          {color: textColor},
        ]}>
        {value}
      </Text>
    </View>
  );
}

/* =====================================================
   MEDICINE CARD
===================================================== */

function MedicineCard({
  medicine,
  index,
  taken,
  disabled,
  primaryColor,
  surfaceColor,
  secondaryColor,
  textColor,
  onToggle,
}: {
  medicine: MedicineDisplay;
  index: number;
  taken: boolean;
  disabled: boolean;
  primaryColor: string;
  surfaceColor: string;
  secondaryColor: string;
  textColor: string;
  onToggle: () => void;
}) {
  return (
    <View
      style={[
        styles.medicineCard,
        {
          backgroundColor: surfaceColor,
          borderColor: taken
            ? '#86EFAC'
            : '#E2E8F0',
        },
      ]}>
      <View style={styles.medicineHeader}>
        <View
          style={[
            styles.medicineIcon,
            {
              backgroundColor:
                `${primaryColor}15`,
            },
          ]}>
          <Pill
            size={22}
            color={primaryColor}
          />
        </View>

        <View style={styles.medicineHeading}>
          <Text
            style={[
              styles.medicineNumber,
              {color: secondaryColor},
            ]}>
            MEDICINE {index + 1}
          </Text>

          <Text
            style={[
              styles.medicineName,
              {color: textColor},
            ]}>
            {medicine.name}
          </Text>
        </View>

        {taken ? (
          <View style={styles.takenBadge}>
            <CheckCircle2
              size={13}
              color="#15803D"
            />
            <Text style={styles.takenBadgeText}>
              Taken
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.medicineDivider} />

      <DetailRow
        label="Dosage"
        value={medicine.dosage}
        textColor={textColor}
        secondaryColor={secondaryColor}
      />

      <DetailRow
        label="Frequency"
        value={medicine.frequency}
        textColor={textColor}
        secondaryColor={secondaryColor}
      />

      <DetailRow
        label="Duration"
        value={medicine.duration}
        textColor={textColor}
        secondaryColor={secondaryColor}
      />

      {medicine.timing ? (
        <DetailRow
          label="Timing"
          value={medicine.timing}
          textColor={textColor}
          secondaryColor={secondaryColor}
        />
      ) : null}

      {medicine.instructions ? (
        <View style={styles.instructionsContainer}>
          <Info
            size={15}
            color={primaryColor}
          />

          <Text
            style={[
              styles.instructionsText,
              {color: secondaryColor},
            ]}>
            {medicine.instructions}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: taken,
          disabled,
        }}
        accessibilityLabel={
          `${medicine.name}: ` +
          (taken
            ? 'mark as not taken'
            : 'mark as taken')
        }
        style={[
          styles.takenButton,
          {
            backgroundColor: taken
              ? '#DCFCE7'
              : primaryColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        {taken ? (
          <CheckCircle2
            size={19}
            color="#15803D"
          />
        ) : (
          <Circle
            size={19}
            color="#FFFFFF"
          />
        )}

        <Text
          style={[
            styles.takenButtonText,
            {
              color: taken
                ? '#15803D'
                : '#FFFFFF',
            },
          ]}>
          {taken
            ? 'Taken Today'
            : 'Mark as Taken'}
        </Text>
      </Pressable>
    </View>
  );
}

/* =====================================================
   PRESCRIPTION DETAIL SCREEN
===================================================== */

export default function PrescriptionDetailScreen() {
  const navigation =
    useNavigation<DetailNavigation>();

  const route =
    useRoute<DetailRoute>();

  const {prescriptionId} =
    route.params;

  const {config, mode} =
    useAppConfig();

  const colors =
    config?.theme ?? defaultColors;

  const isDiwali =
    mode === 'diwali';

  /* ---------------------------------------------------
     STATE
  --------------------------------------------------- */

  const [
    prescription,
    setPrescription,
  ] = useState<PrescriptionDisplay | null>(
    null,
  );

  const [
    takenMedicines,
    setTakenMedicines,
  ] = useState<TakenStatus>({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    trackingLoading,
    setTrackingLoading,
  ] = useState(true);

  const [
    trackingError,
    setTrackingError,
  ] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const savingRef = useRef(false);

  const trackingStorageKey = useMemo(
    () =>
      `${MEDICINE_STORAGE_PREFIX}` +
      `${prescriptionId}/${getTodayKey()}`,
    [prescriptionId],
  );

  /* ===================================================
     FETCH PRESCRIPTION
  =================================================== */

  const fetchPrescription = useCallback(
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
        const response =
          await mockApi.getPrescriptions();

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (!Array.isArray(response)) {
          throw new Error(
            'Invalid prescription data received.',
          );
        }

        const matched = response.find(
          item =>
            String(item.id) ===
            String(prescriptionId),
        );

        if (!matched) {
          throw new Error(
            'Prescription not found.',
          );
        }

        setPrescription(
          mapPrescription(matched),
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load prescription details.',
        );
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
    [prescriptionId],
  );

  /* ---------------------------------------------------
     LIFECYCLE
  --------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    void fetchPrescription();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchPrescription]);

  /* ===================================================
     RESTORE MEDICINE TRACKING
  =================================================== */

  useEffect(() => {
    let active = true;

    const restoreTracking = async () => {
      setTrackingLoading(true);
      setTrackingError(null);
      setTakenMedicines({});

      try {
        const stored =
          await AsyncStorage.getItem(
            trackingStorageKey,
          );

        const status =
          parseTakenStatus(stored);

        if (active) {
          setTakenMedicines(status);
        }
      } catch (storageError) {
        if (active) {
          setTrackingError(
            'Unable to restore medicine tracking.',
          );
        }

        console.warn(
          '[PrescriptionDetail] Tracking restore failed:',
          storageError,
        );
      } finally {
        if (active) {
          setTrackingLoading(false);
        }
      }
    };

    void restoreTracking();

    return () => {
      active = false;
    };
  }, [trackingStorageKey]);

  /* ===================================================
     TOGGLE MEDICINE STATUS
  =================================================== */

  const handleToggleMedicine = useCallback(
    async (medicineId: string) => {
      if (
        trackingLoading ||
        savingRef.current
      ) {
        return;
      }

      savingRef.current = true;
      setTrackingError(null);

      const previous = takenMedicines;

      const next: TakenStatus = {
        ...previous,
        [medicineId]:
          !previous[medicineId],
      };

      setTakenMedicines(next);

      try {
        await AsyncStorage.setItem(
          trackingStorageKey,
          JSON.stringify(next),
        );
      } catch (storageError) {
        if (mountedRef.current) {
          setTakenMedicines(previous);

          setTrackingError(
            'Unable to save medicine status. Please try again.',
          );
        }

        console.warn(
          '[PrescriptionDetail] Tracking save failed:',
          storageError,
        );
      } finally {
        savingRef.current = false;
      }
    },
    [
      trackingLoading,
      takenMedicines,
      trackingStorageKey,
    ],
  );

  /* ===================================================
     PROGRESS
  =================================================== */

  const medicineProgress = useMemo(() => {
    const medicines =
      prescription?.medicines ?? [];

    const total = medicines.length;

    const taken = medicines.filter(
      medicine =>
        takenMedicines[medicine.id] === true,
    ).length;

    const percentage =
      total > 0
        ? Math.round(
            (taken / total) * 100,
          )
        : 0;

    return {
      total,
      taken,
      percentage,
    };
  }, [
    prescription,
    takenMedicines,
  ]);

  /* ===================================================
     NAVIGATION
  =================================================== */

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', {
        screen: 'Prescriptions',
      });
    }
  }, [navigation]);

  const handleReminders = useCallback(() => {
    navigation.navigate('Reminders');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    void fetchPrescription(true);
  }, [fetchPrescription]);

  /* ===================================================
     HEADER
  =================================================== */

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: '#E2E8F0',
        },
      ]}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.headerButton}>
        <ArrowLeft
          size={23}
          color={colors.textPrimary}
        />
      </Pressable>

      <Text
        style={[
          styles.headerTitle,
          {color: colors.textPrimary},
        ]}>
        Prescription Details
      </Text>

      <Pressable
        onPress={handleReminders}
        accessibilityRole="button"
        accessibilityLabel="Open medicine reminders"
        style={styles.headerButton}>
        <Bell
          size={21}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );

  /* ===================================================
     LOADING
  =================================================== */

  if (loading && !prescription) {
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

        {renderHeader()}

        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={[
              styles.loadingText,
              {color: colors.textSecondary},
            ]}>
            Loading prescription...
          </Text>
        </View>
      </View>
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

  if (error && !prescription) {
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

        {renderHeader()}

        <View style={styles.centerContainer}>
          <ErrorState
            message={error}
            onRetry={() => {
              void fetchPrescription();
            }}
          />
        </View>
      </View>
    );
  }

  /* ===================================================
     EMPTY
  =================================================== */

  if (!prescription) {
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

        {renderHeader()}

        <View style={styles.centerContainer}>
          <EmptyState
            icon={FileText}
            title="Prescription Not Found"
            message="We couldn't find the requested prescription."
            actionTitle="Go Back"
            onAction={handleBack}
          />
        </View>
      </View>
    );
  }

  /* ===================================================
     MAIN SCREEN
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

      {/* FIXED STATUS BAR */}

      <StatusBar
        barStyle="dark-content"
      />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>

        {/* DIWALI BANNER */}

        {isDiwali ? (
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
              Stay healthy this festive season!
            </Text>
          </View>
        ) : null}

        {/* API ERROR BANNER */}

        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle
              size={17}
              color="#B91C1C"
            />

            <Text style={styles.errorBannerText}>
              {error}
            </Text>

            <Pressable
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Retry">
              <RefreshCw
                size={18}
                color="#B91C1C"
              />
            </Pressable>
          </View>
        ) : null}

        {/* PRESCRIPTION OVERVIEW */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View style={styles.overviewHeader}>
            <View
              style={[
                styles.overviewIcon,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              <ClipboardList
                size={26}
                color={colors.primary}
              />
            </View>

            <View style={styles.overviewInfo}>
              <Text
                style={[
                  styles.overviewTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                Medical Prescription
              </Text>

              <Text
                style={[
                  styles.prescriptionId,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                ID: {prescription.id}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.iconDetailRow}>
            <CalendarDays
              size={17}
              color={colors.primary}
            />

            <Text
              style={[
                styles.iconDetailText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              Issued on{' '}
              {formatDate(prescription.date)}
            </Text>
          </View>

          <View style={styles.iconDetailRow}>
            <UserRound
              size={17}
              color={colors.primary}
            />

            <Text
              style={[
                styles.iconDetailText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              Patient:{' '}
              {prescription.patientName}
            </Text>
          </View>
        </View>

        {/* DOCTOR DETAILS */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View style={styles.sectionHeader}>
            <Stethoscope
              size={20}
              color={colors.primary}
            />

            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Prescribed By
            </Text>
          </View>

          <View style={styles.doctorRow}>
            <View
              style={[
                styles.doctorAvatar,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              <Stethoscope
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.doctorInfo}>
              <Text
                style={[
                  styles.doctorName,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                {prescription.doctorName}
              </Text>

              <Text
                style={[
                  styles.doctorSpecialty,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {prescription.specialty}
              </Text>
            </View>
          </View>
        </View>

        {/* DIAGNOSIS */}

        {prescription.diagnosis ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}>
            <View style={styles.sectionHeader}>
              <FileText
                size={20}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                Diagnosis
              </Text>
            </View>

            <Text
              style={[
                styles.bodyText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {prescription.diagnosis}
            </Text>
          </View>
        ) : null}

        {/* MEDICINE PROGRESS */}

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor:
                colors.secondary,
            },
          ]}>
          <View style={styles.progressHeader}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.progressTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                Today's Medicine Progress
              </Text>

              <Text
                style={[
                  styles.progressSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {medicineProgress.taken} of{' '}
                {medicineProgress.total}{' '}
                medicines marked as taken
              </Text>
            </View>

            <Text
              style={[
                styles.progressPercentage,
                {color: colors.primary},
              ]}>
              {medicineProgress.percentage}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    `${medicineProgress.percentage}%` as ViewStyle['width'],
                  backgroundColor:
                    colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* MEDICINES HEADER */}

        <View style={styles.medicinesHeading}>
          <View style={styles.medicinesTitleRow}>
            <Pill
              size={22}
              color={colors.primary}
            />

            <Text
              style={[
                styles.medicinesTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Prescribed Medicines
            </Text>
          </View>

          <Text
            style={[
              styles.medicineCount,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {prescription.medicines.length}{' '}
            {prescription.medicines.length === 1
              ? 'medicine'
              : 'medicines'}
          </Text>
        </View>

        {/* MEDICINE CARDS */}

        {prescription.medicines.length === 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}>
            <EmptyState
              icon={Pill}
              title="No Medicines Listed"
              message="This prescription does not contain any medicines."
            />
          </View>
        ) : (
          prescription.medicines.map(
            (medicine, index) => (
              <MedicineCard
                key={`${medicine.id}-${index}`}
                medicine={medicine}
                index={index}
                taken={
                  takenMedicines[
                    medicine.id
                  ] === true
                }
                disabled={trackingLoading}
                primaryColor={
                  colors.primary
                }
                surfaceColor={
                  colors.surface
                }
                secondaryColor={
                  colors.textSecondary
                }
                textColor={
                  colors.textPrimary
                }
                onToggle={() => {
                  void handleToggleMedicine(
                    medicine.id,
                  );
                }}
              />
            ),
          )
        )}

        {/* TRACKING ERROR */}

        {trackingError ? (
          <View style={styles.errorBanner}>
            <AlertCircle
              size={17}
              color="#B91C1C"
            />

            <Text style={styles.errorBannerText}>
              {trackingError}
            </Text>
          </View>
        ) : null}

        {/* DOCTOR NOTES */}

        {prescription.notes ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}>
            <View style={styles.sectionHeader}>
              <FileText
                size={20}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                Doctor's Notes
              </Text>
            </View>

            <Text
              style={[
                styles.bodyText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {prescription.notes}
            </Text>
          </View>
        ) : null}

        {/* REMINDER SHORTCUT */}

        <Pressable
          onPress={handleReminders}
          accessibilityRole="button"
          accessibilityLabel="Open medicine reminders"
          style={[
            styles.reminderCard,
            {
              backgroundColor:
                colors.surface,
              borderColor:
                colors.primary,
            },
          ]}>
          <View
            style={[
              styles.reminderIcon,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <Bell
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.reminderInfo}>
            <Text
              style={[
                styles.reminderTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              Medicine Reminders
            </Text>

            <Text
              style={[
                styles.reminderSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              View your medication schedule
            </Text>
          </View>
        </Pressable>

        {/* INFORMATION NOTE */}

        <View style={styles.informationNote}>
          <Info
            size={17}
            color={colors.primary}
          />

          <Text
            style={[
              styles.informationText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Follow your doctor's prescribed dosage
            and schedule. Marking a medicine as
            taken only records your progress in
            this app.
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  scrollView: {
    flex: 1,
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
    marginBottom: 14,
  },

  festivalText: {
    fontSize: 12,
    fontWeight: '700',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FEF2F2',
    borderRadius: 11,
    padding: 12,
    marginBottom: 14,
  },

  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 11,
    lineHeight: 17,
  },

  card: {
    padding: 16,
    borderRadius: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  overviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overviewInfo: {
    flex: 1,
    marginLeft: 13,
  },

  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  prescriptionId: {
    fontSize: 11,
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },

  iconDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },

  iconDetailText: {
    flex: 1,
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doctorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },

  doctorName: {
    fontSize: 15,
    fontWeight: '800',
  },

  doctorSpecialty: {
    fontSize: 12,
    marginTop: 5,
  },

  bodyText: {
    fontSize: 12,
    lineHeight: 20,
  },

  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  progressSubtitle: {
    fontSize: 11,
    marginTop: 6,
  },

  progressPercentage: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 10,
  },

  progressTrack: {
    height: 9,
    backgroundColor: 'rgba(0,0,0,0.09)',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  medicinesHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  medicinesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  medicinesTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  medicineCount: {
    fontSize: 11,
  },

  medicineCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },

  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  medicineIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medicineHeading: {
    flex: 1,
    marginLeft: 11,
  },

  medicineNumber: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  medicineName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },

  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  takenBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },

  medicineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 12,
  },

  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
  },

  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    marginBottom: 14,
  },

  instructionsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },

  takenButton: {
    height: 46,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 10,
  },

  takenButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    marginBottom: 17,
  },

  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderInfo: {
    flex: 1,
    marginLeft: 12,
  },

  reminderTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  reminderSubtitle: {
    fontSize: 11,
    marginTop: 5,
  },

  informationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 5,
  },

  informationText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },
});
