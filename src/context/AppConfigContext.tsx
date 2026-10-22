
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {mockApi, type ConfigMode} from '../api/mockApi';

import type {LayoutConfig} from '../types/config';

import normalConfig from '../config/normal.json';
import diwaliConfig from '../config/diwali.json';

/**
 * Context types
 */
export interface ConfigContextValue {
  config: LayoutConfig | null;
  mode: ConfigMode;
  loading: boolean;
  error: string | null;

  switchMode: (mode: ConfigMode) => Promise<void>;
  refresh: () => Promise<void>;
}

interface AppConfigProviderProps {
  children: ReactNode;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  SELECTED_MODE: '@tapza/selected-mode',
  CONFIG_PREFIX: '@tapza/config/',
} as const;

/**
 * Bundled fallback configurations.
 *
 * Used when:
 * - API request fails
 * - Cache is unavailable
 * - App starts offline
 */
const BUNDLED_CONFIGS: Record<
  ConfigMode,
  LayoutConfig
> = {
  normal: normalConfig as LayoutConfig,
  diwali: diwaliConfig as LayoutConfig,
};

/**
 * Create context
 */
const ConfigContext = createContext<
  ConfigContextValue | undefined
>(undefined);

/**
 * Validate selected mode
 */
function isValidMode(
  value: unknown,
): value is ConfigMode {
  return value === 'normal' || value === 'diwali';
}

/**
 * Basic runtime validation for API/cache data.
 *
 * Prevents rendering an invalid config object.
 */
function isValidLayoutConfig(
  value: unknown,
): value is LayoutConfig {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const config = value as Record<string, unknown>;

  if (
    typeof config.version !== 'number' ||
    !Array.isArray(config.tabs) ||
    !Array.isArray(config.sections)
  ) {
    return false;
  }

  const theme = config.theme;

  if (
    typeof theme !== 'object' ||
    theme === null ||
    Array.isArray(theme)
  ) {
    return false;
  }

  const themeObject = theme as Record<
    string,
    unknown
  >;

  const requiredColors = [
    'primary',
    'secondary',
    'background',
    'surface',
    'textPrimary',
    'textSecondary',
    'accent',
  ];

  const hasValidColors = requiredColors.every(
    key =>
      typeof themeObject[key] === 'string' &&
      (themeObject[key] as string).length > 0,
  );

  if (!hasValidColors) {
    return false;
  }

  const hasValidSections = config.sections.every(
    (section: unknown) => {
      if (
        typeof section !== 'object' ||
        section === null ||
        Array.isArray(section)
      ) {
        return false;
      }

      const item = section as Record<
        string,
        unknown
      >;

      return (
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        Array.isArray(item.items)
      );
    },
  );

  return hasValidSections;
}

/**
 * Read cached configuration.
 */
