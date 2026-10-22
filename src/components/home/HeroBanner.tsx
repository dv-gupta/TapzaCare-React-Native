
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  ImageBackground,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import LinearGradient from 'react-native-linear-gradient';

import {
  ArrowRight,
  HeartPulse,
  Sparkles,
  Stethoscope,
} from 'lucide-react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type {
  RootStackParamList,
} from '../../navigation/navigationTypes';

import {useAppConfig} from '../../hooks/useAppConfig';

import {
  defaultColors,
  diwaliColors,
} from '../../theme/theme';

/* =====================================================
   TYPES
===================================================== */

type HeroNavigation =
  NavigationProp<RootStackParamList>;

export interface HeroBannerSection {
  id?: string;

  type?: 'hero_banner';

  title?: string;
  subtitle?: string;
  description?: string;

  imageUrl?: string;
  bannerUrl?: string;

  buttonText?: string;
  ctaText?: string;
  ctaAction?: string;

  badge?: string;

  backgroundColor?: string;
  gradientColors?: string[];

  height?: number;
}

interface HeroBannerProps {
  section?: HeroBannerSection;

  title?: string;
  subtitle?: string;
  imageUrl?: string;

  buttonText?: string;

  onPress?: () => void;

  scrollY?: SharedValue<number>;

  primaryColor?: string;

  style?: StyleProp<ViewStyle>;

