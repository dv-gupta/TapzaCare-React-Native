
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {LayoutConfig} from '../types/config';

/**
 * =====================================================
 * TAPZACARE LOCAL STORAGE SERVICE
 * =====================================================
 *
 * Features:
 * - Last successful layout configuration
 * - Normal / Diwali configuration cache
 * - Selected theme persistence
 * - Individual medicine dose tracking
 * - Daily reminder dose tracking
 * - Prescription medicine tracking
 * - Safe JSON parsing
 * - Storage cleanup helpers
 *
 * Compatible with React Native 0.88.
 */

/* =====================================================
   TYPES
===================================================== */

export type AppMode = 'normal' | 'diwali';

export type DailyDoseStatus = Record<string, boolean>;

/* =====================================================
   STORAGE KEYS
===================================================== */

const STORAGE_KEYS = {
  LAST_CONFIG: '@tapza/last_config',

  CONFIG_PREFIX: '@tapza/config/',

  SELECTED_MODE: '@tapza/selected-mode',

  DOSE_PREFIX: '@tapza/dose/',

  REMINDER_DOSES_PREFIX:
    '@tapza/reminder-doses/',

  PRESCRIPTION_DOSES_PREFIX:
    '@tapza/medicine-taken/',
} as const;

/* =====================================================
   ERROR HANDLING
===================================================== */

function logStorageError(
  operation: string,
  error: unknown,
): void {
  console.warn(
    `[TapzaCare Storage] ${operation} failed:`,
    error,
  );
}

/* =====================================================
   SAFE JSON PARSING
===================================================== */

function parseJSON<T>(
  value: string | null,
): T | null {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logStorageError(
      'JSON parsing',
      error,
    );

    return null;
  }
}

/* =====================================================
   OBJECT VALIDATION
===================================================== */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/* =====================================================
   CONFIG VALIDATION
===================================================== */

/**
 * Basic runtime validation.
 *
 * Full configuration validation remains
 * the responsibility of AppConfigContext.
 */
function isLayoutConfig(
  value: unknown,
): value is LayoutConfig {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.version !== 'number' ||
    !Array.isArray(value.tabs) ||
    !Array.isArray(value.sections)
  ) {
    return false;
  }

  if (!isRecord(value.theme)) {
    return false;
  }

  const theme = value.theme;

  return (
    typeof theme.primary === 'string' &&
    typeof theme.secondary === 'string' &&
    typeof theme.background === 'string' &&
    typeof theme.surface === 'string' &&
    typeof theme.textPrimary === 'string' &&
    typeof theme.textSecondary === 'string' &&
    typeof theme.accent === 'string'
  );
}

/* =====================================================
   DOSE STATUS VALIDATION
===================================================== */

function isDoseStatus(
  value: unknown,
): value is DailyDoseStatus {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    item => typeof item === 'boolean',
  );
}

/* =====================================================
   LOCAL DATE
===================================================== */

/**
 * Returns local date in YYYY-MM-DD format.
 *
 * Avoid toISOString() because UTC dates
 * can differ from the user's local date.
 */
export function getLocalDateKey(
  date: Date = new Date(),
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* =====================================================
   GENERAL JSON STORAGE
===================================================== */

/**
 * Save JSON-serializable data.
 */
export async function setStorageItem<T>(
  key: string,
  value: T,
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new Error(
        'Storage value cannot be serialized.',
      );
    }

    await AsyncStorage.setItem(
      key,
      serialized,
    );
  } catch (error) {
    logStorageError(
      `Writing ${key}`,
      error,
    );

    throw error;
  }
}

/**
 * Read and parse stored JSON.
 */
export async function getStorageItem<T>(
  key: string,
): Promise<T | null> {
  try {
    const raw =
      await AsyncStorage.getItem(key);

    return parseJSON<T>(raw);
  } catch (error) {
    logStorageError(
      `Reading ${key}`,
      error,
    );

    return null;
  }
}

/**
 * Remove a single storage item.
 */
export async function removeStorageItem(
  key: string,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logStorageError(
      `Removing ${key}`,
      error,
    );

    throw error;
  }
}

