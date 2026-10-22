
/**
 * TapzaCare
 * Configuration Types
 *
 * Features:
 * - Config-driven Home screen
 * - Normal / Diwali themes
 * - Dynamic bottom navigation
 * - Dynamic Home sections
 * - Runtime configuration validation
 * - Unknown section handling
 * - Type-safe configuration objects
 */

/* =====================================================
   APP MODE
===================================================== */

export type AppMode = 'normal' | 'diwali';

/* =====================================================
   NAVIGATION TYPES
===================================================== */

/**
 * Supported bottom tab screens.
 */
export type ScreenType =
  | 'home'
  | 'bookings'
  | 'prescriptions'
  | 'profile';

/**
 * Supported Home section types.
 */
export type SectionType =
  | 'hero_banner'
  | 'category_chips'
  | 'quick_actions'
  | 'service_grid'
  | 'doctor_carousel'
  | 'offer_strip';

/**
 * Supported section types for runtime validation.
 */
export const SUPPORTED_SECTION_TYPES = [
  'hero_banner',
  'category_chips',
  'quick_actions',
  'service_grid',
  'doctor_carousel',
  'offer_strip',
] as const satisfies readonly SectionType[];

/**
 * Check whether a section type is supported.
 */
export function isSectionType(
  value: unknown,
): value is SectionType {
  return (
    typeof value === 'string' &&
    (
      SUPPORTED_SECTION_TYPES as readonly string[]
    ).includes(value)
  );
}

/**
 * Validate a bottom tab screen name.
 */
export function isScreenType(
  value: unknown,
): value is ScreenType {
  return (
    value === 'home' ||
    value === 'bookings' ||
    value === 'prescriptions' ||
    value === 'profile'
  );
}

/* =====================================================
   THEME TYPES
===================================================== */

/**
 * Festival configuration.
 *
 * Used for Diwali and future festivals.
 */
export interface FestivalConfig {
  name: string;
  greeting: string;
  bannerImageUrl: string;
}

/**
 * Main application theme colors.
 *
 * All required colors are used by
 * HomeScreen, AppNavigator and components.
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;

  /**
   * Optional festival information.
   */
  festival?: FestivalConfig;
}

/* =====================================================
   BOTTOM TAB CONFIGURATION
===================================================== */

/**
 * Dynamic tab item.
 *
 * Example:
 *
 * {
 *   id: "tab-home",
 *   label: "Home",
 *   icon: "home",
 *   screen: "home"
 * }
 */
export interface AppTab {
  id: string;
  label: string;
  icon: string;
  screen: ScreenType;

  /**
   * Optional tab visibility.
   */
  visible?: boolean;
}

/* =====================================================
   SECTION BACKGROUND
===================================================== */

export type SectionBackgroundKind =
  | 'color'
  | 'gradient'
  | 'image';

/**
 * Dynamic section background.
 *
 * Examples:
 *
 * Color:
 * {
 *   kind: "color",
 *   value: "#FFFFFF"
 * }
 *
 * Gradient:
 * {
 *   kind: "gradient",
 *   value: "#087F73,#42B6A2"
 * }
 *
 * Image:
 * {
 *   kind: "image",
 *   value: "https://example.com/banner.png"
 * }
 */
export interface SectionBackground {
  kind: SectionBackgroundKind;
  value: string;
}

/* =====================================================
   HOME SECTION ITEM
===================================================== */

/**
 * Common item structure used across
 * all supported Home sections.
 *
 * Properties are optional because
 * different sections use different data.
 */
export interface HomeSectionItem {
  id: string;

  name?: string;
  title?: string;
  label?: string;

  subtitle?: string;
  description?: string;
  message?: string;

  /**
   * Icon and visual configuration.
   */
  icon?: string;

  imageUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;

  color?: string;
  backgroundColor?: string;
  textColor?: string;

  /**
   * Service/doctor details.
   */
  specialty?: string;

  feeInr?: number;
  price?: number;

  languages?: string[];

  nextSlot?: string;

  /**
   * Offer configuration.
   */
  badge?: string;
  discountText?: string;
  couponCode?: string;

  /**
   * Action configuration.
   */
  action?: string;
  route?: string;
  ctaAction?: string;
  ctaText?: string;
  buttonText?: string;

  /**
   * Optional navigation parameters.
   */
  doctorId?: string;
  prescriptionId?: string;

  /**
   * Allow additional fields from
   * future remote configurations.
   */
  [key: string]: unknown;
}

/* =====================================================
   HOME SECTION
===================================================== */

/**
 * Home section configuration.
 *
 * type remains string intentionally.
 *
 * This allows the app to safely receive
 * unknown future section types without
 * failing configuration parsing.
 */
export interface HomeSection {
  id: string;

  type: SectionType | (string & {});

  background: SectionBackground;

  title?: string;
  subtitle?: string;

  description?: string;

  /**
   * Display items.
   */
  items: HomeSectionItem[];

  /**
   * Optional display configuration.
   */
  limit?: number;

  columns?: number;

  enabled?: boolean;

  /**
   * Future configuration fields.
   */
  [key: string]: unknown;
}

/* =====================================================
   ROOT LAYOUT CONFIG
===================================================== */

/**
 * Main /config API response.
 *
 * Example:
 *
 * {
 *   version: 1,
 *   theme: {...},
 *   tabs: [...],
 *   sections: [...]
 * }
 */
