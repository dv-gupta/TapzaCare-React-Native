
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
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Keyboard,
  type ListRenderItem,
} from 'react-native';

import {
  useNavigation,
  useFocusEffect,
  type NavigationProp,
} from '@react-navigation/native';

import {
  ClipboardList,
  Search,
  X,
  CalendarDays,
  Stethoscope,
  Pill,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileText,
  Sparkles,
  Bell,
} from 'lucide-react-native';

import {mockApi} from '../api/mockApi';

import type {
  Prescription,
} from '../types/prescription';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import {useAppConfig} from '../hooks/useAppConfig';
import {defaultColors} from '../theme/theme';

import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

/* =====================================================
   TYPES
===================================================== */

type PrescriptionsNavigation =
  NavigationProp<RootStackParamList>;

interface PrescriptionListItem {
  id: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  date: string;
  diagnosis: string;
  medicineCount: number;
  medicineNames: string[];
  notes: string;
}

interface PrescriptionCardProps {
  item: PrescriptionListItem;
  primaryColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  onPress: (id: string) => void;
}

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
    month: 'short',
    year: 'numeric',
  });
}

function mapPrescription(
  prescription: Prescription,
): PrescriptionListItem {
  const data = asRecord(prescription);
  const doctor = asRecord(data.doctor);
  const patient = asRecord(data.patient);

  const medicinesValue =
    data.medicines ?? data.medications ?? [];

  const medicines: unknown[] =
    Array.isArray(medicinesValue)
      ? medicinesValue
      : [];

  const medicineNames = medicines.map(
    (value, index) => {
      const medicine = asRecord(value);

      return readString(
        medicine,
        [
          'name',
          'medicineName',
          'medicine_name',
        ],
        `Medicine ${index + 1}`,
      );
    },
  );

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

    medicineCount: medicines.length,
    medicineNames,

    notes: readString(
      data,
      ['notes', 'doctorNotes', 'advice'],
    ),
  };
}

function getErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return 'Unable to load prescriptions. Please try again.';
}

/* =====================================================
   PRESCRIPTION CARD
===================================================== */

