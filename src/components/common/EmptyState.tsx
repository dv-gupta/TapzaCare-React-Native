
import React, {memo} from 'react';

import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  Inbox,
  type LucideIcon,
} from 'lucide-react-native';

import {useAppConfig} from '../../hooks/useAppConfig';
import {defaultColors} from '../../theme/theme';
import AppButton from './AppButton';

interface EmptyStateProps {
  title: string;
  message: string;

  icon?: LucideIcon;
  actionTitle?: string;
  onAction?: () => void;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  actionTitle,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const {config} = useAppConfig();
  const colors = config?.theme ?? defaultColors;

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessibilityRole="summary">
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.background,
          },
        ]}>
        <Icon
          size={34}
          strokeWidth={1.8}
          color={colors.primary}
        />
      </View>

      <Text
        style={[
          styles.title,
          {color: colors.textPrimary},
        ]}>
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          {color: colors.textSecondary},
        ]}>
        {message}
      </Text>

      {actionTitle && onAction ? (
        <View style={styles.actionContainer}>
          <AppButton
            title={actionTitle}
            onPress={onAction}
            fullWidth={false}
          />
        </View>
      ) : null}
    </View>
  );
}

export default memo(EmptyState);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },

  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 290,
  },

  actionContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
