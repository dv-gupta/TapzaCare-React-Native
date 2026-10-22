
import {
  Platform,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type {ThemeColors} from '../types/config';

/**
 * TapzaCare Design System
 *
 * React Native CLI + TypeScript
 *
 * Supports:
 * - Normal theme
 * - Diwali theme
 * - Remote configuration colors
 * - Consistent spacing
 * - Typography
 * - Border radius
 * - Shadows
 * - Reusable component styles
 */

/* =====================================================
   THEME MODE
===================================================== */

export type ThemeMode = 'normal' | 'diwali';

/* =====================================================
   NORMAL THEME COLORS
===================================================== */

export const defaultColors: ThemeColors = {
  primary: '#087F73',
  secondary: '#E5F5F0',
  background: '#F7FAF9',
  surface: '#FFFFFF',
  textPrimary: '#18342F',
  textSecondary: '#6B817C',
  accent: '#F5A623',
};

/* =====================================================
   DIWALI THEME COLORS
===================================================== */

export const diwaliColors: ThemeColors = {
  primary: '#9C4D12',
  secondary: '#FFF0D5',
  background: '#FFF9F0',
  surface: '#FFFFFF',
  textPrimary: '#553014',
  textSecondary: '#80664D',
  accent: '#E5A329',
};

/* =====================================================
   SEMANTIC COLORS
===================================================== */

export const semanticColors = {
  success: '#16A34A',
  successLight: '#DCFCE7',

  error: '#DC2626',
  errorLight: '#FEE2E2',

  warning: '#D97706',
  warningLight: '#FEF3C7',

  info: '#2563EB',
  infoLight: '#DBEAFE',

  border: '#E2E8F0',
  divider: '#EDF2F7',

  disabled: '#94A3B8',
  disabledBackground: '#F1F5F9',

  white: '#FFFFFF',
  black: '#000000',

  transparent: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

/* =====================================================
   SPACING
===================================================== */

/**
 * Base spacing scale.
 * Existing token names are preserved.
 */
export const spacing = {
  none: 0,

  xxs: 2,

  xs: 4,

  sm: 8,

  md: 12,

  lg: 16,

  xl: 24,

  xxl: 32,

  xxxl: 40,

  huge: 48,
} as const;

/* =====================================================
   FONT SIZES
===================================================== */

export const fontSize = {
  tiny: 10,

  caption: 12,

  small: 14,

  body: 16,

  subtitle: 18,

  sectionTitle: 20,

  title: 24,

  heading: 30,

  display: 36,
} as const;

/* =====================================================
   FONT WEIGHTS
===================================================== */

export const fontWeight = {
  regular: '400',

  medium: '500',

  semibold: '600',

  bold: '700',

  extrabold: '800',
} as const;

/* =====================================================
   LINE HEIGHTS
===================================================== */

export const lineHeight = {
  tiny: 14,

  caption: 17,

  small: 20,

  body: 24,

  subtitle: 26,

  title: 32,

  heading: 38,

  display: 44,
} as const;

/* =====================================================
   BORDER RADIUS
===================================================== */

export const radius = {
  none: 0,

  xs: 4,

  sm: 8,

  md: 14,

  lg: 20,

  xl: 28,

  xxl: 36,

  round: 999,
} as const;

/* =====================================================
   COMMON DIMENSIONS
===================================================== */

export const dimensions = {
  buttonHeightSmall: 36,

  buttonHeightMedium: 46,

  buttonHeightLarge: 54,

  inputHeight: 50,

  iconButtonSize: 44,

  headerHeight: 64,

  bottomTabHeight: 64,

  cardMinHeight: 110,

  touchTarget: 44,
} as const;

/* =====================================================
   ANIMATION TIMINGS
===================================================== */

export const animation = {
  fast: 150,

  normal: 250,

  slow: 400,

  screen: 300,
} as const;

/* =====================================================
   TYPOGRAPHY
===================================================== */

/**
 * React Native system fonts.
 * OS font scaling remains enabled
 * unless individual Text components disable it.
 */
export const typography: Record<
  string,
  TextStyle
> = {
  display: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    fontWeight: '800',
  },

  heading: {
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
    fontWeight: '800',
  },

  title: {
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    lineHeight: lineHeight.subtitle,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: fontSize.subtitle,
    lineHeight: lineHeight.subtitle,
    fontWeight: '600',
  },

  body: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '400',
  },

  bodyMedium: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '500',
  },

  bodyBold: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  small: {
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    fontWeight: '400',
  },

  smallMedium: {
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    fontWeight: '500',
  },

  caption: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: '400',
  },

  captionBold: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: '700',
  },

  button: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },
};

