
import React, {
  memo,
  useCallback,
  useMemo,
} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import type {
  HomeSection,
} from '../../types/config';

import type {
  Doctor,
} from '../../types/doctor';

import {
  useAppConfig,
} from '../../hooks/useAppConfig';

import {
  defaultColors,
} from '../../theme/theme';

import SectionBackground, {
  type SectionBackgroundConfig,
} from '../common/SectionBackground';

import HeroBanner, {
  type HeroBannerSection,
} from './HeroBanner';

import CategoryChips, {
  type CategoryChipItem,
} from './CategoryChips';

import QuickActions, {
  type QuickActionItem,
} from './QuickActions';

import ServiceGrid, {
  type ServiceGridItem,
} from './ServiceGrid';

import DoctorCarousel from './DoctorCarousel';

import OfferStrip, {
  type OfferItem,
} from './OfferStrip';

/* =====================================================
   SUPPORTED SECTION TYPES
===================================================== */

export const SUPPORTED_SECTION_TYPES = [
  'hero_banner',
  'category_chips',
  'quick_actions',
  'service_grid',
  'doctor_carousel',
  'offer_strip',
] as const;

export type SupportedSectionType =
  (typeof SUPPORTED_SECTION_TYPES)[number];

export function isSupportedSection(
  type: string,
): type is SupportedSectionType {
  return (
    SUPPORTED_SECTION_TYPES as readonly string[]
  ).includes(type);
}

/* =====================================================
   TYPES
===================================================== */

type SectionItem = {
  id?: string;

  name?: string;
  title?: string;
  label?: string;

  subtitle?: string;
  description?: string;
  message?: string;

  icon?: string;

  color?: string;
  backgroundColor?: string;
  textColor?: string;

  price?: number;
  feeInr?: number;
  specialty?: string;

  badge?: string;
  nextSlot?: string;

  imageUrl?: string;
  photoUrl?: string;

  action?: string;
  route?: string;
  ctaAction?: string;

  ctaText?: string;
  buttonText?: string;

  doctorId?: string;
  prescriptionId?: string;

  discountText?: string;
  couponCode?: string;

  languages?: string[];
};

type BackgroundValue = {
  kind?: string;
  type?: string;

  value?: string;
  color?: string;
  colors?: string[];

  imageUrl?: string;
  url?: string;

  overlayColor?: string;
  overlayOpacity?: number;

  borderRadius?: number;
};

type ConfigSection = HomeSection & {
  enabled?: boolean;
  subtitle?: string;
  description?: string;
  limit?: number;
};

interface SectionRendererProps {
  section: HomeSection;

  onNavigate: (
    screen: string,
    id?: string,
  ) => void;

  scrollY?: React.ComponentProps<
    typeof HeroBanner
  >['scrollY'];
}

/* =====================================================
   SAFE VALUE HELPERS
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

function getString(
  value: unknown,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const result = value.trim();

  return result.length > 0
    ? result
    : undefined;
}

function getNumber(
  value: unknown,
): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function getStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === 'string' &&
      item.trim().length > 0,
  );
}

function firstString(
  ...values: unknown[]
): string | undefined {
  for (const value of values) {
    const result = getString(value);

    if (result) {
      return result;
    }
  }

  return undefined;
}

/* =====================================================
   SECTION ITEM NORMALIZATION
===================================================== */

function normalizeItem(
  value: unknown,
): SectionItem | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),

    name: getString(value.name),
    title: getString(value.title),
    label: getString(value.label),

    subtitle: getString(value.subtitle),
    description: getString(
      value.description,
    ),
    message: getString(value.message),

    icon: getString(value.icon),

    color: getString(value.color),
    backgroundColor: getString(
      value.backgroundColor,
    ),
    textColor: getString(
      value.textColor,
    ),

    price: getNumber(value.price),
    feeInr: getNumber(value.feeInr),

    specialty: getString(
      value.specialty,
    ),

    badge: getString(value.badge),
    nextSlot: getString(
      value.nextSlot,
    ),

    imageUrl: getString(
      value.imageUrl,
    ),
    photoUrl: getString(
      value.photoUrl,
    ),

    action: getString(value.action),
    route: getString(value.route),
    ctaAction: getString(
      value.ctaAction,
    ),

    ctaText: getString(
      value.ctaText,
    ),
    buttonText: getString(
      value.buttonText,
    ),

    doctorId: getString(
      value.doctorId,
    ),
    prescriptionId: getString(
      value.prescriptionId,
    ),

    discountText: getString(
      value.discountText,
    ),
    couponCode: getString(
      value.couponCode,
    ),

    languages: getStringArray(
      value.languages,
    ),
  };
}

