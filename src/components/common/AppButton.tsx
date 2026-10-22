
import React, {memo} from 'react';

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import type {ReactNode} from 'react';

import {useAppConfig} from '../../hooks/useAppConfig';
import {defaultColors} from '../../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface AppButtonProps {
  title: string;
  onPress: () => void;

  variant?: ButtonVariant;
  size?: ButtonSize;

  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  accessibilityLabel?: string;
  testID?: string;
}

function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: AppButtonProps) {
  const {config} = useAppConfig();

  const colors = config?.theme ?? defaultColors;

  const isDisabled = disabled || loading;

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const backgroundColor = isPrimary
    ? colors.primary
    : isSecondary
      ? '#EFF6FF'
      : 'transparent';

  const contentColor = isPrimary
    ? '#FFFFFF'
    : colors.primary;

  const borderColor = isPrimary
    ? colors.primary
    : variant === 'outline'
      ? colors.primary
      : '#DBEAFE';

  const buttonHeight =
    size === 'small'
      ? 44
      : size === 'large'
        ? 56
        : 50;

  const fontSize =
    size === 'small'
      ? 13
      : size === 'large'
        ? 17
        : 15;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          minHeight: buttonHeight,
          backgroundColor,
          borderColor,
          opacity: isDisabled
            ? 0.5
            : pressed
              ? 0.85
              : 1,
        },
        fullWidth ? styles.fullWidth : styles.autoWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={contentColor}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? (
            <View style={styles.iconContainer}>
              {leftIcon}
            </View>
          ) : null}

          <Text
            numberOfLines={2}
            style={[
              styles.text,
              {
                color: contentColor,
                fontSize,
              },
              textStyle,
            ]}>
            {title}
          </Text>

          {rightIcon ? (
            <View style={styles.iconContainer}>
              {rightIcon}
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export default memo(AppButton);

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullWidth: {
    width: '100%',
  },

  autoWidth: {
    alignSelf: 'flex-start',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