export interface LayoutConfig {
  version: number;

  theme: ThemeColors;

  tabs: AppTab[];

  sections: HomeSection[];
}

/* =====================================================
   CONFIG VALIDATION HELPERS
===================================================== */

/**
 * Check whether value is a plain object.
 */
export function isConfigRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Validate theme colors.
 *
 * Festival is optional.
 */
export function isThemeColors(
  value: unknown,
): value is ThemeColors {
  if (!isConfigRecord(value)) {
    return false;
  }

  const requiredKeys = [
    'primary',
    'secondary',
    'background',
    'surface',
    'textPrimary',
    'textSecondary',
    'accent',
  ] as const;

  const validColors =
    requiredKeys.every(
      key =>
        typeof value[key] === 'string' &&
        (value[key] as string).trim().length > 0,
    );

  if (!validColors) {
    return false;
  }

  if (value.festival === undefined) {
    return true;
  }

  if (!isConfigRecord(value.festival)) {
    return false;
  }

  return (
    typeof value.festival.name === 'string' &&
    typeof value.festival.greeting === 'string' &&
    typeof value.festival.bannerImageUrl === 'string'
  );
}

/**
 * Validate section background.
 */
export function isSectionBackground(
  value: unknown,
): value is SectionBackground {
  if (!isConfigRecord(value)) {
    return false;
  }

  const validKind =
    value.kind === 'color' ||
    value.kind === 'gradient' ||
    value.kind === 'image';

  return (
    validKind &&
    typeof value.value === 'string'
  );
}

/**
 * Validate dynamic tab.
 */
export function isAppTab(
  value: unknown,
): value is AppTab {
  if (!isConfigRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.label === 'string' &&
    typeof value.icon === 'string' &&
    isScreenType(value.screen) &&
    (
      value.visible === undefined ||
      typeof value.visible === 'boolean'
    )
  );
}

/**
 * Validate section item.
 *
 * Unknown additional properties are
 * allowed for future API extensions.
 */
export function isHomeSectionItem(
  value: unknown,
): value is HomeSectionItem {
  return (
    isConfigRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0
  );
}

/**
 * Validate Home section.
 *
 * Unknown section types are allowed.
 * SectionRenderer decides whether
 * they can be displayed.
 */
export function isHomeSection(
  value: unknown,
): value is HomeSection {
  if (!isConfigRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.type !== 'string' ||
    value.type.trim().length === 0
  ) {
    return false;
  }

  if (!isSectionBackground(value.background)) {
    return false;
  }

  if (!Array.isArray(value.items)) {
    return false;
  }

  if (
    !value.items.every(isHomeSectionItem)
  ) {
    return false;
  }

  if (
    value.title !== undefined &&
    typeof value.title !== 'string'
  ) {
    return false;
  }

  if (
    value.subtitle !== undefined &&
    typeof value.subtitle !== 'string'
  ) {
    return false;
  }

  if (
    value.enabled !== undefined &&
    typeof value.enabled !== 'boolean'
  ) {
    return false;
  }

  return true;
}

/**
 * Validate complete /config response.
 *
 * Unknown section types do not
 * invalidate the whole configuration.
 */
export function isLayoutConfig(
  value: unknown,
): value is LayoutConfig {
  if (!isConfigRecord(value)) {
    return false;
  }

  if (
    typeof value.version !== 'number' ||
    !Number.isFinite(value.version)
  ) {
    return false;
  }

  if (!isThemeColors(value.theme)) {
    return false;
  }

  if (
    !Array.isArray(value.tabs) ||
    !value.tabs.every(isAppTab)
  ) {
    return false;
  }

  if (
    !Array.isArray(value.sections) ||
    !value.sections.every(isHomeSection)
  ) {
    return false;
  }

  return true;
}

/* =====================================================
   SECTION HELPERS
===================================================== */

/**
 * Get supported sections only.
 *
 * Unknown types are skipped safely.
 */
export function getSupportedSections(
  config: LayoutConfig,
): HomeSection[] {
  return config.sections.filter(
    section =>
      section.enabled !== false &&
      isSectionType(section.type),
  );
}

/**
 * Get unsupported sections.
 *
 * Useful for development logs.
 */
export function getUnsupportedSections(
  config: LayoutConfig,
): HomeSection[] {
  return config.sections.filter(
    section =>
      !isSectionType(section.type),
  );
}

/**
 * Get visible tabs.
 */
export function getVisibleTabs(
  config: LayoutConfig,
): AppTab[] {
  return config.tabs.filter(
    tab => tab.visible !== false,
  );
}

/**
 * Get gradient colors from config.
 *
 * Example:
 * "#087F73,#42B6A2"
 *
 * Returns:
 * ["#087F73", "#42B6A2"]
 */
export function getGradientColors(
  background: SectionBackground,
): string[] {
  if (background.kind !== 'gradient') {
    return [];
  }

  return background.value
    .split(',')
    .map(color => color.trim())
    .filter(Boolean);
}

/**
 * Get section by ID.
 */
export function getSectionById(
  config: LayoutConfig,
  sectionId: string,
): HomeSection | undefined {
  return config.sections.find(
    section => section.id === sectionId,
  );
}

/**
 * Get sections by type.
 */
export function getSectionsByType(
  config: LayoutConfig,
  type: SectionType,
): HomeSection[] {
  return config.sections.filter(
    section => section.type === type,
  );
}
