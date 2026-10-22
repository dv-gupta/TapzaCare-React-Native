
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
  Ambulance,
  CalendarDays,
  ClipboardList,
  Bell,
  UserRound,
  ArrowUpRight,
  Clock3,
  type LucideIcon,
} from 'lucide-react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type {
  RootStackParamList,
} from '../../navigation/navigationTypes';

import type {
  HomeSection,
} from '../../types/config';

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

type ServiceNavigation =
  NavigationProp<RootStackParamList>;

export interface ServiceGridItem {
  id?: string;

  name?: string;
  title?: string;
  label?: string;

  subtitle?: string;
  description?: string;

  icon?: string;

  price?: number;
  feeInr?: number;

  badge?: string;
  nextSlot?: string;

  color?: string;
  backgroundColor?: string;

  action?: string;
  route?: string;

  doctorId?: string;
  prescriptionId?: string;
}

interface ServiceGridProps {
  section: HomeSection;

  onServicePress?: (
    service: ServiceGridItem,
  ) => void;

  columns?: 2 | 3;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface ServiceCardProps {
  service: ServiceGridItem;

  widthPercentage: `${number}%`;

  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
  };

  onPress: (
    service: ServiceGridItem,
  ) => void;

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

  heart: HeartPulse,
  cardiology: HeartPulse,
  'heart-pulse': HeartPulse,

  lab: FlaskConical,
  labs: FlaskConical,
  'lab-test': FlaskConical,
  'lab-tests': FlaskConical,
  laboratory: FlaskConical,
  test: FlaskConical,

  medicine: Pill,
  medicines: Pill,
  pharmacy: Pill,
  pill: Pill,

  injection: Syringe,
  vaccination: Syringe,
  vaccine: Syringe,

  activity: Activity,
  diagnostics: Activity,

  baby: Baby,
  pediatrics: Baby,
  paediatrics: Baby,

  brain: Brain,
  neurology: Brain,

  bone: Bone,
  orthopedics: Bone,
  orthopaedics: Bone,

  eye: Eye,
  ophthalmology: Eye,

  health: ShieldPlus,
  wellness: ShieldPlus,

  emergency: Ambulance,
  ambulance: Ambulance,

  appointment: CalendarDays,
  appointments: CalendarDays,
  booking: CalendarDays,
  bookings: CalendarDays,

  prescription: ClipboardList,
  prescriptions: ClipboardList,

  reminder: Bell,
  reminders: Bell,

  profile: UserRound,
  user: UserRound,

  clock: Clock3,
  schedule: Clock3,
};

/* =====================================================
   HELPERS
===================================================== */