/* =====================================================
   SHADOW HELPER
===================================================== */

/**
 * Platform-safe shadow helper.
 *
 * iOS uses shadow properties.
 * Android uses elevation.
 */
function createShadow(
  elevation: number,
  opacity: number,
  radiusValue: number,
  height: number,
): ViewStyle {
  return {
    ...Platform.select({
      ios: {
        shadowColor: semanticColors.black,

        shadowOffset: {
          width: 0,
          height,
        },

        shadowOpacity: opacity,

        shadowRadius: radiusValue,
      },

      android: {
        elevation,
      },

      default: {},
    }),
  };
}

/* =====================================================
   SHADOW TOKENS
===================================================== */

export const shadows = {
  none: {} as ViewStyle,

  small: createShadow(
    2,
    0.05,
    4,
    2,
  ),

  medium: createShadow(
    4,
    0.08,
    8,
    4,
  ),

  large: createShadow(
    8,
    0.12,
    16,
    8,
  ),

  floating: createShadow(
    12,
    0.16,
    20,
    10,
  ),
};

/* =====================================================
   GET THEME COLORS
===================================================== */

/**
 * Returns the fallback colors
 * for the selected application mode.
 */
export function getThemeColors(
  mode: ThemeMode,
): ThemeColors {
  return mode === 'diwali'
    ? diwaliColors
    : defaultColors;
}

/* =====================================================
   COLOR VALIDATION
===================================================== */

/**
 * Validates hex colors.
 *
 * Supported formats:
 * #RGB
 * #RRGGBB
 * #RRGGBBAA
 */
export function isValidHexColor(
  color: unknown,
): color is string {
  if (typeof color !== 'string') {
    return false;
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    color,
  );
}

/* =====================================================
   HEX TO RGBA
===================================================== */

/**
 * Converts a hex color into rgba.
 *
 * Example:
 *
 * hexToRgba('#087F73', 0.15)
 *
 * Result:
 * rgba(8, 127, 115, 0.15)
 */
export function hexToRgba(
  hex: string,
  opacity: number = 1,
): string {
  if (!isValidHexColor(hex)) {
    return `rgba(0, 0, 0, ${Math.max(
      0,
      Math.min(1, opacity),
    )})`;
  }

  let normalized = hex.replace(
    '#',
    '',
  );

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map(char => char + char)
      .join('');
  }

  const r = parseInt(
    normalized.slice(0, 2),
    16,
  );

  const g = parseInt(
    normalized.slice(2, 4),
    16,
  );

  const b = parseInt(
    normalized.slice(4, 6),
    16,
  );

  const hexAlpha =
    normalized.length === 8
      ? parseInt(
          normalized.slice(6, 8),
          16,
        ) / 255
      : 1;

  const requestedOpacity = Math.max(
    0,
    Math.min(1, opacity),
  );

  const alpha =
    hexAlpha * requestedOpacity;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* =====================================================
   CREATE APPLICATION THEME
===================================================== */

/**
 * Creates the complete application
 * design system using provided colors.
 */
export const createTheme = (
  colors: ThemeColors,
) => ({
  colors,

  semanticColors,

  spacing,

  fontSize,

  fontWeight,

  lineHeight,

  typography,

  radius,

  dimensions,

  animation,

  shadows,
});

/* =====================================================
   APP THEME TYPE
===================================================== */

export type AppTheme =
  ReturnType<typeof createTheme>;

/* =====================================================
   DEFAULT THEMES
===================================================== */

export const defaultTheme =
  createTheme(defaultColors);

export const diwaliTheme =
  createTheme(diwaliColors);

/* =====================================================
   GET COMPLETE THEME
===================================================== */

/**
 * Returns the complete fallback
 * theme for Normal or Diwali mode.
 */
export function getTheme(
  mode: ThemeMode,
): AppTheme {
  return mode === 'diwali'
    ? diwaliTheme
    : defaultTheme;
}

/* =====================================================
   CREATE THEME FROM REMOTE CONFIG
===================================================== */

/**
 * Builds the application theme
 * using remote configuration.
 *
 * Remote colors override the
 * selected mode's fallback colors.
 *
 * Invalid colors are ignored.
 *
 * Festival metadata is handled
 * separately because it is an
 * object, not a color string.
 *
 * This fixes:
 *
 * TS2322:
 * Type 'string' is not assignable
 * to type 'string & FestivalConfig'.
 */
