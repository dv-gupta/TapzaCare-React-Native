
import React, {memo, useMemo} from 'react';

import {
  View,
  ImageBackground,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
  type ImageResizeMode,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {useAppConfig} from '../../hooks/useAppConfig';
import {defaultColors} from '../../theme/theme';

/* =====================================================
   TYPES
===================================================== */

export interface SectionBackgroundConfig {
  type?: 'solid' | 'gradient' | 'image' | 'none';

  color?: string;

  colors?: string[];

  start?: {
    x: number;
    y: number;
  };

  end?: {
    x: number;
    y: number;
  };

  imageUrl?: string;

  overlayColor?: string;

  overlayOpacity?: number;

  borderRadius?: number;
}

interface SectionBackgroundProps {
  children: React.ReactNode;

  background?: SectionBackgroundConfig | string | null;

  style?: StyleProp<ViewStyle>;

  contentStyle?: StyleProp<ViewStyle>;

  imageResizeMode?: ImageResizeMode;

  testID?: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const DEFAULT_START = {
  x: 0,
  y: 0,
};

const DEFAULT_END = {
  x: 1,
  y: 1,
};

/* =====================================================
   HELPERS
===================================================== */

/**
 * Convert string background values to
 * a consistent configuration object.
 */
function normalizeBackground(
  background?: SectionBackgroundConfig | string | null,
): SectionBackgroundConfig {
  if (!background) {
    return {
      type: 'none',
    };
  }

  if (typeof background === 'string') {
    return {
      type: 'solid',
      color: background,
    };
  }

  return background;
}

/**
 * Ensure opacity stays between 0 and 1.
 */
function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    1,
    Math.max(0, value),
  );
}

/**
 * Ensure border radius is valid.
 */
function normalizeRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

/**
 * Validate gradient color array.
 *
 * react-native-linear-gradient expects
 * at least two color values.
 */
function getGradientColors(
  values?: string[],
): [string, string, ...string[]] | null {
  if (!values) {
    return null;
  }

  const validColors = values.filter(
    value =>
      typeof value === 'string' &&
      value.trim().length > 0,
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

/* =====================================================
   COMPONENT
===================================================== */

function SectionBackground({
  children,
  background,
  style,
  contentStyle,
  imageResizeMode = 'cover',
  testID,
}: SectionBackgroundProps) {
  const {config} = useAppConfig();

  /* ---------------------------------------------------
     THEME
  --------------------------------------------------- */

  const themeColors = config?.theme ?? defaultColors;

  /* ---------------------------------------------------
     NORMALIZE BACKGROUND
  --------------------------------------------------- */

  const resolvedBackground = useMemo(
    () => normalizeBackground(background),
    [background],
  );

  const {
    type = 'none',
    color,
    colors: gradientColors,
    start,
    end,
    imageUrl,
    overlayColor,
    overlayOpacity = 0,
    borderRadius = 0,
  } = resolvedBackground;

  /* ---------------------------------------------------
     SAFE VALUES
  --------------------------------------------------- */

  const safeOverlayOpacity = clampOpacity(
    overlayOpacity,
  );

  const safeBorderRadius = normalizeRadius(
    borderRadius,
  );

  const validGradientColors = useMemo(
    () => getGradientColors(gradientColors),
    [gradientColors],
  );

  /* ---------------------------------------------------
     CONTAINER STYLE
  --------------------------------------------------- */

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      borderRadius: safeBorderRadius,

      backgroundColor:
        type === 'solid'
          ? color || themeColors.background
          : themeColors.background,
    },
    style,
  ];

  /* ---------------------------------------------------
     CONTENT STYLE
  --------------------------------------------------- */

  const contentContainerStyle: StyleProp<ViewStyle> = [
    styles.content,
    contentStyle,
  ];

  /* ---------------------------------------------------
     IMAGE STYLE
  --------------------------------------------------- */

  const imageStyle: StyleProp<ImageStyle> = {
    borderRadius: safeBorderRadius,
  };

  /* ===================================================
     GRADIENT BACKGROUND
  =================================================== */

  if (
    type === 'gradient' &&
    validGradientColors !== null
  ) {
    return (
      <View
        testID={testID}
        style={containerStyle}>
        <LinearGradient
          colors={validGradientColors}
          start={start ?? DEFAULT_START}
          end={end ?? DEFAULT_END}
          style={styles.fill}>
          <View style={contentContainerStyle}>
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  /* ===================================================
     IMAGE BACKGROUND
  =================================================== */

  if (
    type === 'image' &&
    typeof imageUrl === 'string' &&
    imageUrl.trim().length > 0
  ) {
    return (
      <View
        testID={testID}
        style={containerStyle}>
        <ImageBackground
          source={{
            uri: imageUrl,
          }}
          resizeMode={imageResizeMode}
          imageStyle={imageStyle}
          style={styles.fill}>

          {/* IMAGE OVERLAY */}

          {overlayColor &&
          safeOverlayOpacity > 0 ? (
            <View
              pointerEvents="none"
              style={[
                // React Native 0.88 TypeScript fix:
                // absoluteFillObject -> absoluteFill
                StyleSheet.absoluteFill,
                {
                  backgroundColor: overlayColor,
                  opacity: safeOverlayOpacity,
                },
              ]}
            />
          ) : null}

          {/* CONTENT */}

          <View style={contentContainerStyle}>
            {children}
          </View>
        </ImageBackground>
      </View>
    );
  }

  /* ===================================================
     SOLID / NONE BACKGROUND
  =================================================== */

  return (
    <View
      testID={testID}
      style={containerStyle}>
      <View style={contentContainerStyle}>
        {children}
      </View>
    </View>
  );
}

/* =====================================================
   EXPORT
===================================================== */

export default memo(SectionBackground);

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },

  fill: {
    width: '100%',
  },

  content: {
    width: '100%',
  },
});