function getSectionItems(
  section: HomeSection,
): SectionItem[] {
  if (!Array.isArray(section.items)) {
    return [];
  }

  return section.items
    .map(normalizeItem)
    .filter(
      (item): item is SectionItem =>
        item !== null,
    );
}

/* =====================================================
   BACKGROUND HANDLING
===================================================== */

/**
 * Supports:
 *
 * {kind: 'color', value: '#FFFFFF'}
 *
 * {kind: 'gradient',
 *  value: '#087F73,#42B6A2'}
 *
 * {kind: 'gradient',
 *  colors: ['#087F73', '#42B6A2']}
 *
 * {kind: 'image',
 *  value: 'https://example.com/banner.jpg'}
 */

function resolveBackground(
  background: unknown,
  fallbackColor: string,
): SectionBackgroundConfig {
  if (typeof background === 'string') {
    return {
      type: 'solid',
      color:
        getString(background) ??
        fallbackColor,
    };
  }

  if (!isRecord(background)) {
    return {
      type: 'solid',
      color: fallbackColor,
    };
  }

  const value =
    background as BackgroundValue;

  const kind = firstString(
    value.kind,
    value.type,
  );

  const borderRadius =
    getNumber(value.borderRadius);

  if (
    kind === 'color' ||
    kind === 'solid'
  ) {
    return {
      type: 'solid',

      color:
        firstString(
          value.value,
          value.color,
        ) ?? fallbackColor,

      borderRadius,
    };
  }

  if (kind === 'gradient') {
    let gradientColors =
      getStringArray(value.colors);

    /**
     * Important:
     * Normal/Diwali JSON files use
     * comma-separated gradient values.
     */
    if (gradientColors.length < 2) {
      gradientColors = (
        value.value ?? ''
      )
        .split(',')
        .map(color => color.trim())
        .filter(Boolean);
    }

    if (gradientColors.length < 2) {
      gradientColors = [
        fallbackColor,
        fallbackColor,
      ];
    }

    return {
      type: 'gradient',
      colors: gradientColors,
      borderRadius,
    };
  }

  if (kind === 'image') {
    const imageUrl =
      firstString(
        value.imageUrl,
        value.url,
        value.value,
      );

    if (!imageUrl) {
      return {
        type: 'solid',
        color: fallbackColor,
      };
    }

    const opacity =
      getNumber(
        value.overlayOpacity,
      );

    return {
      type: 'image',

      imageUrl,

      overlayColor: getString(
        value.overlayColor,
      ),

      overlayOpacity:
        opacity === undefined
          ? undefined
          : Math.max(
              0,
              Math.min(1, opacity),
            ),

      borderRadius,
    };
  }

  return {
    type: 'solid',
    color: fallbackColor,
  };
}

/* =====================================================
   ACTION HELPERS
===================================================== */

