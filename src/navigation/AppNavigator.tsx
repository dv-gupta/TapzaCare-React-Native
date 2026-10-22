
import React, {useMemo} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  Home,
  CalendarDays,
  FileText,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingsScreen from '../screens/BookingsScreen';
import PrescriptionsScreen from '../screens/PrescriptionsScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ProfileScreen from '../screens/ProfileScreen';

import {useAppConfig} from '../hooks/useAppConfig';
import {defaultColors} from '../theme/theme';

import type {
  RootStackParamList,
  BottomTabParamList,
} from './navigationTypes';

import type {
  ScreenType,
} from '../types/config';

/**
 * Navigation instances.
 */
const Stack =
  createNativeStackNavigator<RootStackParamList>();

const Tab =
  createBottomTabNavigator<BottomTabParamList>();

/**
 * Supported bottom tab names.
 */
type TabName =
  keyof BottomTabParamList;

interface TabDefinition {
  name: TabName;
  label: string;
  visible: boolean;
}

/**
 * Default tab configuration.
 */
const DEFAULT_TABS: TabDefinition[] = [
  {
    name: 'Home',
    label: 'Home',
    visible: true,
  },
  {
    name: 'Bookings',
    label: 'Bookings',
    visible: true,
  },
  {
    name: 'Prescriptions',
    label: 'Prescriptions',
    visible: true,
  },
  {
    name: 'Profile',
    label: 'Profile',
    visible: true,
  },
];

/**
 * Mapping config screen names
 * to React Navigation screen names.
 */
const SCREEN_NAMES: Record<
  ScreenType,
  TabName
> = {
  home: 'Home',
  bookings: 'Bookings',
  prescriptions: 'Prescriptions',
  profile: 'Profile',
};

/**
 * Screen components.
 *
 * Explicit mapping keeps config data
 * separate from executable components.
 */
const TAB_COMPONENTS = {
  Home: HomeScreen,
  Bookings: BookingsScreen,
  Prescriptions: PrescriptionsScreen,
  Profile: ProfileScreen,
} satisfies Record<
  TabName,
  React.ComponentType<any>
>;

/**
 * Tab icons.
 */
const TAB_ICONS: Record<
  TabName,
  LucideIcon
> = {
  Home,
  Bookings: CalendarDays,
  Prescriptions: FileText,
  Profile: UserRound,
};

/**
 * Safe runtime screen validation.
 *
 * Remote configuration can contain
 * unknown screen names.
 */
function isTabName(
  value: unknown,
): value is TabName {
  return (
    value === 'Home' ||
    value === 'Bookings' ||
    value === 'Prescriptions' ||
    value === 'Profile'
  );
}

/**
 * Resolve tab screen name from config.
 */
function resolveTabName(
  screen: unknown,
): TabName | null {
  if (typeof screen !== 'string') {
    return null;
  }

  const normalized =
    screen.trim().toLowerCase();

  switch (normalized) {
    case 'home':
      return 'Home';

    case 'bookings':
      return 'Bookings';

    case 'prescriptions':
      return 'Prescriptions';

    case 'profile':
      return 'Profile';

    default:
      return null;
  }
}

/**
 * Build a safe tab list from config.
 *
 * Important:
 * All four routes remain registered so
 * navigation from HomeScreen,
 * ProfileScreen, and SectionRenderer
 * never targets a missing tab.
 *
 * Config determines order, labels,
 * and visibility in the tab bar.
 */
function buildTabs(
  configuredTabs: unknown,
): TabDefinition[] {
  if (!Array.isArray(configuredTabs)) {
    return DEFAULT_TABS;
  }

  const ordered: TabDefinition[] = [];

  const seen = new Set<TabName>();

  configuredTabs.forEach(rawTab => {
    if (
      typeof rawTab !== 'object' ||
      rawTab === null ||
      Array.isArray(rawTab)
    ) {
      return;
    }

    const tab = rawTab as Record<
      string,
      unknown
    >;

    const name =
      resolveTabName(tab.screen);

    if (!name || seen.has(name)) {
      return;
    }

    seen.add(name);

    const defaultTab =
      DEFAULT_TABS.find(
        item => item.name === name,
      );

    const label =
      typeof tab.label === 'string' &&
      tab.label.trim().length > 0
        ? tab.label.trim()
        : defaultTab?.label ?? name;

    ordered.push({
      name,
      label,
      visible: tab.visible !== false,
    });
  });

  /**
   * Append missing routes as hidden tabs.
   *
   * They remain accessible through
   * navigation.navigate('MainTabs', {...}).
   */
  DEFAULT_TABS.forEach(defaultTab => {
    if (!seen.has(defaultTab.name)) {
      ordered.push({
        ...defaultTab,
        visible: false,
      });
    }
  });

  /**
   * Prevent a completely empty tab bar.
   */
  const hasVisibleTab =
    ordered.some(tab => tab.visible);

  if (!hasVisibleTab) {
    return DEFAULT_TABS;
  }

  return ordered;
}

