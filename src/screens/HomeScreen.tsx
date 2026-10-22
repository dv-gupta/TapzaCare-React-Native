
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
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {
  AlertCircle,
  Bell,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Sun,
  UserRound,
} from 'lucide-react-native';

import {useAppConfig} from '../hooks/useAppConfig';

import SectionRenderer, {
  isSupportedSection,
} from '../components/home/SectionRenderer';

import ErrorState from '../components/common/ErrorState';

import {
  createConfigTheme,
  spacing,
  radius,
  fontSize,
  dimensions,
  semanticColors,
} from '../theme/theme';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import type {
  HomeSection,
} from '../types/config';

/* =====================================================
   TYPES
===================================================== */

type HomeNavigation =
  NavigationProp<RootStackParamList>;

type HomeDestination =
  | 'Doctors'
  | 'Booking'
  | 'PrescriptionDetail'
  | 'Reminders'
  | 'Home'
  | 'Bookings'
  | 'Prescriptions'
  | 'Profile';

interface HomeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

interface QuickAccessProps {
  colors: HomeColors;
  onNavigate: (
    route: string,
    id?: string,
  ) => void;
}

interface HomeSkeletonProps {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const HEADER_MAX_HEIGHT = 92;
const HEADER_MIN_HEIGHT = 65;
const HEADER_SCROLL_DISTANCE = 110;

const WARNING_BACKGROUND =
  semanticColors.warningLight;

const WARNING_TEXT = '#92400E';

const AnimatedScrollView =
  Animated.createAnimatedComponent(ScrollView);

const QUICK_ACCESS_ITEMS = [
  {
    id: 'doctors',
    label: 'Doctors',
    route: 'Doctors',
    Icon: Stethoscope,
  },
  {
    id: 'bookings',
    label: 'Bookings',
    route: 'Bookings',
    Icon: CalendarDays,
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    route: 'Prescriptions',
    Icon: ClipboardList,
  },
  {
    id: 'reminders',
    label: 'Reminders',
    route: 'Reminders',
    Icon: Bell,
  },
] as const;

/* =====================================================
   NAVIGATION VALIDATION
===================================================== */

function isHomeDestination(
  value: string,
): value is HomeDestination {
  switch (value) {
    case 'Doctors':
    case 'Booking':
    case 'PrescriptionDetail':
    case 'Reminders':
    case 'Home':
    case 'Bookings':
    case 'Prescriptions':
    case 'Profile':
      return true;

    default:
      return false;
  }
}

/* =====================================================
   QUICK ACCESS
===================================================== */

const QuickAccess = memo(
  function QuickAccess({
    colors,
    onNavigate,
  }: QuickAccessProps) {
    return (
      <View
        style={[
          styles.quickAccessCard,
          {
            backgroundColor:
              colors.surface,
          },
        ]}>
        <Text
          style={[
            styles.quickAccessTitle,
            {
              color:
                colors.textPrimary,
            },
          ]}>
          Quick Access
        </Text>

        <View
          style={styles.quickAccessRow}>
          {QUICK_ACCESS_ITEMS.map(
            item => {
              const IconComponent =
                item.Icon;

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    onNavigate(
                      item.route,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    `Open ${item.label}`
                  }
                  style={({pressed}) => [
                    styles.quickAccessItem,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.quickAccessIcon,
                      {
                        backgroundColor:
                          colors.secondary,
                      },
                    ]}>
                    <IconComponent
                      size={21}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <Text
                    numberOfLines={2}
                    style={[
                      styles.quickAccessLabel,
                      {
                        color:
                          colors.textPrimary,
                      },
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>
    );
  },
);

/* =====================================================
   HOME SKELETON
===================================================== */

function HomeSkeleton({
  backgroundColor,
  primaryColor,
  secondaryColor,
  textColor,
}: HomeSkeletonProps) {
  return (
    <View
      style={[
        styles.container,
        {backgroundColor},
      ]}>
      <StatusBar
        barStyle="dark-content"
      />

      <View
        style={[
          styles.loadingHeader,
          {backgroundColor},
        ]}>
        <View
          style={[
            styles.skeletonLogo,
            {
              backgroundColor:
                secondaryColor,
            },
          ]}
        />

        <View
          style={
            styles.loadingHeaderText
          }>
          <View
            style={[
              styles.skeletonTitle,
              {
                backgroundColor:
                  secondaryColor,
              },
            ]}
          />

          <View
            style={[
              styles.skeletonSubtitle,
              {
                backgroundColor:
                  secondaryColor,
              },
            ]}
          />
        </View>
      </View>

      <View
        style={
          styles.skeletonContent
        }>
        <View
          style={[
            styles.skeletonHero,
            {
              backgroundColor:
                secondaryColor,
            },
          ]}
        />

        <View
          style={[
            styles.skeletonSectionTitle,
            {
              backgroundColor:
                secondaryColor,
            },
          ]}
        />

        <View
          style={styles.skeletonRow}>
          {[1, 2, 3].map(
            item => (
              <View
                key={item}
                style={[
                  styles.skeletonChip,
                  {
                    backgroundColor:
                      secondaryColor,
                  },
                ]}
              />
            ),
          )}
        </View>

        <View
          style={[
            styles.skeletonSectionTitle,
            {
              backgroundColor:
                secondaryColor,
            },
          ]}
        />

        <View
          style={styles.skeletonRow}>
          {[1, 2].map(
            item => (
              <View
                key={item}
                style={[
                  styles.skeletonService,
                  {
                    backgroundColor:
                      secondaryColor,
                  },
                ]}
              />
            ),
          )}
        </View>

        <View
          style={
            styles.loadingIndicator
          }>
          <ActivityIndicator
            size="small"
            color={primaryColor}
          />

          <Text
            style={[
              styles.loadingText,
              {color: textColor},
            ]}>
            Loading your healthcare
            experience...
          </Text>
        </View>
      </View>
    </View>
  );
}

/* =====================================================
   HOME SCREEN
===================================================== */

export default function HomeScreen() {
  const navigation =
    useNavigation<HomeNavigation>();

  const {width: screenWidth} =
    useWindowDimensions();

  const {
    config,
    mode,
    loading,
    error,
    switchMode,
    refresh,
  } = useAppConfig();

  /* ---------------------------------------------------
     THEME
  --------------------------------------------------- */

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

  const compactHeader =
    screenWidth < 375;

  /* ---------------------------------------------------
     REFS
  --------------------------------------------------- */

  /**
   * React Native 0.88 ScrollView ref.
   *
   * Fixes:
   * - ref type mismatch
   * - scrollTo type error
   */
  const scrollViewRef =
    useRef<ScrollViewInstance>(
      null,
    );

  const refreshingRef =
    useRef(false);

  const switchingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /* ---------------------------------------------------
     STATE
  --------------------------------------------------- */

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    switchingTheme,
    setSwitchingTheme,
  ] = useState(false);

  /* ---------------------------------------------------
     MOUNT LIFECYCLE
  --------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ---------------------------------------------------
     SCROLL ANIMATION
  --------------------------------------------------- */

  const scrollY =
    useSharedValue(0);

  const scrollHandler =
    useAnimatedScrollHandler({
      onScroll: event => {
        scrollY.value = Math.max(
          0,
          event.contentOffset.y,
        );
      },
    });

  /* ---------------------------------------------------
     COLLAPSING HEADER
  --------------------------------------------------- */

  const animatedHeaderStyle =
    useAnimatedStyle(() => {
      const height = interpolate(
        scrollY.value,
        [
          0,
          HEADER_SCROLL_DISTANCE,
        ],
        [
          HEADER_MAX_HEIGHT,
          HEADER_MIN_HEIGHT,
        ],
        Extrapolation.CLAMP,
      );

      return {
        height,
      };
    });

  const animatedTitleStyle =
    useAnimatedStyle(() => {
      const scale = interpolate(
        scrollY.value,
        [
          0,
          HEADER_SCROLL_DISTANCE,
        ],
        [1, 0.84],
        Extrapolation.CLAMP,
      );

      return {
        transform: [
          {scale},
        ],
      };
    });

  const animatedSubtitleStyle =
    useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, 45, 85],
        [1, 0.5, 0],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
      };
    });

  const animatedLogoStyle =
    useAnimatedStyle(() => {
      const scale = interpolate(
        scrollY.value,
        [
          0,
          HEADER_SCROLL_DISTANCE,
        ],
        [1, 0.9],
        Extrapolation.CLAMP,
      );

      return {
        transform: [
          {scale},
        ],
      };
    });

  /* ---------------------------------------------------
     CONFIG-DRIVEN SECTIONS
  --------------------------------------------------- */

  const visibleSections = useMemo(
    (): HomeSection[] => {
      if (!config?.sections) {
        return [];
      }

      return config.sections.filter(
        section =>
          section.enabled !== false &&
          isSupportedSection(
            section.type,
          ),
      );
    },
    [config?.sections],
  );

  const unsupportedSectionCount =
    useMemo(() => {
      if (!config?.sections) {
        return 0;
      }

      return config.sections.filter(
        section =>
          !isSupportedSection(
            section.type,
          ),
      ).length;
    }, [config?.sections]);

  /* ---------------------------------------------------
     REFRESH
  --------------------------------------------------- */

  const handleRefresh =
    useCallback(async () => {
      if (
        refreshingRef.current
      ) {
        return;
      }

      refreshingRef.current =
        true;

      if (mountedRef.current) {
        setRefreshing(true);
      }

      try {
        await refresh();
      } catch (refreshError) {
        if (__DEV__) {
          console.warn(
            '[HomeScreen] Refresh failed:',
            refreshError,
          );
        }
      } finally {
        refreshingRef.current =
          false;

        if (mountedRef.current) {
          setRefreshing(false);
        }
      }
    }, [refresh]);

  /* ---------------------------------------------------
     NORMAL / DIWALI SWITCH
  --------------------------------------------------- */

  const handleSwitchTheme =
    useCallback(async () => {
      if (
        switchingRef.current ||
        loading
      ) {
        return;
      }

      switchingRef.current =
        true;

      if (mountedRef.current) {
        setSwitchingTheme(true);
      }

      const nextMode =
        mode === 'normal'
          ? 'diwali'
          : 'normal';

      try {
        await switchMode(
          nextMode,
        );

        if (mountedRef.current) {
          scrollViewRef.current?.scrollTo(
            {
              x: 0,
              y: 0,
              animated: true,
            },
          );
        }
      } catch (switchError) {
        if (__DEV__) {
          console.warn(
            '[HomeScreen] Theme switch failed:',
            switchError,
          );
        }
      } finally {
        switchingRef.current =
          false;

        if (mountedRef.current) {
          setSwitchingTheme(
            false,
          );
        }
      }
    }, [
      loading,
      mode,
      switchMode,
    ]);

  /* ---------------------------------------------------
     NAVIGATION
  --------------------------------------------------- */

  const handleNavigate =
    useCallback(
      (
        screen: string,
        id?: string,
      ) => {
        if (
          !isHomeDestination(
            screen,
          )
        ) {
          if (__DEV__) {
            console.warn(
              '[HomeScreen] Unknown route:',
              screen,
            );
          }

          return;
        }

        switch (screen) {
          case 'Doctors':
            navigation.navigate(
              'Doctors',
            );
            break;

          case 'Booking':
            if (!id) {
              if (__DEV__) {
                console.warn(
                  'Booking requires doctorId',
                );
              }

              return;
            }

            navigation.navigate(
              'Booking',
              {
                doctorId: id,
              },
            );
            break;

          case 'PrescriptionDetail':
            if (!id) {
              if (__DEV__) {
                console.warn(
                  'PrescriptionDetail requires prescriptionId',
                );
              }

              return;
            }

            navigation.navigate(
              'PrescriptionDetail',
              {
                prescriptionId: id,
              },
            );
            break;

          case 'Reminders':
            navigation.navigate(
              'Reminders',
            );
            break;

          case 'Home':
          case 'Bookings':
          case 'Prescriptions':
          case 'Profile':
            navigation.navigate(
              'MainTabs',
              {
                screen,
              },
            );
            break;
        }
      },
      [navigation],
    );

  const handleOpenReminders =
    useCallback(() => {
      navigation.navigate(
        'Reminders',
      );
    }, [navigation]);

  const handleOpenProfile =
    useCallback(() => {
      navigation.navigate(
        'MainTabs',
        {
          screen: 'Profile',
        },
      );
    }, [navigation]);

  /* ---------------------------------------------------
     FESTIVAL INFORMATION
  --------------------------------------------------- */

  const festivalName =
    config?.theme.festival
      ?.name ?? 'Diwali';

  const festivalGreeting =
    config?.theme.festival
      ?.greeting ??
    'Happy Diwali!';

  /* ---------------------------------------------------
     INITIAL LOADING
  --------------------------------------------------- */

  if (
    loading &&
    !config
  ) {
    return (
      <HomeSkeleton
        backgroundColor={
          colors.background
        }
        primaryColor={
          colors.primary
        }
        secondaryColor={
          colors.secondary
        }
        textColor={
          colors.textSecondary
        }
      />
    );
  }

  /* ---------------------------------------------------
     CONFIG ERROR
  --------------------------------------------------- */

  if (!config) {
    return (
      <View
        style={[
          styles.container,
          styles.errorContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}>
        <StatusBar
          barStyle="dark-content"
        />

        <ErrorState
          title="Unable to Load Home"
          message={
            error ??
            'Unable to load your healthcare experience.'
          }
          onRetry={() => {
            void handleRefresh();
          }}
          loading={refreshing}
        />
      </View>
    );
  }

  /* ===================================================
     MAIN UI
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

      {/* ================================================
          COLLAPSING HEADER
      ================================================= */}

      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.surface,

            borderBottomColor:
              colors.secondary,
          },
          animatedHeaderStyle,
        ]}>

        {/* Brand */}
        <View
          style={
            styles.headerLeft
          }>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                backgroundColor:
                  colors.secondary,
              },
              animatedLogoStyle,
            ]}>
            <HeartPulse
              size={23}
              color={
                colors.primary
              }
            />
          </Animated.View>

          <View
            style={
              styles.brandTextContainer
            }>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.brandTitle,
                {
                  color:
                    colors.primary,
                },
                animatedTitleStyle,
              ]}>
              TapzaCare
            </Animated.Text>

            <Animated.Text
              numberOfLines={1}
              style={[
                styles.brandSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
                animatedSubtitleStyle,
              ]}>
              {isDiwali
                ? 'Celebrate a healthy Diwali'
                : 'Healthcare made simple'}
            </Animated.Text>
          </View>
        </View>

        {/* Header Actions */}
        <View
          style={
            styles.headerActions
          }>

          {/* Theme switch */}
          <Pressable
            onPress={() => {
              void handleSwitchTheme();
            }}
            disabled={
              switchingTheme ||
              loading
            }
            accessibilityRole="button"
            accessibilityLabel={
              isDiwali
                ? 'Switch to normal theme'
                : 'Switch to Diwali theme'
            }
            accessibilityState={{
              disabled:
                switchingTheme ||
                loading,
            }}
            style={({pressed}) => [
              styles.themeButton,
              {
                backgroundColor:
                  colors.secondary,

                opacity:
                  switchingTheme ||
                  loading
                    ? 0.5
                    : pressed
                      ? 0.75
                      : 1,
              },
            ]}>
            {switchingTheme ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />
            ) : isDiwali ? (
              <Sun
                size={18}
                color={
                  colors.primary
                }
              />
            ) : (
              <Sparkles
                size={18}
                color={
                  colors.primary
                }
              />
            )}

            {!compactHeader && (
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                {isDiwali
                  ? 'Normal'
                  : 'Diwali'}
              </Text>
            )}
          </Pressable>

          {/* Reminders */}
          <Pressable
            onPress={
              handleOpenReminders
            }
            accessibilityRole="button"
            accessibilityLabel="Medicine reminders"
            style={({pressed}) => [
              styles.headerIconButton,
              {
                backgroundColor:
                  colors.secondary,

                opacity:
                  pressed
                    ? 0.65
                    : 1,
              },
            ]}>
            <Bell
              size={19}
              color={
                colors.primary
              }
            />
          </Pressable>

          {/* Profile */}
          <Pressable
            onPress={
              handleOpenProfile
            }
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={({pressed}) => [
              styles.headerIconButton,
              {
                backgroundColor:
                  colors.secondary,

                opacity:
                  pressed
                    ? 0.65
                    : 1,
              },
            ]}>
            <UserRound
              size={19}
              color={
                colors.primary
              }
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* ================================================
          HOME SCROLL CONTENT
      ================================================= */}

      <AnimatedScrollView
        ref={scrollViewRef}
        onScroll={
          scrollHandler
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() => {
              void handleRefresh();
            }}
            colors={[
              colors.primary,
            ]}
            tintColor={
              colors.primary
            }
          />
        }>

        {/* ============================================
            FESTIVAL BANNER
        ============================================= */}

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
              size={21}
              color={
                colors.primary
              }
            />

            <View
              style={
                styles.festivalTextContainer
              }>
              <Text
                style={[
                  styles.festivalTitle,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                {festivalGreeting}
              </Text>

              <Text
                style={[
                  styles.festivalSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}>
                {`Wishing you a healthy and happy ${festivalName}`}
              </Text>
            </View>
          </View>
        )}

        {/* ============================================
            CONFIG ERROR / CACHED FALLBACK
        ============================================= */}

        {error && (
          <View
            style={
              styles.warningBanner
            }>
            <AlertCircle
              size={18}
              color={
                WARNING_TEXT
              }
            />

            <View
              style={
                styles.warningTextContainer
              }>
              <Text
                style={
                  styles.warningTitle
                }>
                Configuration notice
              </Text>

              <Text
                style={
                  styles.warningMessage
                }>
                {error}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void handleRefresh();
              }}
              disabled={
                refreshing
              }
              accessibilityRole="button"
              accessibilityLabel="Retry configuration"
              style={
                styles.retryIconButton
              }>
              {refreshing ? (
                <ActivityIndicator
                  size="small"
                  color={
                    WARNING_TEXT
                  }
                />
              ) : (
                <RefreshCw
                  size={18}
                  color={
                    WARNING_TEXT
                  }
                />
              )}
            </Pressable>
          </View>
        )}

        {/* ============================================
            CONFIG-DRIVEN SECTIONS
        ============================================= */}

        {visibleSections.map(
          section => (
            <SectionRenderer
              key={section.id}
              section={
                section
              }
              scrollY={
                scrollY
              }
              onNavigate={
                handleNavigate
              }
            />
          ),
        )}

        {/* ============================================
            EMPTY HOME SECTIONS
        ============================================= */}

        {visibleSections.length ===
          0 && (
          <View
            style={[
              styles.emptySectionsCard,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}>
            <Stethoscope
              size={36}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.emptySectionsTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              No Home Sections
              Available
            </Text>

            <Text
              style={[
                styles.emptySectionsMessage,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              Please refresh to load
              healthcare services.
            </Text>

            <Pressable
              onPress={() => {
                void handleRefresh();
              }}
              accessibilityRole="button"
              accessibilityLabel="Refresh home sections"
              style={[
                styles.emptyRetryButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}>
              <RefreshCw
                size={17}
                color={
                  semanticColors.white
                }
              />

              <Text
                style={
                  styles.emptyRetryText
                }>
                Refresh
              </Text>
            </Pressable>
          </View>
        )}

        {/* ============================================
            UNKNOWN SECTION WARNING
            DEVELOPMENT ONLY
        ============================================= */}

        {__DEV__ &&
          unsupportedSectionCount >
            0 && (
            <View
              style={
                styles.devWarning
              }>
              <AlertCircle
                size={16}
                color={
                  WARNING_TEXT
                }
              />

              <Text
                style={
                  styles.devWarningText
                }>
                {
                  unsupportedSectionCount
                }{' '}
                unsupported
                section(s) skipped.
              </Text>
            </View>
          )}

        {/* ============================================
            QUICK ACCESS
        ============================================= */}

        <QuickAccess
          colors={
            colors
          }
          onNavigate={
            handleNavigate
          }
        />

        {/* ============================================
            FOOTER
        ============================================= */}

        <View
          style={
            styles.footer
          }>
          <HeartPulse
            size={19}
            color={
              colors.primary
            }
          />

          <Text
            style={[
              styles.footerText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            Your health, our
            priority
          </Text>
        </View>
      </AnimatedScrollView>
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

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal:
      spacing.md,
    borderBottomWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },

  brandTitle: {
    fontSize:
      fontSize.sectionTitle,
    fontWeight: '800',
  },

  brandSubtitle: {
    fontSize:
      fontSize.tiny,
    marginTop: spacing.xxs,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },

  themeButton: {
    minWidth:
      dimensions.touchTarget,
    minHeight:
      dimensions.touchTarget,
    paddingHorizontal:
      spacing.sm,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  themeButtonText: {
    fontSize:
      fontSize.caption,
    fontWeight: '800',
  },

  headerIconButton: {
    width:
      dimensions.touchTarget,
    height:
      dimensions.touchTarget,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll */

  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  /* Festival */

  festivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal:
      spacing.lg,
    marginBottom:
      spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  festivalTextContainer: {
    flex: 1,
  },

  festivalTitle: {
    fontSize:
      fontSize.small,
    fontWeight: '800',
  },

  festivalSubtitle: {
    fontSize:
      fontSize.caption,
    marginTop: spacing.xs,
  },

  /* Warning */

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor:
      WARNING_BACKGROUND,
    marginHorizontal:
      spacing.lg,
    marginBottom:
      spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  warningTextContainer: {
    flex: 1,
  },

  warningTitle: {
    fontSize:
      fontSize.caption,
    fontWeight: '800',
    color: WARNING_TEXT,
  },

  warningMessage: {
    fontSize:
      fontSize.caption,
    color: WARNING_TEXT,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  retryIconButton: {
    width:
      dimensions.touchTarget,
    height:
      dimensions.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty Sections */

  emptySectionsCard: {
    marginHorizontal:
      spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptySectionsTitle: {
    fontSize:
      fontSize.body,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },

  emptySectionsMessage: {
    fontSize:
      fontSize.caption,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.sm,
  },

  emptyRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal:
      spacing.xl,
    minHeight:
      dimensions.touchTarget,
    borderRadius: radius.sm,
  },

  emptyRetryText: {
    color:
      semanticColors.white,
    fontSize:
      fontSize.small,
    fontWeight: '800',
  },

  /* Dev Warning */

  devWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor:
      WARNING_BACKGROUND,
    marginHorizontal:
      spacing.lg,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom:
      spacing.lg,
  },

  devWarningText: {
    fontSize:
      fontSize.caption,
    color: WARNING_TEXT,
    flex: 1,
  },

  /* Quick Access */

  quickAccessCard: {
    marginHorizontal:
      spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor:
      semanticColors.border,
  },

  quickAccessTitle: {
    fontSize:
      fontSize.body,
    fontWeight: '800',
    marginBottom:
      spacing.lg,
  },

  quickAccessRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  quickAccessItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
    minHeight:
      dimensions.touchTarget,
  },

  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickAccessLabel: {
    fontSize:
      fontSize.tiny,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Footer */

  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  footerText: {
    fontSize:
      fontSize.caption,
  },

  /* Error */

  errorContainer: {
    justifyContent: 'center',
    padding: spacing.xl,
  },

  /* Skeleton */

  loadingHeader: {
    height:
      HEADER_MAX_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:
      spacing.lg,
  },

  skeletonLogo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },

  loadingHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
    gap: spacing.sm,
  },

  skeletonTitle: {
    height: 18,
    width: '45%',
    borderRadius: radius.xs,
  },

  skeletonSubtitle: {
    height: 10,
    width: '60%',
    borderRadius: radius.xs,
  },

  skeletonContent: {
    padding: spacing.lg,
  },

  skeletonHero: {
    height: 185,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },

  skeletonSectionTitle: {
    width: '55%',
    height: 18,
    borderRadius: radius.xs,
    marginBottom: spacing.lg,
  },

  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  skeletonChip: {
    width: 90,
    height: 55,
    borderRadius: radius.md,
  },

  skeletonService: {
    flex: 1,
    height: 125,
    borderRadius: radius.md,
  },

  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  loadingText: {
    fontSize:
      fontSize.caption,
  },
});
