
import React, {memo} from 'react';

import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  AlertCircle,
  WifiOff,
  CalendarX2,
  type LucideIcon,
} from 'lucide-react-native';

import {useAppConfig} from '../../hooks/useAppConfig';
import {defaultColors} from '../../theme/theme';
import AppButton from './AppButton';

type ErrorType = 'general' | 'network' | 'booking';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;

  title?: string;
  type?: ErrorType;
  retryTitle?: string;
  loading?: boolean;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ERROR_ICONS: Record<ErrorType, LucideIcon> = {
  general: AlertCircle,
  network: WifiOff,
  booking: CalendarX2,
};

const ERROR_TITLES: Record<ErrorType, string> = {
  general: 'Something Went Wrong',
  network: 'Connection Problem',
  booking: 'Booking Unavailable',
};

function ErrorState({
  message,
  onRetry,
  title,
  type = 'general',
  retryTitle = 'Try Again',
  loading = false,
  style,
  testID,
}: ErrorStateProps) {
  const {config} = useAppConfig();
  const colors = config?.theme ?? defaultColors;

  const Icon = ERROR_ICONS[type];
  const displayTitle = title ?? ERROR_TITLES[type];

  return (
    <View
      testID={testID}
      style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Icon
          size={34}
          color="#DC2626"
          strokeWidth={1.8}
        />
      </View>

      <Text
        style={[
          styles.title,
          {color: colors.textPrimary},
        ]}>
        {displayTitle}
      </Text>

      <Text
        style={[
          styles.message,
          {color: colors.textSecondary},
        ]}>
        {message}
      </Text>

      {onRetry ? (
        <View style={styles.actionContainer}>
          <AppButton
            title={retryTitle}
            onPress={onRetry}
            variant="primary"
            fullWidth={false}
            loading={loading}
            disabled={loading}
            accessibilityLabel={retryTitle}
          />
        </View>
      ) : null}
    </View>
  );
}

export default memo(ErrorState);

const styles = StyleSheet.create({
  container: {
    minHeight: 240,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF2F2',
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
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },

  actionContainer: {
    marginTop: 22,
    alignItems: 'center',
  },
});