/* =====================================================
   INTERNAL MULTIPLE-KEY REMOVAL
===================================================== */

/**
 * Remove multiple keys using removeItem().
 *
 * Fixes TypeScript errors where multiRemove()
 * is unavailable in installed AsyncStorage
 * type definitions.
 *
 * Promise.all waits for all removals.
 * Note: this is not an atomic transaction.
 */
async function removeStorageItems(
  keys: readonly string[],
): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await Promise.all(
    keys.map(
      async (key: string): Promise<void> => {
        await AsyncStorage.removeItem(key);
      },
    ),
  );
}

/* =====================================================
   CONFIGURATION STORAGE
===================================================== */

/**
 * Save last successfully loaded config.
 *
 * Used for last-good-config fallback.
 */
export async function saveConfig(
  config: LayoutConfig,
): Promise<void> {
  if (!isLayoutConfig(config)) {
    throw new Error(
      'Cannot save an invalid layout configuration.',
    );
  }

  await setStorageItem(
    STORAGE_KEYS.LAST_CONFIG,
    config,
  );
}

/**
 * Restore last successful config.
 */
export async function getCachedConfig(): Promise<
  LayoutConfig | null
> {
  const value =
    await getStorageItem<unknown>(
      STORAGE_KEYS.LAST_CONFIG,
    );

  return isLayoutConfig(value)
    ? value
    : null;
}

/* =====================================================
   MODE-SPECIFIC CONFIG STORAGE
===================================================== */

/**
 * Save Normal or Diwali config.
 *
 * Storage keys:
 * @tapza/config/normal
 * @tapza/config/diwali
 */
export async function saveModeConfig(
  mode: AppMode,
  config: LayoutConfig,
): Promise<void> {
  if (!isLayoutConfig(config)) {
    throw new Error(
      'Cannot save an invalid layout configuration.',
    );
  }

  await setStorageItem(
    `${STORAGE_KEYS.CONFIG_PREFIX}${mode}`,
    config,
  );
}

/**
 * Restore cached config for a mode.
 */
export async function getModeConfig(
  mode: AppMode,
): Promise<LayoutConfig | null> {
  const value =
    await getStorageItem<unknown>(
      `${STORAGE_KEYS.CONFIG_PREFIX}${mode}`,
    );

  return isLayoutConfig(value)
    ? value
    : null;
}

/**
 * Remove cached config for one mode.
 */
export async function clearModeConfig(
  mode: AppMode,
): Promise<void> {
  await removeStorageItem(
    `${STORAGE_KEYS.CONFIG_PREFIX}${mode}`,
  );
}

/* =====================================================
   CLEAR CONFIG CACHE
===================================================== */

/**
 * Remove all cached configurations.
 *
 * The selected theme mode is preserved.
 *
 * FIX:
 * Replaced AsyncStorage.multiRemove()
 * with removeStorageItems().
 */
export async function clearConfigCache(): Promise<void> {
  try {
    const keys: string[] = [
      STORAGE_KEYS.LAST_CONFIG,

      `${STORAGE_KEYS.CONFIG_PREFIX}normal`,

      `${STORAGE_KEYS.CONFIG_PREFIX}diwali`,
    ];

    await removeStorageItems(keys);
  } catch (error) {
    logStorageError(
      'Clearing config cache',
      error,
    );

    throw error;
  }
}

/* =====================================================
   SELECTED THEME MODE
===================================================== */

/**
 * Save selected Normal / Diwali mode.
 *
 * Uses the same storage key as
 * AppConfigContext.
 */
export async function saveSelectedMode(
  mode: AppMode,
): Promise<void> {
  if (
    mode !== 'normal' &&
    mode !== 'diwali'
  ) {
    throw new Error(
      'Invalid application theme mode.',
    );
  }

  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SELECTED_MODE,
      mode,
    );
  } catch (error) {
    logStorageError(
      'Saving selected mode',
      error,
    );

    throw error;
  }
}

/**
 * Restore selected mode.
 *
 * Defaults to normal if missing or invalid.
 */