  testID?: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const DEFAULT_NORMAL_GRADIENT: [
  string,
  string,
  ...string[],
] = [
  '#087F73',
  '#159A8A',
  '#42B6A2',
];

const DEFAULT_DIWALI_GRADIENT: [
  string,
  string,
  ...string[],
] = [
  '#9C4D12',
  '#C47B1C',
  '#E5A329',
];

const MIN_HEIGHT = 190;
const MAX_HEIGHT = 360;
const DEFAULT_HEIGHT = 240;

/* =====================================================
   HELPERS
===================================================== */

function normalizeAction(
  action?: string,
): string {
  return (action ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

/**
 * Accept valid remote HTTP/HTTPS image URLs.
 */
function getValidImageUrl(
  value?: string,
): string | undefined {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  const url = value.trim();

  if (
    url.startsWith('https://') ||
    url.startsWith('http://')
  ) {
    return url;
  }

  return undefined;
}

/**
 * LinearGradient needs at least two colors.
 */
function getValidGradient(
  colors?: string[],
): [string, string, ...string[]] | null {
  if (!Array.isArray(colors)) {
    return null;
  }

  const validColors = colors.filter(
    color =>
      typeof color === 'string' &&
      color.trim().length > 0,
  );

  if (validColors.length < 2) {
    return null;
  }

  return [
    validColors[0],
    validColors[1],
    ...validColors.slice(2),
  ];
}

/**
 * Prevent invalid banner heights.
 */
function getBannerHeight(
  height?: number,
): number {
  if (
    typeof height !== 'number' ||
    !Number.isFinite(height)
  ) {
    return DEFAULT_HEIGHT;
  }

  return Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, height),
  );
}

/* =====================================================
   COMPONENT
===================================================== */

function HeroBanner({
  section,
  title,
  subtitle,
  imageUrl,
  buttonText,
  onPress,
  scrollY,
  primaryColor,
  style,
  testID,
}: HeroBannerProps) {
  const navigation =
    useNavigation<HeroNavigation>();

  const {config, mode} =
    useAppConfig();

  const {width: screenWidth} =
    useWindowDimensions();

  const isDiwali =
    mode === 'diwali';

  /* ---------------------------------------------------
     THEME
  --------------------------------------------------- */

  const colors = useMemo(
    () => ({
      ...(isDiwali
        ? diwaliColors
        : defaultColors),
      ...config?.theme,
    }),
    [config?.theme, isDiwali],
  );

  /* ---------------------------------------------------
     LOCAL STATE
  --------------------------------------------------- */

  const [imageFailed, setImageFailed] =
    useState(false);

  /* ---------------------------------------------------
     RESOLVED CONTENT
  --------------------------------------------------- */

  const resolvedTitle =
    title ??
    section?.title ??
    (isDiwali
      ? 'Celebrate Health & Happiness'
      : 'Your Health, Our Priority');

  const resolvedSubtitle =
    subtitle ??
    section?.subtitle ??
    section?.description ??
    'Book trusted doctors and manage your healthcare in one place.';

  const resolvedImage = getValidImageUrl(
    imageUrl ??
      section?.imageUrl ??
      section?.bannerUrl,
  );

  const resolvedButtonText =
    buttonText ??
    section?.buttonText ??
    section?.ctaText ??
    'Book Appointment';

  const resolvedBadge =
    section?.badge ??
    (isDiwali
      ? 'DIWALI SPECIAL'
      : 'WELCOME TO TAPZACARE');

  const bannerHeight =
    getBannerHeight(section?.height);

  const isCompact =
    screenWidth < 375;

  /* ---------------------------------------------------
     GRADIENT
  --------------------------------------------------- */

  const gradientColors = useMemo(
    (): [string, string, ...string[]] => {
      const sectionGradient =
        getValidGradient(
          section?.gradientColors,
        );

      if (sectionGradient) {
        return sectionGradient;
      }

      const solidColor =
        section?.backgroundColor;

      if (
        typeof solidColor === 'string' &&
        solidColor.trim().length > 0
      ) {
        return [
          solidColor,
          solidColor,
        ];
      }

      return isDiwali
        ? DEFAULT_DIWALI_GRADIENT
        : DEFAULT_NORMAL_GRADIENT;
    },
    [
      section?.gradientColors,
      section?.backgroundColor,
      isDiwali,
    ],
  );

  const ctaColor =
    primaryColor ?? colors.primary;

  /* ===================================================
     ANIMATION VALUES
  =================================================== */

  const entranceOpacity =
    useSharedValue(0);

  const entranceTranslateY =
    useSharedValue(14);

  /**
   * Always create the fallback shared value
   * to preserve React hook ordering.
   */
  const fallbackScrollY =
    useSharedValue(0);

  const activeScrollY =
    scrollY ?? fallbackScrollY;

  /* ---------------------------------------------------
     ENTRANCE ANIMATION
  --------------------------------------------------- */

  useEffect(() => {
    entranceOpacity.value = 0;

    entranceTranslateY.value = 14;

    entranceOpacity.value =
      withTiming(1, {
        duration: 450,
      });

    entranceTranslateY.value =
      withTiming(0, {
        duration: 450,
      });
  }, [
    resolvedTitle,
    mode,
    entranceOpacity,
    entranceTranslateY,
  ]);

  /* ---------------------------------------------------
     RESET IMAGE ERROR
  --------------------------------------------------- */

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedImage]);

  /* ===================================================
     PARALLAX ANIMATION
  =================================================== */

  const parallaxStyle =
    useAnimatedStyle(() => {
      const offset =
        activeScrollY.value;

      const translateY =
        interpolate(
          offset,
          [-150, 0, 250],
          [-25, 0, 45],
          Extrapolation.CLAMP,
        );

      const scale =
        interpolate(
          offset,
          [-150, 0, 250],
          [1.12, 1, 1.04],
          Extrapolation.CLAMP,
        );

      return {
        transform: [
          {translateY},
          {scale},
        ],
      };
    });

  /* ---------------------------------------------------
     ENTRANCE STYLE
  --------------------------------------------------- */

  const entranceStyle =
    useAnimatedStyle(() => ({
      opacity:
        entranceOpacity.value,

      transform: [
        {
          translateY:
            entranceTranslateY.value,
        },
      ],
    }));

  /* ===================================================
     CTA NAVIGATION
  =================================================== */

  const handlePress =
    useCallback(() => {
      /**
       * If the parent supplies onPress,
       * use that navigation handler first.
       */
      if (onPress) {
        onPress();
        return;
      }

      const action =
        normalizeAction(
          section?.ctaAction,
        );

      switch (action) {
        case 'prescription':
        case 'prescriptions':
        case 'myprescriptions':
          navigation.navigate(
            'MainTabs',
            {
              screen: 'Prescriptions',
            },
          );
          return;

        case 'booking':
        case 'bookings':
        case 'mybookings':
        case 'appointments':
          navigation.navigate(
            'MainTabs',
            {
              screen: 'Bookings',
            },
          );
          return;

        case 'reminder':
        case 'reminders':
          navigation.navigate(
            'Reminders',
          );
          return;

        case 'profile':
        case 'myprofile':
          navigation.navigate(
            'MainTabs',
            {
              screen: 'Profile',
            },
          );
          return;

        case 'home':
          navigation.navigate(
            'MainTabs',
            {
              screen: 'Home',
            },
          );
          return;

        default:
          navigation.navigate(
            'Doctors',
          );
          return;
      }
    }, [
      navigation,
      onPress,
      section?.ctaAction,
    ]);

  /* ===================================================
     BANNER CONTENT
  =================================================== */

  const bannerContent = (
    <LinearGradient
      colors={gradientColors}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.gradient}>

      {/* DECORATIVE CIRCLES */}

      <View
        pointerEvents="none"
        style={
          styles.decorativeCircleOne
        }
      />

      <View
        pointerEvents="none"
        style={
          styles.decorativeCircleTwo
        }
      />

      {/* ANIMATED CONTENT */}

      <Animated.View
        style={[
          styles.content,
          entranceStyle,
        ]}>

        {/* BADGE */}

        <View style={styles.badge}>
          {isDiwali ? (
            <Sparkles
              size={12}
              color="#FFFFFF"
            />
          ) : (
            <HeartPulse
              size={12}
              color="#FFFFFF"
            />
          )}

          <Text
            numberOfLines={1}
            style={
              styles.badgeText
            }>
            {resolvedBadge}
          </Text>
        </View>

        {/* TITLE */}

        <Text
          numberOfLines={
            isCompact ? 2 : 3
          }
          style={[
            styles.title,
            {
              fontSize:
                isCompact
                  ? 23
                  : 27,

              lineHeight:
                isCompact
                  ? 29
                  : 34,
            },
          ]}>
          {resolvedTitle}
        </Text>

        {/* SUBTITLE */}

        <Text
          numberOfLines={
            isCompact ? 2 : 3
          }
          style={
            styles.subtitle
          }>
          {resolvedSubtitle}
        </Text>

        {/* CTA BUTTON */}

        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={
            resolvedButtonText
          }
          testID={
            testID
              ? `${testID}-cta`
              : undefined
          }
          style={({pressed}) => [
            styles.ctaButton,
            {
              opacity:
                pressed
                  ? 0.85
                  : 1,
            },
          ]}>

          <Stethoscope
            size={17}
            color={ctaColor}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.ctaText,
              {
                color:
                  ctaColor,
              },
            ]}>
            {resolvedButtonText}
          </Text>

          <ArrowRight
            size={16}
            color={ctaColor}
          />
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          height:
            bannerHeight,

          backgroundColor:
            colors.primary,
        },
        style,
      ]}>

      {/* PARALLAX CONTAINER */}

      <Animated.View
        style={[
          styles.parallaxContainer,
          parallaxStyle,
        ]}>

        {resolvedImage &&
        !imageFailed ? (
          <ImageBackground
            source={{
              uri: resolvedImage,
            }}
            resizeMode="cover"
            style={
              styles.imageBackground
            }
            imageStyle={
              styles.image
            }
            onError={() => {
              setImageFailed(true);
            }}>
            {bannerContent}
          </ImageBackground>
        ) : (
          bannerContent
        )}

      </Animated.View>
    </View>
  );
}