export function createConfigTheme(
  mode: ThemeMode,
  remoteColors?: Partial<ThemeColors> | null,
): AppTheme {
  const fallbackColors =
    getThemeColors(mode);

  if (!remoteColors) {
    return createTheme(
      fallbackColors,
    );
  }

  const mergedColors: ThemeColors = {
    ...fallbackColors,

    primary: isValidHexColor(
      remoteColors.primary,
    )
      ? remoteColors.primary
      : fallbackColors.primary,

    secondary: isValidHexColor(
      remoteColors.secondary,
    )
      ? remoteColors.secondary
      : fallbackColors.secondary,

    background: isValidHexColor(
      remoteColors.background,
    )
      ? remoteColors.background
      : fallbackColors.background,

    surface: isValidHexColor(
      remoteColors.surface,
    )
      ? remoteColors.surface
      : fallbackColors.surface,

    textPrimary: isValidHexColor(
      remoteColors.textPrimary,
    )
      ? remoteColors.textPrimary
      : fallbackColors.textPrimary,

    textSecondary: isValidHexColor(
      remoteColors.textSecondary,
    )
      ? remoteColors.textSecondary
      : fallbackColors.textSecondary,

    accent: isValidHexColor(
      remoteColors.accent,
    )
      ? remoteColors.accent
      : fallbackColors.accent,
  };

  /**
   * Preserve festival information.
   *
   * Example:
   *
   * {
   *   name: 'Diwali',
   *   greeting: 'Happy Diwali!',
   *   bannerImageUrl: ''
   * }
   */
  if (remoteColors.festival) {
    mergedColors.festival =
      remoteColors.festival;
  }

  return createTheme(
    mergedColors,
  );
}

/* =====================================================
   REUSABLE COMPONENT STYLES
===================================================== */

/**
 * Primary button style.
 */
export function getPrimaryButtonStyle(
  colors: ThemeColors = defaultColors,
): ViewStyle {
  return {
    height:
      dimensions.buttonHeightMedium,

    backgroundColor:
      colors.primary,

    borderRadius:
      radius.md,

    alignItems:
      'center',

    justifyContent:
      'center',

    paddingHorizontal:
      spacing.lg,
  };
}

/**
 * Secondary button style.
 */
export function getSecondaryButtonStyle(
  colors: ThemeColors = defaultColors,
): ViewStyle {
  return {
    height:
      dimensions.buttonHeightMedium,

    backgroundColor:
      colors.secondary,

    borderRadius:
      radius.md,

    alignItems:
      'center',

    justifyContent:
      'center',

    paddingHorizontal:
      spacing.lg,
  };
}

/**
 * Default card style.
 */
export function getCardStyle(
  colors: ThemeColors = defaultColors,
): ViewStyle {
  return {
    backgroundColor:
      colors.surface,

    borderRadius:
      radius.md,

    padding:
      spacing.lg,

    borderWidth: 1,

    borderColor:
      semanticColors.border,

    ...shadows.small,
  };
}

/**
 * Default input style.
 */
export function getInputStyle(
  colors: ThemeColors = defaultColors,
): ViewStyle {
  return {
    height:
      dimensions.inputHeight,

    backgroundColor:
      colors.surface,

    borderRadius:
      radius.sm,

    borderWidth: 1,

    borderColor:
      semanticColors.border,

    paddingHorizontal:
      spacing.md,

    justifyContent:
      'center',
  };
}

/**
 * Default screen style.
 */
export function getScreenStyle(
  colors: ThemeColors = defaultColors,
): ViewStyle {
  return {
    flex: 1,

    backgroundColor:
      colors.background,
  };
}

/**
 * Default section container style.
 */
export function getSectionStyle(): ViewStyle {
  return {
    paddingHorizontal:
      spacing.lg,

    paddingVertical:
      spacing.md,
  };
}

/**
 * Default heading text style.
 */
export function getHeadingTextStyle(
  colors: ThemeColors = defaultColors,
): TextStyle {
  return {
    ...typography.heading,

    color:
      colors.textPrimary,
  };
}

/**
 * Default body text style.
 */
export function getBodyTextStyle(
  colors: ThemeColors = defaultColors,
): TextStyle {
  return {
    ...typography.body,

    color:
      colors.textPrimary,
  };
}

/**
 * Default secondary text style.
 */
export function getSecondaryTextStyle(
  colors: ThemeColors = defaultColors,
): TextStyle {
  return {
    ...typography.small,

    color:
      colors.textSecondary,
  };
}