export async function getSelectedMode(): Promise<AppMode> {
  try {
    const value =
      await AsyncStorage.getItem(
        STORAGE_KEYS.SELECTED_MODE,
      );

    if (
      value === 'normal' ||
      value === 'diwali'
    ) {
      return value;
    }

    return 'normal';
  } catch (error) {
    logStorageError(
      'Reading selected mode',
      error,
    );

    return 'normal';
  }
}

/**
 * Reset selected mode to Normal.
 */
export async function resetSelectedMode(): Promise<void> {
  await saveSelectedMode('normal');
}

/* =====================================================
   INDIVIDUAL MEDICINE DOSE STORAGE
===================================================== */

/**
 * Save one medicine dose status.
 *
 * Example:
 * saveDose('medicine-1/2026-10-21', true)
 */
export async function saveDose(
  key: string,
  taken: boolean,
): Promise<void> {
  if (!key.trim()) {
    throw new Error(
      'Medicine dose key cannot be empty.',
    );
  }

  await setStorageItem(
    `${STORAGE_KEYS.DOSE_PREFIX}${key}`,
    taken,
  );
}

/**
 * Read one medicine dose status.
 *
 * Returns false when no valid status exists.
 */
export async function getDose(
  key: string,
): Promise<boolean> {
  if (!key.trim()) {
    return false;
  }

  const value =
    await getStorageItem<unknown>(
      `${STORAGE_KEYS.DOSE_PREFIX}${key}`,
    );

  return value === true;
}

/**
 * Remove one medicine dose status.
 */
export async function clearDose(
  key: string,
): Promise<void> {
  if (!key.trim()) {
    return;
  }

  await removeStorageItem(
    `${STORAGE_KEYS.DOSE_PREFIX}${key}`,
  );
}

/* =====================================================
   DAILY REMINDER TRACKING
===================================================== */

/**
 * Return the storage key used by
 * RemindersScreen.
 */
export function getReminderStorageKey(
  dateKey: string = getLocalDateKey(),
): string {
  return (
    STORAGE_KEYS.REMINDER_DOSES_PREFIX +
    dateKey
  );
}

/**
 * Save all reminder dose statuses for a day.
 *
 * Example:
 * {
 *   "rx-1/med-1/480": true,
 *   "rx-1/med-2/1260": false
 * }
 */
export async function saveDailyDoseStatus(
  status: DailyDoseStatus,
  dateKey: string = getLocalDateKey(),
): Promise<void> {
  if (!isDoseStatus(status)) {
    throw new Error(
      'Invalid daily medicine status.',
    );
  }

  await setStorageItem(
    getReminderStorageKey(dateKey),
    status,
  );
}

/**
 * Restore daily reminder statuses.
 */
export async function getDailyDoseStatus(
  dateKey: string = getLocalDateKey(),
): Promise<DailyDoseStatus> {
  const value =
    await getStorageItem<unknown>(
      getReminderStorageKey(dateKey),
    );

  return isDoseStatus(value)
    ? value
    : {};
}

/**
 * Update a single reminder dose.
 *
 * Existing statuses are preserved.
 */
export async function updateDailyDose(
  reminderId: string,
  taken: boolean,
  dateKey: string = getLocalDateKey(),
): Promise<DailyDoseStatus> {
  if (!reminderId.trim()) {
    throw new Error(
      'Reminder ID cannot be empty.',
    );
  }

  const existing =
    await getDailyDoseStatus(dateKey);

  const updated: DailyDoseStatus = {
    ...existing,
    [reminderId]: taken,
  };

  await saveDailyDoseStatus(
    updated,
    dateKey,
  );

  return updated;
}

/**
 * Read one reminder's daily status.
 */
export async function getDailyDose(
  reminderId: string,
  dateKey: string = getLocalDateKey(),
): Promise<boolean> {
  if (!reminderId.trim()) {
    return false;
  }

  const status =
    await getDailyDoseStatus(dateKey);

  return status[reminderId] === true;
}

/**
 * Remove all reminder statuses for one date.
 */
export async function clearDailyDoseStatus(
  dateKey: string = getLocalDateKey(),
): Promise<void> {
  await removeStorageItem(
    getReminderStorageKey(dateKey),
  );
}

/* =====================================================
   PRESCRIPTION MEDICINE TRACKING
===================================================== */

