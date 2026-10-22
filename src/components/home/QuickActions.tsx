
import React, {
  memo,
  useCallback,
  useMemo,
} from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  Stethoscope,
  CalendarDays,
  ClipboardList,
  Pill,
  Bell,
  HeartPulse,
  FlaskConical,
  Activity,
  UserRound,
  ShieldPlus,
  Clock3,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type {
  RootStackParamList,
} from '../../navigation/navigationTypes';

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

type QuickActionsNavigation =
  NavigationProp<RootStackParamList>;

export interface QuickActionItem {
  id: string;

  title?: string;
  label?: string;
  name?: string;

  subtitle?: string;
  description?: string;

  icon?: string;
  color?: string;
  backgroundColor?: string;

  action?: string;
  route?: string;

  doctorId?: string;
  prescriptionId?: string;
}

export interface QuickActionsSection {
  id?: string;
  type?: 'quick_actions';

  title?: string;
  subtitle?: string;

  items?: QuickActionItem[];
}

interface QuickActionsProps {
  section?: QuickActionsSection;

  actions?: QuickActionItem[];

  title?: string;
  subtitle?: string;

  onActionPress?: (
    action: QuickActionItem,
  ) => void;

  columns?: 2 | 3 | 4;

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
  doctor: Stethoscope,
  doctors: Stethoscope,
  stethoscope: Stethoscope,
  consultation: Stethoscope,
  consult: Stethoscope,

  booking: CalendarDays,
  bookings: CalendarDays,
  appointment: CalendarDays,
  appointments: CalendarDays,
  calendar: CalendarDays,

  prescription: ClipboardList,
  prescriptions: ClipboardList,
  'clipboard-list': ClipboardList,

  medicine: Pill,
  medicines: Pill,
  pharmacy: Pill,
  pill: Pill,

  reminder: Bell,
  reminders: Bell,
  notification: Bell,
  bell: Bell,

  heart: HeartPulse,
  cardiology: HeartPulse,
  'heart-pulse': HeartPulse,

  lab: FlaskConical,
  labs: FlaskConical,
  'lab-test': FlaskConical,
  'lab-tests': FlaskConical,

  activity: Activity,
  diagnostics: Activity,

  profile: UserRound,
  user: UserRound,

  health: ShieldPlus,
  wellness: ShieldPlus,

  clock: Clock3,
  schedule: Clock3,
};

/* =====================================================
   HELPERS
===================================================== */

function normalizeAction(
  value?: string,
): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function getActionIcon(
  iconName?: string,
): LucideIcon {
  const normalized = (
    iconName ?? ''
  )
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

  return (
    ICON_MAP[normalized] ??
    Stethoscope
  );
}

function getActionTitle(
  action: QuickActionItem,
): string {
  return (
    action.title?.trim() ||
    action.label?.trim() ||
    action.name?.trim() ||
    'Healthcare'
  );
}

function getActionSubtitle(
  action: QuickActionItem,
): string {
  return (
    action.subtitle?.trim() ||
    action.description?.trim() ||
    ''
  );
}

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
   ACTION CARD
===================================================== */

interface ActionCardProps {
  item: QuickActionItem;

  widthPercentage: `${number}%`;

  colors: {
    primary: string;
    surface: string;
    background: string;
    secondary: string;
    textPrimary: string;
    textSecondary: string;
  };

  onPress: (
    action: QuickActionItem,
  ) => void;

  testID?: string;
}

const ActionCard = memo(
  function ActionCard({
    item,
    widthPercentage,
    colors,
    onPress,
    testID,
  }: ActionCardProps) {
    const Icon =
      getActionIcon(item.icon);

    const itemTitle =
      getActionTitle(item);

    const itemSubtitle =
      getActionSubtitle(item);

    const iconColor =
      isValidHexColor(item.color)
        ? item.color!
        : colors.primary;

    const iconBackground =
      isValidHexColor(
        item.backgroundColor,
      )
        ? item.backgroundColor!
        : colors.secondary;

    const handlePress =
      useCallback(() => {
        onPress(item);
      }, [item, onPress]);

    return (
      <View
        style={[
          styles.gridItem,
          {
            flexBasis:
              widthPercentage,
            maxWidth:
              widthPercentage,
          },
        ]}>
        <Pressable
          testID={testID}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={
            itemSubtitle
              ? `${itemTitle}. ${itemSubtitle}`
              : itemTitle
          }
          style={({pressed}) => [
            styles.card,
            {
              backgroundColor:
                colors.surface,

              borderColor:
                colors.secondary,

              opacity:
                pressed
                  ? 0.8
                  : 1,
            },
          ]}>
          <View
            style={
              styles.cardTopRow
            }>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    iconBackground,
                },
              ]}>
              <Icon
                size={23}
                color={
                  iconColor
                }
                strokeWidth={1.9}
              />
            </View>

            <ArrowUpRight
              size={17}
              color={
                colors.textSecondary
              }
            />
          </View>

          <Text
            numberOfLines={2}
            style={[
              styles.cardTitle,
              {
                color:
                  colors.textPrimary,
              },
            ]}>
            {itemTitle}
          </Text>

          {itemSubtitle ? (
            <Text
              numberOfLines={2}
              style={[
                styles.cardSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {itemSubtitle}
            </Text>
          ) : null}
        </Pressable>
      </View>
    );
  },
);