function PrescriptionCard({
  item,
  primaryColor,
  secondaryColor,
  surfaceColor,
  textColor,
  mutedColor,
  onPress,
}: PrescriptionCardProps) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={
        `View prescription from ${item.doctorName}`
      }
      style={({pressed}) => [
        styles.prescriptionCard,
        {
          backgroundColor: surfaceColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>

      {/* CARD HEADER */}

      <View style={styles.cardHeader}>
        <View
          style={[
            styles.prescriptionIcon,
            {
              backgroundColor: secondaryColor,
            },
          ]}>
          <ClipboardList
            size={25}
            color={primaryColor}
          />
        </View>

        <View style={styles.cardHeading}>
          <Text
            numberOfLines={1}
            style={[
              styles.prescriptionTitle,
              {color: textColor},
            ]}>
            Medical Prescription
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.prescriptionId,
              {color: mutedColor},
            ]}>
            ID: {item.id}
          </Text>
        </View>

        <ChevronRight
          size={21}
          color={primaryColor}
        />
      </View>

      <View style={styles.divider} />

      {/* DOCTOR INFORMATION */}

      <View style={styles.infoRow}>
        <Stethoscope
          size={17}
          color={primaryColor}
        />

        <View style={styles.infoContent}>
          <Text
            numberOfLines={1}
            style={[
              styles.doctorName,
              {color: textColor},
            ]}>
            {item.doctorName}
          </Text>

          <Text
            style={[
              styles.infoSubtitle,
              {color: mutedColor},
            ]}>
            {item.specialty}
          </Text>
        </View>
      </View>

      {/* DATE */}

      <View style={styles.infoRow}>
        <CalendarDays
          size={17}
          color={primaryColor}
        />

        <Text
          style={[
            styles.infoText,
            {color: mutedColor},
          ]}>
          {formatDate(item.date)}
        </Text>
      </View>

      {/* DIAGNOSIS */}

      {item.diagnosis ? (
        <View style={styles.infoRow}>
          <FileText
            size={17}
            color={primaryColor}
          />

          <Text
            numberOfLines={2}
            style={[
              styles.infoText,
              {color: mutedColor},
            ]}>
            {item.diagnosis}
          </Text>
        </View>
      ) : null}

      {/* MEDICINE SUMMARY */}

      <View
        style={[
          styles.medicineSummary,
          {
            backgroundColor: secondaryColor,
          },
        ]}>
        <View style={styles.medicineSummaryLeft}>
          <Pill
            size={18}
            color={primaryColor}
          />

          <Text
            style={[
              styles.medicineCountText,
              {color: textColor},
            ]}>
            {item.medicineCount}{' '}
            {item.medicineCount === 1
              ? 'Medicine'
              : 'Medicines'}
          </Text>
        </View>

        <Text
          style={[
            styles.viewDetailsText,
            {color: primaryColor},
          ]}>
          View Details
        </Text>
      </View>

      {/* MEDICINE NAMES */}

      {item.medicineNames.length > 0 ? (
        <Text
          numberOfLines={2}
          style={[
            styles.medicineNames,
            {color: mutedColor},
          ]}>
          {item.medicineNames.join(', ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* =====================================================
   LOADING SKELETON
===================================================== */

function PrescriptionSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIcon} />

        <View style={styles.skeletonHeading}>
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineSmall} />
        </View>
      </View>

      <View style={styles.skeletonDivider} />

      <View style={styles.skeletonLineMedium} />
      <View style={styles.skeletonLineSmall} />
      <View style={styles.skeletonLineMedium} />

      <View style={styles.skeletonFooter} />
    </View>
  );
}

/* =====================================================
   PRESCRIPTIONS SCREEN
===================================================== */

export default function PrescriptionsScreen() {
  const navigation =
    useNavigation<PrescriptionsNavigation>();

  const {config, mode} = useAppConfig();

  const colors =
    config?.theme ?? defaultColors;

  const isDiwali = mode === 'diwali';

  /* ---------------------------------------------------
     STATE
  --------------------------------------------------- */

  const [
    prescriptions,
    setPrescriptions,
  ] = useState<PrescriptionListItem[]>([]);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  /* ===================================================
     FETCH PRESCRIPTIONS
  =================================================== */

  const fetchPrescriptions = useCallback(
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

        const mapped = response
          .map(mapPrescription)
          .filter(
            item => item.id.length > 0,
          );

        setPrescriptions(mapped);
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

  /* ===================================================
     LIFECYCLE
  =================================================== */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /* ===================================================
     FETCH ON SCREEN FOCUS
  =================================================== */

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;

      void fetchPrescriptions();

      return () => {
        requestIdRef.current += 1;
      };
    }, [fetchPrescriptions]),
  );

  /* ===================================================
     SORT PRESCRIPTIONS
  =================================================== */

  const sortedPrescriptions = useMemo(() => {
    return [...prescriptions].sort(
      (a, b) => {
        const dateA = new Date(
          a.date,
        ).getTime();

        const dateB = new Date(
          b.date,
        ).getTime();

        const safeA =
          Number.isFinite(dateA)
            ? dateA
            : 0;

        const safeB =
          Number.isFinite(dateB)
            ? dateB
            : 0;

        return safeB - safeA;
      },
    );
  }, [prescriptions]);

  /* ===================================================
     SEARCH FILTER
  =================================================== */

  const filteredPrescriptions = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return sortedPrescriptions;
    }

    return sortedPrescriptions.filter(
      item => {
        const searchable = [
          item.id,
          item.doctorName,
          item.specialty,
          item.patientName,
          item.diagnosis,
          ...item.medicineNames,
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(query);
      },
    );
  }, [
    sortedPrescriptions,
    searchQuery,
  ]);

  /* ===================================================
     NAVIGATION
  =================================================== */

  const handlePrescriptionPress =
    useCallback(
      (prescriptionId: string) => {
        Keyboard.dismiss();

        navigation.navigate(
          'PrescriptionDetail',
          {
            prescriptionId,
          },
        );
      },
      [navigation],
    );

  const handleReminders = useCallback(() => {
    navigation.navigate('Reminders');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    void fetchPrescriptions(true);
  }, [fetchPrescriptions]);

  /* ===================================================
     RENDER ITEM
  =================================================== */

  const renderItem: ListRenderItem<
    PrescriptionListItem
  > = useCallback(
    ({item}) => (
      <PrescriptionCard
        item={item}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        surfaceColor={colors.surface}
        textColor={colors.textPrimary}
        mutedColor={colors.textSecondary}
        onPress={handlePrescriptionPress}
      />
    ),
    [
      colors.primary,
      colors.secondary,
      colors.surface,
      colors.textPrimary,
      colors.textSecondary,
      handlePrescriptionPress,
    ],
  );

  /* ===================================================
     HEADER
  =================================================== */

  const renderHeader = () => (
    <View>
      {/* DIWALI THEME */}

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
            Your health matters this Diwali!
          </Text>
        </View>
      ) : null}

      {/* TITLE */}

      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text
            style={[
              styles.screenTitle,
              {color: colors.textPrimary},
            ]}>
            My Prescriptions
          </Text>

          <Text
            style={[
              styles.screenSubtitle,
              {color: colors.textSecondary},
            ]}>
            Access your prescriptions and medicines
          </Text>
        </View>

        <Pressable
          onPress={handleReminders}
          accessibilityRole="button"
          accessibilityLabel="Open medicine reminders"
          style={[
            styles.reminderButton,
            {
              backgroundColor:
                colors.secondary,
            },
          ]}>
          <Bell
            size={21}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* SEARCH */}

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor:
              colors.surface,
          },
        ]}>
        <Search
          size={20}
          color={colors.textSecondary}
        />

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search prescriptions or medicines"
          placeholderTextColor={
            colors.textSecondary
          }
          style={[
            styles.searchInput,
            {color: colors.textPrimary},
          ]}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search prescriptions"
        />

        {searchQuery.length > 0 ? (
          <Pressable
            onPress={() => {
              setSearchQuery('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}>
            <X
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {/* PRESCRIPTION COUNT */}

      {!loading ? (
        <View style={styles.countRow}>
          <View style={styles.countLeft}>
            <ClipboardList
              size={17}
              color={colors.primary}
            />

            <Text
              style={[
                styles.countText,
                {color: colors.textSecondary},
              ]}>
              {filteredPrescriptions.length}{' '}
              {filteredPrescriptions.length === 1
                ? 'prescription found'
                : 'prescriptions found'}
            </Text>
          </View>

          {refreshing ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : null}
        </View>
      ) : null}

      {/* REFRESH ERROR */}

      {error && prescriptions.length > 0 ? (
        <View style={styles.inlineError}>
          <AlertCircle
            size={17}
            color="#B91C1C"
          />

          <Text style={styles.inlineErrorText}>
            {error}
          </Text>

          <Pressable
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading prescriptions">
            <RefreshCw
              size={18}
              color="#B91C1C"
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  /* ===================================================
     EMPTY / ERROR STATE
  =================================================== */

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    if (
      error &&
      prescriptions.length === 0
    ) {
      return (
        <ErrorState
          message={error}
          onRetry={() => {
            void fetchPrescriptions();
          }}
        />
      );
    }

    if (prescriptions.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No Prescriptions Yet"
          message="Your prescriptions will appear here after a doctor adds them."
          actionTitle="Try Again"
          onAction={() => {
            void fetchPrescriptions();
          }}
        />
      );
    }

    return (
      <EmptyState
        icon={Search}
        title="No Matching Prescriptions"
        message="Try searching with a different doctor, medicine, or prescription ID."
        actionTitle="Clear Search"
        onAction={() => {
          setSearchQuery('');
        }}
      />
    );
  };

  /* ===================================================
     MAIN RENDER
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

      {/* FIX: REMOVED UNSUPPORTED backgroundColor */}

      <StatusBar
        barStyle="dark-content"
      />

      {loading &&
      prescriptions.length === 0 ? (
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
              Loading your prescriptions...
            </Text>
          </View>

          <PrescriptionSkeleton />
          <PrescriptionSkeleton />
          <PrescriptionSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredPrescriptions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={false}
        />
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

  listContent: {
    padding: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },

  festivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    borderRadius: 12,
    marginBottom: 18,
  },

  festivalText: {
    fontSize: 12,
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
  },

  titleInfo: {
    flex: 1,
    paddingRight: 12,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
  },

  screenSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  reminderButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 52,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    paddingVertical: 0,
  },

  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  countLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  countText: {
    fontSize: 12,
    fontWeight: '600',
  },

  separator: {
    height: 13,
  },

  prescriptionCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  prescriptionIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeading: {
    flex: 1,
    marginLeft: 12,
  },

  prescriptionTitle: {
    fontSize: 15,
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

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 13,
  },

  infoContent: {
    flex: 1,
  },

  doctorName: {
    fontSize: 13,
    fontWeight: '700',
  },

  infoSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  medicineSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 11,
    marginTop: 4,
  },

  medicineSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  medicineCountText: {
    fontSize: 12,
    fontWeight: '700',
  },

  viewDetailsText: {
    fontSize: 11,
    fontWeight: '800',
  },

  medicineNames: {
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 11,
    marginBottom: 14,
  },

  inlineErrorText: {
    flex: 1,
    fontSize: 11,
    color: '#B91C1C',
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
  },

  skeletonIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
  },

  skeletonHeading: {
    flex: 1,
    marginLeft: 12,
    gap: 10,
  },

  skeletonLineLarge: {
    width: '75%',
    height: 15,
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
    marginVertical: 15,
  },

  skeletonFooter: {
    height: 45,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 12,
  },
});