/**
 * Return the prescription tracking key.
 *
 * Example:
 * @tapza/medicine-taken/rx-1/2026-10-21
 */
export function getPrescriptionDoseKey(
  prescriptionId: string,
  dateKey: string = getLocalDateKey(),
): string {
  return (
    STORAGE_KEYS.PRESCRIPTION_DOSES_PREFIX +
    prescriptionId +
    '/' +
    dateKey
  );
}

/**
 * Save medicine-level status for a
 * prescription.
 */
export async function savePrescriptionDoseStatus(
  prescriptionId: string,
  status: DailyDoseStatus,
  dateKey: string = getLocalDateKey(),
): Promise<void> {
  if (!prescriptionId.trim()) {
    throw new Error(
      'Prescription ID cannot be empty.',
    );
  }

  if (!isDoseStatus(status)) {
    throw new Error(
      'Invalid prescription dose status.',
    );
  }

  await setStorageItem(
    getPrescriptionDoseKey(
      prescriptionId,
      dateKey,
    ),
    status,
  );
}

/**
 * Restore medicine-level status for a
 * prescription.
 */
export async function getPrescriptionDoseStatus(
  prescriptionId: string,
  dateKey: string = getLocalDateKey(),
): Promise<DailyDoseStatus> {
  if (!prescriptionId.trim()) {
    return {};
  }

  const value =
    await getStorageItem<unknown>(
      getPrescriptionDoseKey(
        prescriptionId,
        dateKey,
      ),
    );

  return isDoseStatus(value)
    ? value
    : {};
}

/**
 * Update one medicine's prescription status.
 */
export async function updatePrescriptionDose(
  prescriptionId: string,
  medicineId: string,
  taken: boolean,
  dateKey: string = getLocalDateKey(),
): Promise<DailyDoseStatus> {
  if (
    !prescriptionId.trim() ||
    !medicineId.trim()
  ) {
    throw new Error(
      'Prescription ID and medicine ID are required.',
    );
  }

  const existing =
    await getPrescriptionDoseStatus(
      prescriptionId,
      dateKey,
    );

  const updated: DailyDoseStatus = {
    ...existing,
    [medicineId]: taken,
  };

  await savePrescriptionDoseStatus(
    prescriptionId,
    updated,
    dateKey,
  );

  return updated;
}

/**
 * Remove daily medicine status for a
 * prescription.
 */
export async function clearPrescriptionDoseStatus(
  prescriptionId: string,
  dateKey: string = getLocalDateKey(),
): Promise<void> {
  await removeStorageItem(
    getPrescriptionDoseKey(
      prescriptionId,
      dateKey,
    ),
  );
}

/* =====================================================
   STORAGE UTILITIES
===================================================== */

/**
 * Check if a key exists in AsyncStorage.
 */
export async function hasStorageItem(
  key: string,
): Promise<boolean> {
  try {
    const value =
      await AsyncStorage.getItem(key);

    return value !== null;
  } catch (error) {
    logStorageError(
      `Checking ${key}`,
      error,
    );

    return false;
  }
}

/* =====================================================
   CLEAR ALL TAPZACARE STORAGE
===================================================== */

/**
 * Remove only TapzaCare-owned keys.
 *
 * WARNING:
 * This removes:
 * - Configuration caches
 * - Selected theme
 * - Medicine dose tracking
 * - Reminder dose tracking
 * - Prescription tracking
 * - Other @tapza/ data
 *
 * Use only for an explicit full reset.
 *
 * FIX:
 * Replaced AsyncStorage.multiRemove()
 * with removeStorageItems().
 */
export async function clearAllTapzaStorage(): Promise<void> {
  try {
    const allKeys =
      await AsyncStorage.getAllKeys();

    const tapzaKeys: string[] =
      allKeys.filter(
        (key: string): boolean =>
          key.startsWith('@tapza/'),
      );

    if (tapzaKeys.length === 0) {
      return;
    }

    await removeStorageItems(
      tapzaKeys,
    );
  } catch (error) {
    logStorageError(
      'Clearing TapzaCare storage',
      error,
    );

    throw error;
  }
}