function normalizeAction(
  action?: string,
): string {
  return (action ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function resolveActionId(
  item: {
    doctorId?: string;
    prescriptionId?: string;
  },
  action?: string,
): string | undefined {
  const normalized =
    normalizeAction(action);

  if (
    normalized ===
      'prescriptiondetail' ||
    normalized ===
      'viewprescription'
  ) {
    return item.prescriptionId;
  }

  return item.doctorId;
}

/* =====================================================
   SECTION RENDERER
===================================================== */

function SectionRenderer({
  section,
  onNavigate,
  scrollY,
}: SectionRendererProps) {
  const {config} =
    useAppConfig();

  const colors = {
    ...defaultColors,
    ...config?.theme,
  };

  const currentSection =
    section as ConfigSection;

  const items = useMemo(
    () => getSectionItems(section),
    [section],
  );

  const background = useMemo(
    () =>
      resolveBackground(
        section.background,
        colors.background,
      ),
    [
      section.background,
      colors.background,
    ],
  );

  /**
   * Unified navigation for all
   * config-driven Home sections.
   */
  const handleAction = useCallback(
    (
      action?: string,
      id?: string,
    ): void => {
      const normalized =
        normalizeAction(action);

      switch (normalized) {
        case 'doctor':
        case 'doctors':
        case 'finddoctor':
        case 'finddoctors':
        case 'bookdoctor':
        case 'consultation':
        case 'consultdoctor':
        case 'lab':
        case 'labtests':
        case 'medicines':
        case 'pharmacy':
        case 'healthcheckup':
        case 'checkup':
          onNavigate('Doctors');
          return;

        case 'booking':
        case 'bookappointment':
        case 'booknow':
        case 'consultnow':
          if (id) {
            onNavigate(
              'Booking',
              id,
            );
          } else {
            onNavigate(
              'Doctors',
            );
          }
          return;

        case 'bookings':
        case 'mybookings':
        case 'appointments':
        case 'myappointments':
          onNavigate(
            'Bookings',
          );
          return;

        case 'prescription':
        case 'prescriptions':
        case 'myprescriptions':
          onNavigate(
            'Prescriptions',
          );
          return;

        case 'prescriptiondetail':
        case 'viewprescription':
          if (id) {
            onNavigate(
              'PrescriptionDetail',
              id,
            );
          } else {
            onNavigate(
              'Prescriptions',
            );
          }
          return;

        case 'reminder':
        case 'reminders':
        case 'medicinereminders':
        case 'medicineschedule':
          onNavigate(
            'Reminders',
          );
          return;

        case 'profile':
        case 'myprofile':
          onNavigate(
            'Profile',
          );
          return;

        case 'home':
          onNavigate(
            'Home',
          );
          return;

        default:
          if (__DEV__) {
            console.warn(
              '[SectionRenderer] Unknown action:',
              action,
            );
          }
      }
    },
    [onNavigate],
  );

  /**
   * Ignore disabled sections.
   */
  if (
    currentSection.enabled === false
  ) {
    return null;
  }

  /**
   * Unknown sections should never
   * crash the application.
   */
  if (
    !isSupportedSection(
      section.type,
    )
  ) {
    if (__DEV__) {
      console.warn(
        '[SectionRenderer] Unsupported section:',
        section.type,
      );
    }

    return null;
  }

  /* =================================================
     HERO BANNER
  ================================================= */

  if (
    section.type ===
    'hero_banner'
  ) {
    const firstItem =
      items[0];

    const heroSection:
      HeroBannerSection = {
      id: section.id,
      type: 'hero_banner',

      title:
        firstString(
          section.title,
          firstItem?.title,
          firstItem?.name,
        ) ??
        'Your Health Matters',

      subtitle:
        firstString(
          currentSection.subtitle,
          firstItem?.subtitle,
          firstItem?.description,
          firstItem?.message,
        ),

      imageUrl:
        firstItem?.imageUrl,

      badge:
        firstItem?.badge,

      buttonText:
        firstString(
          firstItem?.buttonText,
          firstItem?.ctaText,
        ) ??
        'Explore Doctors',

      ctaAction:
        firstString(
          firstItem?.ctaAction,
          firstItem?.action,
          firstItem?.route,
        ) ??
        'doctors',

      backgroundColor:
        firstItem?.backgroundColor,
    };

    const heroAction =
      heroSection.ctaAction;

    return (
      <View
        style={
          styles.heroWrapper
        }>
        <HeroBanner
          section={heroSection}
          scrollY={scrollY}
          onPress={() => {
            handleAction(
              heroAction,
              resolveActionId(
                firstItem ?? {},
                heroAction,
              ),
            );
          }}
        />
      </View>
    );
  }

  /* =================================================
     CATEGORY CHIPS
  ================================================= */

  if (
    section.type ===
    'category_chips'
  ) {
    const categories:
      CategoryChipItem[] =
      items.map(
        (item, index) => ({
          id:
            item.id ??
            `category-${index}`,

          title:
            firstString(
              item.title,
              item.name,
              item.label,
            ) ??
            'Healthcare',

          icon:
            item.icon,

          color:
            item.color,
        }),
      );

    const categoryById =
      new Map(
        categories.map(
          (category, index) => [
            category.id,
            items[index],
          ] as const,
        ),
      );

    return (
      <SectionBackground
        background={background}>
        <CategoryChips
          section={{
            id: section.id,
            type: 'category_chips',
            title: section.title,
            subtitle:
              currentSection.subtitle,
            items: categories,
          }}
          onCategoryPress={
            category => {
              const item =
                categoryById.get(
                  category.id,
                );

              const action =
                firstString(
                  item?.action,
                  item?.route,
                ) ??
                'doctors';

              handleAction(
                action,
                resolveActionId(
                  item ?? {},
                  action,
                ),
              );
            }
          }
        />
      </SectionBackground>
    );
  }

  /* =================================================
     QUICK ACTIONS
  ================================================= */

  if (
    section.type ===
    'quick_actions'
  ) {
    const actions:
      QuickActionItem[] =
      items.map(
        (item, index) => ({
          id:
            item.id ??
            `action-${index}`,

          title:
            firstString(
              item.title,
              item.name,
              item.label,
            ) ??
            'Healthcare',

          subtitle:
            firstString(
              item.subtitle,
              item.description,
            ),

          icon:
            item.icon,

          color:
            item.color,

          backgroundColor:
            item.backgroundColor,

          action:
            firstString(
              item.action,
              item.route,
              item.ctaAction,
              item.name,
              item.title,
            ),

          doctorId:
            item.doctorId,

          prescriptionId:
            item.prescriptionId,
        }),
      );

    return (
      <SectionBackground
        background={background}>
        <QuickActions
          section={{
            id: section.id,
            type: 'quick_actions',
            title: section.title,
            subtitle:
              currentSection.subtitle,
            items: actions,
          }}
          onActionPress={
            action => {
              const actionName =
                firstString(
                  action.action,
                  action.route,
                  action.title,
                );

              handleAction(
                actionName,
                resolveActionId(
                  action,
                  actionName,
                ),
              );
            }
          }
        />
      </SectionBackground>
    );
  }

  /* =================================================
     SERVICE GRID
  ================================================= */

  if (
    section.type ===
    'service_grid'
  ) {
    return (
      <SectionBackground
        background={background}>
        <ServiceGrid
          section={section}
          onServicePress={(
            service:
              ServiceGridItem,
          ) => {
            const action =
              firstString(
                service.action,
                service.route,
              ) ??
              'doctors';

            handleAction(
              action,
              resolveActionId(
                service,
                action,
              ),
            );
          }}
        />
      </SectionBackground>
    );
  }

  /* =================================================
     DOCTOR CAROUSEL
  ================================================= */

  if (
    section.type ===
    'doctor_carousel'
  ) {
    const doctorsFromConfig:
      Doctor[] = items
      .filter(
        item =>
          Boolean(
            item.id &&
              item.name &&
              item.specialty,
          ),
      )
      .map(item => ({
        id: item.id!,
        name: item.name!,
        specialty:
          item.specialty!,

        photoUrl:
          item.photoUrl ??
          item.imageUrl ??
          '',

        feeInr:
          item.feeInr ??
          item.price ??
          0,

        languages:
          item.languages ?? [],
      }));

    return (
      <SectionBackground
        background={background}>
        <DoctorCarousel
          section={{
            id: section.id,
            type: 'doctor_carousel',
            title: section.title,
            subtitle:
              currentSection.subtitle,
            limit:
              currentSection.limit,
          }}
          doctors={
            doctorsFromConfig.length > 0
              ? doctorsFromConfig
              : undefined
          }
          onDoctorPress={
            doctor => {
              onNavigate(
                'Booking',
                doctor.id,
              );
            }
          }
          onViewAll={() => {
            onNavigate(
              'Doctors',
            );
          }}
        />
      </SectionBackground>
    );
  }

  /* =================================================
     OFFER STRIP
  ================================================= */

  if (
    section.type ===
    'offer_strip'
  ) {
    const offers:
      OfferItem[] =
      items.map(
        (item, index) => ({
          id:
            item.id ??
            `offer-${index}`,

          title:
            firstString(
              item.title,
              item.name,
            ) ??
            'Special Healthcare Offer',

          subtitle:
            firstString(
              item.subtitle,
              item.description,
              item.message,
            ),

          badge:
            item.badge,

          discountText:
            item.discountText,

          couponCode:
            item.couponCode,

          imageUrl:
            item.imageUrl,

          backgroundColor:
            item.backgroundColor,

          textColor:
            item.textColor,

          ctaText:
            firstString(
              item.ctaText,
              item.buttonText,
            ),

          ctaAction:
            firstString(
              item.ctaAction,
              item.action,
              item.route,
            ) ??
            'doctors',

          doctorId:
            item.doctorId,
        }),
      );

    const offerById =
      new Map(
        offers.map(
          (offer, index) => [
            offer.id,
            items[index],
          ] as const,
        ),
      );

    return (
      <SectionBackground
        background={background}>
        <OfferStrip
          section={{
            id: section.id,
            type: 'offer_strip',
            title: section.title,
            subtitle:
              currentSection.subtitle,
            items: offers,
          }}
          onOfferPress={
            offer => {
              const sourceItem =
                offerById.get(
                  offer.id,
                );

              const action =
                offer.ctaAction ??
                'doctors';

              handleAction(
                action,
                resolveActionId(
                  {
                    doctorId:
                      offer.doctorId,

                    prescriptionId:
                      sourceItem
                        ?.prescriptionId,
                  },
                  action,
                ),
              );
            }
          }
        />
      </SectionBackground>
    );
  }

  return null;
}

export default memo(
  SectionRenderer,
);

const styles =
  StyleSheet.create({
    heroWrapper: {
      width: '100%',
    },
  });
