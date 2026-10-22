
import type {
  NavigatorScreenParams,
  CompositeNavigationProp,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';

/**
 * TapzaCare Navigation Types
 *
 * React Native CLI + TypeScript
 *
 * Root Stack:
 * - MainTabs
 * - Doctors
 * - Booking
 * - PrescriptionDetail
 * - Reminders
 *
 * Bottom Tabs:
 * - Home
 * - Bookings
 * - Prescriptions
 * - Profile
 */

/**
 * Bottom Tab Navigator Routes
 */
export type BottomTabParamList = {
  Home: undefined;

  Bookings: undefined;

  Prescriptions: undefined;

  Profile: undefined;
};

/**
 * Root Stack Navigator Routes
 */
export type RootStackParamList = {
  /**
   * Main bottom tab navigator.
   */
  MainTabs:
    NavigatorScreenParams<BottomTabParamList>;

  /**
   * Doctors listing screen.
   */
  Doctors: undefined;

  /**
   * Booking screen.
   *
   * Requires selected doctor ID.
   */
  Booking: {
    doctorId: string;
  };

  /**
   * Prescription details screen.
   *
   * Requires prescription ID.
   */
  PrescriptionDetail: {
    prescriptionId: string;
  };

  /**
   * Medicine reminders screen.
   */
  Reminders: undefined;
};

/**
 * Root Stack Navigation Prop
 *
 * Usage:
 * const navigation =
 *   useNavigation<RootStackNavigationProp>();
 */
export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

/**
 * Bottom Tab Navigation Prop
 */
export type BottomTabsNavigationProp =
  BottomTabNavigationProp<BottomTabParamList>;

/**
 * Combined Navigation Prop
 *
 * Use this inside bottom tab screens
 * that also navigate to root stack screens.
 *
 * Example:
 * Home -> Doctors
 * Home -> Booking
 * Profile -> Reminders
 */
export type AppNavigationProp =
  CompositeNavigationProp<
    BottomTabNavigationProp<BottomTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >;

/**
 * Root Stack Screen Props
 */
export type DoctorsScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Doctors'
  >;

export type BookingScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Booking'
  >;

export type PrescriptionDetailScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'PrescriptionDetail'
  >;

export type RemindersScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Reminders'
  >;

/**
 * Bottom Tab Screen Props
 */
export type HomeScreenProps =
  BottomTabScreenProps<
    BottomTabParamList,
    'Home'
  >;

export type BookingsScreenProps =
  BottomTabScreenProps<
    BottomTabParamList,
    'Bookings'
  >;

export type PrescriptionsScreenProps =
  BottomTabScreenProps<
    BottomTabParamList,
    'Prescriptions'
  >;

export type ProfileScreenProps =
  BottomTabScreenProps<
    BottomTabParamList,
    'Profile'
  >;

/**
 * Route Names
 *
 * Prevent hardcoded navigation strings
 * in reusable components.
 */
export const ROUTES = {
  MAIN_TABS: 'MainTabs',

  HOME: 'Home',

  BOOKINGS: 'Bookings',

  PRESCRIPTIONS: 'Prescriptions',

  PROFILE: 'Profile',

  DOCTORS: 'Doctors',

  BOOKING: 'Booking',

  PRESCRIPTION_DETAIL: 'PrescriptionDetail',

  REMINDERS: 'Reminders',
} as const;

/**
 * Bottom Tab Route Name Type
 */
export type BottomTabRouteName =
  keyof BottomTabParamList;

/**
 * Root Stack Route Name Type
 */
export type RootStackRouteName =
  keyof RootStackParamList;

/**
 * All application route names.
 */
export type AppRouteName =
  | BottomTabRouteName
  | RootStackRouteName;

/**
 * React Navigation global type support.
 *
 * Allows useNavigation() and navigation
 * helpers to infer root route names.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends RootStackParamList {}
  }
}