/* =====================================================
   QUICK ACTIONS
===================================================== */

function QuickActions({
  section,
  actions,
  title,
  subtitle,
  onActionPress,
  columns = 2,
  style,
  testID,
}: QuickActionsProps) {
  const navigation =
    useNavigation<QuickActionsNavigation>();

  const {
    config,
    mode,
  } = useAppConfig();

  const {
    width: screenWidth,
  } = useWindowDimensions();

  const colors = useMemo(
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
   * Prevent excessively narrow cards
   * on smaller mobile screens.
   */
  const effectiveColumns =
    useMemo((): 2 | 3 | 4 => {
      if (
        screenWidth < 380
      ) {
        return 2;
      }

      if (
        screenWidth < 600 &&
        columns === 4
      ) {
        return 2;
      }

      return columns;
    }, [
      screenWidth,
      columns,
    ]);

  const columnWidth =
    `${100 / effectiveColumns}%` as `${number}%`;

  const items = useMemo(
    () => {
      const source =
        actions ??
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
      actions,
      section?.items,
    ],
  );

  const heading =
    title ??
    section?.title ??
    'Quick Actions';

  const description =
    subtitle ??
    section?.subtitle ??
    'Access your healthcare services quickly';

  /* =================================================
     NAVIGATION
  ================================================= */

  const handleActionPress =
    useCallback(
      (
        action:
          QuickActionItem,
      ) => {
        /**
         * SectionRenderer navigation
         * has priority.
         */
        if (onActionPress) {
          onActionPress(action);
          return;
        }

        const actionName =
          normalizeAction(
            action.action ??
              action.route ??
              action.id,
          );

        switch (
          actionName
        ) {
          case 'doctor':
          case 'doctors':
          case 'bookdoctor':
          case 'finddoctor':
          case 'consultation':
          case 'consultdoctor':
            navigation.navigate(
              'Doctors',
            );
            return;

          case 'booking':
          case 'bookappointment':
          case 'booknow':
            if (
              action.doctorId
            ) {
              navigation.navigate(
                'Booking',
                {
                  doctorId:
                    action.doctorId,
                },
              );
            } else {
              navigation.navigate(
                'Doctors',
              );
            }
            return;

          case 'bookings':
          case 'appointments':
          case 'mybookings':
          case 'myappointments':
            navigation.navigate(
              'MainTabs',
              {
                screen:
                  'Bookings',
              },
            );
            return;

          case 'prescription':
          case 'prescriptions':
          case 'myprescriptions':
            if (
              action.prescriptionId
            ) {
              navigation.navigate(
                'PrescriptionDetail',
                {
                  prescriptionId:
                    action.prescriptionId,
                },
              );
            } else {
              navigation.navigate(
                'MainTabs',
                {
                  screen:
                    'Prescriptions',
                },
              );
            }
            return;

          case 'prescriptiondetail':
          case 'viewprescription':
            if (
              action.prescriptionId
            ) {
              navigation.navigate(
                'PrescriptionDetail',
                {
                  prescriptionId:
                    action.prescriptionId,
                },
              );
            } else {
              navigation.navigate(
                'MainTabs',
                {
                  screen:
                    'Prescriptions',
                },
              );
            }
            return;

          case 'reminder':
          case 'reminders':
          case 'medicinereminders':
          case 'medicineschedule':
            navigation.navigate(
              'Reminders',
            );
            return;

          case 'profile':
          case 'myprofile':
            navigation.navigate(
              'MainTabs',
              {
                screen:
                  'Profile',
              },
            );
            return;

          case 'home':
            navigation.navigate(
              'MainTabs',
              {
                screen:
                  'Home',
              },
            );
            return;

          default:
            if (__DEV__) {
              console.warn(
                '[QuickActions] Unknown action:',
                action.action ??
                  action.route ??
                  action.id,
              );
            }
        }
      },
      [
        navigation,
        onActionPress,
      ],
    );

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

        {description ? (
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {description}
          </Text>
        ) : null}
      </View>

      {/* Dynamic grid */}
      <View
        style={
          styles.grid
        }>
        {items.map(
          (item, index) => (
            <ActionCard
              key={item.id}
              item={item}
              widthPercentage={
                columnWidth
              }
              colors={colors}
              onPress={
                handleActionPress
              }
              testID={
                testID
                  ? `${testID}-item-${index}`
                  : undefined
              }
            />
          ),
        )}
      </View>
    </View>
  );
}

export default memo(
  QuickActions,
);

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: 14,
    },

    headingContainer: {
      paddingHorizontal: 16,
      marginBottom: 15,
    },

    heading: {
      fontSize: 19,
      fontWeight: '800',
    },

    subtitle: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 10,
    },

    gridItem: {
      paddingHorizontal: 6,
      paddingBottom: 12,
    },

    card: {
      minHeight: 146,
      flex: 1,
      borderRadius: 17,
      borderWidth: 1,
      padding: 14,
      justifyContent: 'flex-start',
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 15,
    },

    iconContainer: {
      width: 46,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardTitle: {
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 19,
    },

    cardSubtitle: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 5,
    },
  });
