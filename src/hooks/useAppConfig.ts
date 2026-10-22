
/**
 * TapzaCare - App Configuration Hook
 *
 * Provides access to:
 * - Current Normal / Diwali theme
 * - Dynamic HomeScreen configuration
 * - Loading state
 * - API error state
 * - Runtime theme switching
 * - Configuration refresh
 *
 * Actual state management is handled by
 * AppConfigContext.tsx.
 */

export {
  useAppConfig,
} from '../context/AppConfigContext';

export type {
  ConfigContextValue,
} from '../context/AppConfigContext';