/* =====================================================
   EXPORT
===================================================== */

export default memo(HeroBanner);

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,

    borderRadius: 22,

    overflow: 'hidden',
  },

  /**
   * FIX:
   * StyleSheet.absoluteFillObject
   * replaced with StyleSheet.absoluteFill.
   */
  parallaxContainer: {
    ...StyleSheet.absoluteFill,
  },

  imageBackground: {
    flex: 1,
  },

  image: {
    borderRadius: 22,
  },

  gradient: {
    flex: 1,

    justifyContent: 'center',

    paddingHorizontal: 22,
    paddingVertical: 18,
  },

  content: {
    zIndex: 2,

    alignItems: 'flex-start',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.20)',

    marginBottom: 11,
  },

  badgeText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 0.6,
  },

  title: {
    color: '#FFFFFF',

    fontWeight: '800',

    maxWidth: '95%',
  },

  subtitle: {
    color: '#F8FAFC',

    fontSize: 12,

    lineHeight: 18,

    marginTop: 8,

    maxWidth: '95%',
  },

  ctaButton: {
    minHeight: 44,

    backgroundColor: '#FFFFFF',

    borderRadius: 12,

    paddingHorizontal: 13,

    marginTop: 15,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

    maxWidth: '100%',
  },

  ctaText: {
    fontSize: 12,

    fontWeight: '800',

    flexShrink: 1,
  },

  decorativeCircleOne: {
    position: 'absolute',

    width: 190,
    height: 190,

    borderRadius: 95,

    right: -70,
    top: -75,

    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  decorativeCircleTwo: {
    position: 'absolute',

    width: 145,
    height: 145,

    borderRadius: 73,

    right: -40,
    bottom: -75,

    backgroundColor:
      'rgba(255,255,255,0.09)',
  },
});
