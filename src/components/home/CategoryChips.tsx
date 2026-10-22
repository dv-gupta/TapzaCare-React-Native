
import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Pill,
  Syringe,
  Activity,
  Baby,
  Brain,
  Bone,
  Eye,
  ShieldPlus,
  CalendarDays,
  ClipboardList,
  Bell,
  UserRound,
  Hospital,
  Heart,
  Microscope,
  Scan,
  type LucideIcon,
} from 'lucide-react-native';

import {
  useAppConfig,
} from '../../hooks/useAppConfig';

import {
  defaultColors,
  diwaliColors,
} from '../../theme/theme';

/* =====================================================
   TYPES
===================================================== */

export interface CategoryChipItem {
  id: string;

  title?: string;
  label?: string;
  name?: string;

  icon?: string;
  color?: string;
}

export interface CategoryChipsSection {
  id?: string;

  type?: 'category_chips';

  title?: string;
  subtitle?: string;

  items?: CategoryChipItem[];
}

interface CategoryChipsProps {
  section?: CategoryChipsSection;

  categories?: CategoryChipItem[];

  title?: string;

  onCategoryPress?: (
    category: CategoryChipItem,
  ) => void;

  selectedCategoryId?: string | null;

  style?: StyleProp<ViewStyle>;

  testID?: string;
}

/* =====================================================
   ICON MAP
===================================================== */

const ICON_MAP: Record<
  string,
  LucideIcon
> = {
  stethoscope: Stethoscope,

  doctor: Stethoscope,
  doctors: Stethoscope,
  consultation: Stethoscope,
  consult: Stethoscope,

  heart: HeartPulse,
  cardiology: HeartPulse,
  cardiologist: HeartPulse,
  'heart-pulse': HeartPulse,

  lab: FlaskConical,
  laboratory: FlaskConical,
  'lab-test': FlaskConical,
  'lab-tests': FlaskConical,
  test: FlaskConical,
  tests: FlaskConical,
  pathology: Microscope,
  microscope: Microscope,

  medicine: Pill,
  medicines: Pill,
  pharmacy: Pill,
  pill: Pill,
  medication: Pill,

  injection: Syringe,
  vaccine: Syringe,
  vaccination: Syringe,
  syringe: Syringe,

  activity: Activity,
  diagnostics: Activity,
  diagnostic: Activity,
  scan: Scan,

  baby: Baby,
  pediatric: Baby,
  pediatrics: Baby,
  paediatric: Baby,
  paediatrics: Baby,

  brain: Brain,
  neurology: Brain,
  neurologist: Brain,

  bone: Bone,
  orthopedic: Bone,
  orthopedics: Bone,
  orthopaedic: Bone,
  orthopaedics: Bone,

  eye: Eye,
  eyes: Eye,
  ophthalmology: Eye,

  health: ShieldPlus,
  wellness: ShieldPlus,
  shield: ShieldPlus,
  'shield-plus': ShieldPlus,

  hospital: Hospital,
  clinic: Hospital,

  appointment: CalendarDays,
  appointments: CalendarDays,
  booking: CalendarDays,
  bookings: CalendarDays,
  calendar: CalendarDays,

  prescription: ClipboardList,
  prescriptions: ClipboardList,
  report: ClipboardList,
  reports: ClipboardList,

  reminder: Bell,
  reminders: Bell,
  notification: Bell,

  profile: UserRound,
  user: UserRound,

  heartbeat: Heart,
};

/* =====================================================
   HELPERS
===================================================== */

/**
 * Normalize icon names from remote config.
 *
 * Example:
 * "Lab Tests" -> "lab-tests"
 */