function getIcon(
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

function getTitle(
  service: ServiceGridItem,
): string {
  return (
    service.name?.trim() ||
    service.title?.trim() ||
    service.label?.trim() ||
    'Healthcare Service'
  );
}

function getDescription(
  service: ServiceGridItem,
): string {
  return (
    service.subtitle?.trim() ||
    service.description?.trim() ||
    ''
  );
}

function normalizeAction(
  value?: string,
): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
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

function getPrice(
  service: ServiceGridItem,
): number | null {
  const value =
    service.price ??
    service.feeInr;

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

function formatPrice(
  price: number,
): string {
  return `₹${price.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function isServiceItem(
  value: unknown,
): value is ServiceGridItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/* =====================================================
   SERVICE CARD
===================================================== */

const ServiceCard = memo(
  function ServiceCard({
    service,
    widthPercentage,
    colors,
    onPress,
    testID,
  }: ServiceCardProps) {
    const Icon =
      getIcon(service.icon);

    const name =
      getTitle(service);

    const description =
      getDescription(service);

    const price =
      getPrice(service);

    const accentColor =
      isValidHexColor(service.color)
        ? service.color!
        : colors.primary;

    const iconBackground =
      isValidHexColor(
        service.backgroundColor,
      )
        ? service.backgroundColor!
        : colors.secondary;

    const handlePress =
      useCallback(() => {
        onPress(service);
      }, [
        onPress,
        service,
      ]);

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
            price !== null
              ? `${name}, ${price} rupees`
              : name
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
                  ? 0.82
                  : 1,
            },
          ]}>
          {/* Icon and arrow */}
          <View
            style={
              styles.topRow
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
                size={24}
                color={
                  accentColor
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

          {/* Service title */}
          <Text
            numberOfLines={2}
            style={[
              styles.serviceName,
              {
                color:
                  colors.textPrimary,
              },
            ]}>
            {name}
          </Text>

          {/* Description */}
          {description ? (
            <Text
              numberOfLines={2}
              style={[
                styles.description,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {description}
            </Text>
          ) : null}

          {/* Badge */}
          {service.badge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    colors.background,
                },
              ]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.badgeText,
                  {
                    color:
                      accentColor,
                  },
                ]}>
                {service.badge}
              </Text>
            </View>
          ) : null}

          {/* Next slot */}
          {service.nextSlot ? (
            <View
              style={
                styles.slotRow
              }>
              <Clock3
                size={12}
                color={
                  colors.textSecondary
                }
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.nextSlot,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {service.nextSlot}
              </Text>
            </View>
          ) : null}

          {/* Price */}
          {price !== null ? (
            <View
              style={
                styles.priceRow
              }>
              <Text
                style={[
                  styles.priceLabel,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                Starting at
              </Text>

              <Text
                style={[
                  styles.price,
                  {
                    color:
                      accentColor,
                  },
                ]}>
                {formatPrice(
                  price,
                )}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  },
);

/* =====================================================
   SERVICE GRID
===================================================== */

function ServiceGrid({
  section,
  onServicePress,
  columns = 2,
  style,
  testID,
}: ServiceGridProps) {
  const navigation =
    useNavigation<ServiceNavigation>();

  const {
    config,
    mode,
  } = useAppConfig();

  const {
    width: screenWidth,
  } = useWindowDimensions();

  /* =================================================
     THEME
  ================================================= */

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

  /* =================================================
     RESPONSIVE COLUMNS
  ================================================= */

  const effectiveColumns =
    useMemo((): 2 | 3 => {
      if (
        screenWidth < 600
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

  /* =================================================
     SERVICES
  ================================================= */

  const services =
    useMemo<
      ServiceGridItem[]
    >(() => {
      if (
        !Array.isArray(
          section.items,
        )
      ) {
        return [];
      }

      return section.items.filter(
        isServiceItem,
      );
    }, [
      section.items,
    ]);

  const heading =
    section.title ??
    'Our Services';

  const subtitle =
    typeof section.subtitle === 'string'
      ? section.subtitle
      : 'Explore healthcare services for you';

  /* =================================================
     NAVIGATION
  ================================================= */

  const handleServicePress =
    useCallback(
      (
        service:
          ServiceGridItem,
      ) => {
        /**
         * Parent SectionRenderer
         * navigation takes priority.
         */
        if (
          onServicePress
        ) {
          onServicePress(
            service,
          );
          return;
        }

        const action =
          normalizeAction(
            service.action ??
              service.route ??
              service.name ??
              service.title,
          );

        switch (
          action
        ) {
          case 'booking':
          case 'bookappointment':
          case 'booknow':
            if (
              service.doctorId
            ) {
              navigation.navigate(
                'Booking',
                {
                  doctorId:
                    service.doctorId,
                },
              );
            } else {
              navigation.navigate(
                'Doctors',
              );
            }
            return;

          case 'prescription':
          case 'prescriptions':
          case 'myprescriptions':
          case 'prescriptiondetail':
            if (
              service.prescriptionId
            ) {
              navigation.navigate(
                'PrescriptionDetail',
                {
                  prescriptionId:
                    service.prescriptionId,
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

          case 'bookings':
          case 'appointments':
          case 'mybookings':
            navigation.navigate(
              'MainTabs',
              {
                screen:
                  'Bookings',
              },
            );
            return;

          case 'reminder':
          case 'reminders':
          case 'medicinereminders':
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

          case 'doctor':
          case 'doctors':
          case 'consultation':
          case 'consultdoctor':
          case 'lab':
          case 'labtests':
          case 'medicine':
          case 'medicines':
          case 'pharmacy':
          case 'healthcheckup':
            navigation.navigate(
              'Doctors',
            );
            return;

          default:
            if (__DEV__) {
              console.warn(
                '[ServiceGrid] Unknown action:',
                service.action ??
                  service.route ??
                  service.name ??
                  service.title,
              );
            }
        }
      },
      [
        navigation,
        onServicePress,
      ],
    );

  if (
    services.length === 0
  ) {
    return null;
  }

  /* =================================================
     RENDER
  ================================================= */

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
          styles.header
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
              styles.headerSubtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Service cards */}
      <View
        style={
          styles.grid
        }>
        {services.map(
          (
            service,
            index,
          ) => (
            <ServiceCard
              key={
                service.id ??
                `service-${index}`
              }
              service={
                service
              }
              widthPercentage={
                columnWidth
              }
              colors={
                colors
              }
              onPress={
                handleServicePress
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
  ServiceGrid,
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

    header: {
      paddingHorizontal: 16,
      marginBottom: 15,
    },

    heading: {
      fontSize: 19,
      fontWeight: '800',
    },

    headerSubtitle: {
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
      flex: 1,
      minHeight: 165,
      padding: 14,
      borderRadius: 17,
      borderWidth: 1,
      justifyContent: 'flex-start',
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 13,
    },

    iconContainer: {
      width: 46,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    serviceName: {
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 19,
    },

    description: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 5,
    },

    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
      marginTop: 9,
    },

    badgeText: {
      fontSize: 10,
      fontWeight: '700',
    },

    slotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },

    nextSlot: {
      fontSize: 11,
      flexShrink: 1,
    },

    priceRow: {
      marginTop: 'auto',
      paddingTop: 12,
    },

    priceLabel: {
      fontSize: 10,
      marginBottom: 3,
    },

    price: {
      fontSize: 17,
      fontWeight: '800',
    },
  });