/**
 * Dynamic Bottom Tabs.
 */
function BottomTabs() {
  const {config} = useAppConfig();

  const insets = useSafeAreaInsets();

  const colors =
    config?.theme ?? defaultColors;

  /**
   * Dynamic tabs from config.
   */
  const tabs = useMemo(
    () => buildTabs(config?.tabs),
    [config?.tabs],
  );

  /**
   * Safe area bottom padding.
   */
  const bottomPadding = Math.max(
    insets.bottom,
    8,
  );

  /**
   * Height includes the safe area.
   */
  const tabBarHeight =
    56 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,

        /**
         * Active / inactive colors.
         */
        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textSecondary,

        /**
         * Dynamic bottom bar styling.
         */
        tabBarStyle: {
          backgroundColor:
            colors.surface,

          borderTopColor:
            colors.secondary,

          borderTopWidth: 1,

          height: tabBarHeight,

          paddingTop: 6,

          paddingBottom:
            bottomPadding,

          elevation: 7,

          shadowColor: '#000000',

          shadowOffset: {
            width: 0,
            height: -2,
          },

          shadowOpacity: 0.06,

          shadowRadius: 8,
        },

        /**
         * Label styling.
         */
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },

        /**
         * Icon/label positioning.
         */
        tabBarItemStyle: {
          paddingVertical: 2,
        },

        /**
         * Scene background.
         */
        sceneStyle: {
          backgroundColor:
            colors.background,
        },

        /**
         * Keep tab screens mounted
         * during tab switching.
         */
        lazy: true,
      }}>

      {tabs.map(tab => {
        const Icon =
          TAB_ICONS[tab.name];

        const Component =
          TAB_COMPONENTS[tab.name];

        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={Component}
            options={{
              title: tab.label,

              tabBarAccessibilityLabel:
                tab.label,

              /**
               * Hidden tabs are registered
               * but do not display buttons.
               */
              tabBarButton:
                tab.visible
                  ? undefined
                  : () => null,

              tabBarIcon: ({
                color,
                size,
                focused,
              }) => (
                <Icon
                  color={color}
                  size={size}
                  strokeWidth={
                    focused ? 2.5 : 2
                  }
                />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

/**
 * Initial navigation loader.
 */
function NavigationLoader({
  primaryColor,
  backgroundColor,
}: {
  primaryColor: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={[
        styles.loadingContainer,
        {
          backgroundColor,
        },
      ]}>
      <ActivityIndicator
        size="large"
        color={primaryColor}
      />

      <Text
        style={[
          styles.loadingText,
          {
            color: primaryColor,
          },
        ]}>
        Loading TapzaCare...
      </Text>
    </View>
  );
}

/**
 * Root Navigator.
 *
 * NavigationContainer and
 * AppConfigProvider should be defined
 * at the app root (App.tsx).
 */
export default function AppNavigator() {
  const {
    config,
    loading,
  } = useAppConfig();

  const colors =
    config?.theme ?? defaultColors;

  /**
   * Only block navigation during
   * the initial config load.
   *
   * Theme switching should not
   * unmount the entire navigator.
   */
  if (loading && !config) {
    return (
      <NavigationLoader
        primaryColor={colors.primary}
        backgroundColor={
          colors.background
        }
      />
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        /**
         * Dynamic navigation theme.
         */
        headerStyle: {
          backgroundColor:
            colors.surface,
        },

        headerTintColor:
          colors.textPrimary,

        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },

        headerShadowVisible: false,

        /**
         * Screen background.
         */
        contentStyle: {
          backgroundColor:
            colors.background,
        },

        /**
         * iOS / Android stack animation.
         */
        animation: 'slide_from_right',

        /**
         * Back navigation.
         */
        gestureEnabled: true,
      }}>

      {/* Bottom Tabs */}
      <Stack.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{
          headerShown: false,
        }}
      />

      {/* Doctors */}
      <Stack.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          title: 'Find a Doctor',
          headerShown: true,
        }}
      />

      {/* Booking */}
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          title: 'Book Appointment',
          headerShown: true,
        }}
      />

      {/* Prescription Details */}
      <Stack.Screen
        name="PrescriptionDetail"
        component={
          PrescriptionDetailScreen
        }
        options={{
          title: 'Prescription Details',
          headerShown: true,
        }}
      />

      {/* Medicine Reminders */}
      <Stack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          /**
           * RemindersScreen already
           * renders a custom header.
           */
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
  },
});