function normalizeIconName(
  value?: string,
): string {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

/**
 * Resolve icon without dynamic imports.
 *
 * Unknown icons safely use Stethoscope.
 */
function getCategoryIcon(
  iconName?: string,
): LucideIcon {
  const normalized =
    normalizeIconName(iconName);

  return (
    ICON_MAP[normalized] ??
    Stethoscope
  );
}

/**
 * Resolve category title.
 */
function getCategoryTitle(
  category: CategoryChipItem,
): string {
  const candidates = [
    category.title,
    category.label,
    category.name,
  ];

  for (const value of candidates) {
    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return 'Healthcare';
}

/**
 * Validate basic hex color values.
 *
 * Supports:
 * #RGB
 * #RRGGBB
 * #RRGGBBAA
 */
function isValidHexColor(
  value?: string,
): boolean {
  if (!value) {
    return false;
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    value,
  );
}

/* =====================================================
   CATEGORY ITEM
===================================================== */

interface CategoryItemProps {
  category: CategoryChipItem;

  selected: boolean;

  primaryColor: string;
  surfaceColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;

  compact: boolean;

  onPress: (
    category: CategoryChipItem,
  ) => void;

  testID?: string;
}

const CategoryItem = memo(
  function CategoryItem({
    category,
    selected,
    primaryColor,
    surfaceColor,
    backgroundColor,
    textColor,
    borderColor,
    compact,
    onPress,
    testID,
  }: CategoryItemProps) {
    const Icon =
      getCategoryIcon(
        category.icon,
      );

    const categoryTitle =
      getCategoryTitle(
        category,
      );

    const customColor =
      isValidHexColor(
        category.color,
      )
        ? category.color!
        : primaryColor;

    const iconColor =
      selected
        ? '#FFFFFF'
        : customColor;

    const handlePress =
      useCallback(() => {
        onPress(category);
      }, [
        category,
        onPress,
      ]);

    return (
      <Pressable
        testID={testID}
        onPress={
          handlePress
        }
        accessibilityRole="button"
        accessibilityLabel={
          `Explore ${categoryTitle}`
        }
        accessibilityState={{
          selected,
        }}
        style={({pressed}) => [
          styles.chip,
          compact &&
            styles.compactChip,
          {
            backgroundColor:
              selected
                ? primaryColor
                : surfaceColor,

            borderColor:
              selected
                ? primaryColor
                : borderColor,

            opacity:
              pressed
                ? 0.8
                : 1,
          },
        ]}>
        <View
          style={[
            styles.iconContainer,
            compact &&
              styles.compactIconContainer,
            {
              backgroundColor:
                selected
                  ? 'rgba(255,255,255,0.18)'
                  : backgroundColor,
            },
          ]}>
          <Icon
            size={
              compact
                ? 18
                : 20
            }
            strokeWidth={1.9}
            color={
              iconColor
            }
          />
        </View>

        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[
            styles.chipText,
            compact &&
              styles.compactChipText,
            {
              color:
                selected
                  ? '#FFFFFF'
                  : textColor,
            },
          ]}>
          {categoryTitle}
        </Text>
      </Pressable>
    );
  },
);

/* =====================================================
   CATEGORY CHIPS
===================================================== */

function CategoryChips({
  section,
  categories,
  title,
  onCategoryPress,
  selectedCategoryId,
  style,
  testID,
}: CategoryChipsProps) {
  const {
    config,
    mode,
  } = useAppConfig();

  const {
    width: screenWidth,
  } = useWindowDimensions();

  const compact =
    screenWidth < 375;

  /**
   * Theme fallback:
   * Normal / Diwali + remote config.
   */
  const colors =
    useMemo(
      () => ({
        ...(mode === 'diwali'
          ? diwaliColors
          : defaultColors),

        ...config?.theme,
      }),
      [
        mode,
        config?.theme,
      ],
    );

  /**
   * Internal selection is used only
   * when parent does not control it.
   */
  const [
    internalSelectedId,
    setInternalSelectedId,
  ] = useState<
    string | null
  >(null);

  /**
   * Parent categories prop has priority.
   */
  const items =
    useMemo(
      () => {
        const source =
          categories ??
          section?.items ??
          [];

        return source.filter(
          item =>
            Boolean(
              item &&
                typeof item.id ===
                  'string' &&
                item.id.trim()
                  .length > 0,
            ),
        );
      },
      [
        categories,
        section?.items,
      ],
    );

  const heading =
    title ??
    section?.title ??
    'Explore Categories';

  const subtitle =
    section?.subtitle;

  const activeCategoryId =
    selectedCategoryId !== undefined
      ? selectedCategoryId
      : internalSelectedId;

  const handleCategoryPress =
    useCallback(
      (
        category:
          CategoryChipItem,
      ) => {
        if (
          selectedCategoryId ===
          undefined
        ) {
          setInternalSelectedId(
            category.id,
          );
        }

        onCategoryPress?.(
          category,
        );
      },
      [
        selectedCategoryId,
        onCategoryPress,
      ],
    );

  /**
   * Nothing to render when
   * category list is empty.
   */
  if (
    items.length === 0
  ) {
    return null;
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        style,
      ]}>
      {/* Section heading */}
      <View
        style={
          styles.headingContainer
        }>
        <Text
          style={[
            styles.heading,
            {
              color:
                colors.textPrimary,
            },
          ]}>
          {heading}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Horizontal categories */}
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }
        accessibilityLabel="Healthcare categories">
        {items.map(
          (category, index) => (
            <CategoryItem
              key={
                category.id
              }
              category={
                category
              }
              selected={
                activeCategoryId ===
                category.id
              }
              primaryColor={
                colors.primary
              }
              surfaceColor={
                colors.surface
              }
              backgroundColor={
                colors.background
              }
              textColor={
                colors.textPrimary
              }
              borderColor={
                colors.secondary
              }
              compact={
                compact
              }
              onPress={
                handleCategoryPress
              }
              testID={
                testID
                  ? `${testID}-item-${index}`
                  : undefined
              }
            />
          ),
        )}
      </ScrollView>
    </View>
  );
}

export default memo(
  CategoryChips,
);

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: 12,
    },

    headingContainer: {
      paddingHorizontal: 16,
      marginBottom: 14,
    },

    heading: {
      fontSize: 19,
      fontWeight: '700',
    },

    subtitle: {
      fontSize: 13,
      marginTop: 5,
      lineHeight: 19,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 10,
      alignItems: 'center',
    },

    chip: {
      minHeight: 54,
      maxWidth: 210,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    compactChip: {
      paddingHorizontal: 10,
      gap: 7,
      maxWidth: 175,
    },

    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },

    compactIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 9,
    },

    chipText: {
      fontSize: 13,
      fontWeight: '600',
      maxWidth: 140,
      flexShrink: 1,
    },

    compactChipText: {
      fontSize: 12,
      maxWidth: 112,
    },
  });