async function getCachedConfig(
  mode: ConfigMode,
): Promise<LayoutConfig | null> {
  try {
    const cached = await AsyncStorage.getItem(
      `${STORAGE_KEYS.CONFIG_PREFIX}${mode}`,
    );

    if (!cached) {
      return null;
    }

    const parsed: unknown = JSON.parse(cached);

    if (!isValidLayoutConfig(parsed)) {
      console.warn(
        '[AppConfig] Invalid cached config:',
        mode,
      );

      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(
      '[AppConfig] Cache read failed:',
      error,
    );

    return null;
  }
}

/**
 * Save last-good configuration.
 */
async function saveCachedConfig(
  mode: ConfigMode,
  config: LayoutConfig,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CONFIG_PREFIX}${mode}`,
      JSON.stringify(config),
    );
  } catch (error) {
    console.warn(
      '[AppConfig] Cache write failed:',
      error,
    );
  }
}

/**
 * Save selected theme.
 */
async function saveSelectedMode(
  mode: ConfigMode,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SELECTED_MODE,
      mode,
    );
  } catch (error) {
    console.warn(
      '[AppConfig] Unable to save mode:',
      error,
    );
  }
}

/**
 * Restore selected theme.
 */
async function getSavedMode(): Promise<ConfigMode> {
  try {
    const saved = await AsyncStorage.getItem(
      STORAGE_KEYS.SELECTED_MODE,
    );

    if (isValidMode(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn(
      '[AppConfig] Unable to restore mode:',
      error,
    );
  }

  return 'normal';
}

/**
 * AppConfigProvider
 */
export function AppConfigProvider({
  children,
}: AppConfigProviderProps) {
  /**
   * Start with bundled Normal theme.
   *
   * This avoids a blank UI while the selected
   * theme is being restored from storage.
   */
  const [config, setConfig] =
    useState<LayoutConfig | null>(
      BUNDLED_CONFIGS.normal,
    );

  const [mode, setMode] =
    useState<ConfigMode>('normal');

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Prevent stale API responses.
   */
  const requestIdRef = useRef(0);

  /**
   * Prevent state updates after unmount.
   */
  const mountedRef = useRef(false);

  /**
   * Always track the latest requested mode.
   */
  const currentModeRef =
    useRef<ConfigMode>('normal');

  /**
   * Load config from:
   *
   * 1. Cache / bundled fallback
   * 2. Mock API
   * 3. Last-good cache on API failure
   */
  const loadConfig = useCallback(
    async (
      nextMode: ConfigMode,
      options?: {
        preserveCurrent?: boolean;
      },
    ): Promise<void> => {
      const requestId =
        ++requestIdRef.current;

      currentModeRef.current = nextMode;

      const preserveCurrent =
        options?.preserveCurrent ?? false;

      if (!mountedRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      /**
       * On theme switch, immediately display
       * the bundled config for that theme.
       *
       * On refresh, keep the current UI.
       */
      if (!preserveCurrent) {
        setConfig(
          BUNDLED_CONFIGS[nextMode],
        );
      }

      /**
       * Read cached config first.
       */
      const cachedConfig =
        await getCachedConfig(nextMode);

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      if (
        cachedConfig &&
        !preserveCurrent
      ) {
        setConfig(cachedConfig);
      }

      /**
       * Fetch latest config from API.
       */
      try {
        const response =
          await mockApi.getConfig(nextMode);

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (!isValidLayoutConfig(response)) {
          throw new Error(
            'Invalid configuration received from server',
          );
        }

        /**
         * Update live configuration.
         */
        setConfig(response);

        setError(null);

        /**
         * Persist only validated configs.
         */
        await saveCachedConfig(
          nextMode,
          response,
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load configuration';

        console.warn(
          '[AppConfig] API error:',
          message,
        );

        /**
         * Show error so HomeScreen can display
         * an offline/retry indicator.
         */
        setError(message);

        /**
         * Preserve the current UI on refresh.
         *
         * Otherwise use cached or bundled config.
         */
        if (!preserveCurrent) {
          setConfig(
            cachedConfig ??
              BUNDLED_CONFIGS[nextMode],
          );
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [],
  );

  /**
   * Initialize config once.
   */
  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      const savedMode = await getSavedMode();

      if (!mountedRef.current) {
        return;
      }

      currentModeRef.current = savedMode;

      setMode(savedMode);

      await loadConfig(savedMode);
    };

    void initialize();

    return () => {
      mountedRef.current = false;

      /**
       * Invalidate any pending requests.
       */
      requestIdRef.current += 1;
    };
  }, [loadConfig]);

  /**
   * Switch Normal / Diwali theme.
   */
  const switchMode = useCallback(
    async (
      nextMode: ConfigMode,
    ): Promise<void> => {
      if (!isValidMode(nextMode)) {
        console.warn(
          '[AppConfig] Invalid mode:',
          nextMode,
        );

        return;
      }

      /**
       * If already selected, no need to reload.
       */
      if (
        currentModeRef.current === nextMode
      ) {
        return;
      }

      currentModeRef.current = nextMode;

      setMode(nextMode);

      /**
       * Start loading the new mode immediately.
       */
      const loadPromise = loadConfig(
        nextMode,
      );

      /**
       * Save user preference.
       */
      await saveSelectedMode(nextMode);

      await loadPromise;
    },
    [loadConfig],
  );

  /**
   * Refresh current theme config.
   *
   * Keep existing config visible while loading.
   */
  const refresh = useCallback(
    async (): Promise<void> => {
      await loadConfig(
        currentModeRef.current,
        {
          preserveCurrent: true,
        },
      );
    },
    [loadConfig],
  );

  /**
   * Memoize context value.
   *
   * Prevent unnecessary context updates
   * when provider re-renders.
   */
  const contextValue =
    useMemo<ConfigContextValue>(
      () => ({
        config,
        mode,
        loading,
        error,
        switchMode,
        refresh,
      }),
      [
        config,
        mode,
        loading,
        error,
        switchMode,
        refresh,
      ],
    );

  return (
    <ConfigContext.Provider
      value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook to access configuration.
 */
export function useAppConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error(
      'useAppConfig must be used inside AppConfigProvider',
    );
  }

  return context;
}
