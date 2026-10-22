
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  ImageBackground,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  type ListRenderItemInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  ArrowRight,
  Gift,
  Sparkles,
  Tag,
} from 'lucide-react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type {
  RootStackParamList,
} from '../../navigation/navigationTypes';

import {useAppConfig} from '../../hooks/useAppConfig';

import {
  defaultColors,
  diwaliColors,
} from '../../theme/theme';

/* =====================================================
   TYPES
===================================================== */

type OfferNavigation =
  NavigationProp<RootStackParamList>;

export interface OfferItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  discountText?: string;
  couponCode?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaAction?: string;
  action?: string;
  route?: string;
  doctorId?: string;
  prescriptionId?: string;
}

export interface OfferStripSection {
  id?: string;
  type?: 'offer_strip';
  title?: string;
  subtitle?: string;
  items?: OfferItem[];
}

export interface OfferStripProps {
  section?: OfferStripSection;
  offers?: OfferItem[];
  title?: string;
  subtitle?: string;
  onOfferPress?: (offer: OfferItem) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface OfferCardProps {
  offer: OfferItem;
  width: number;
  primaryColor: string;
  textPrimary: string;
  textSecondary: string;
  isDiwali: boolean;
  onPress: (offer: OfferItem) => void;
  testID?: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const SIDE_PADDING = 16;
const CARD_GAP = 12;
const MIN_CARD_WIDTH = 240;
const MAX_CARD_WIDTH = 310;

const NORMAL_BACKGROUND = '#E5F5F0';
const DIWALI_BACKGROUND = '#FFF0D5';

/* =====================================================
   HELPERS
===================================================== */

function normalizeAction(value?: string): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function isValidHexColor(value?: string): boolean {
  if (!value) {
    return false;
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    value,
  );
}

function getValidImageUrl(
  value?: string,
): string | undefined {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return undefined;
  }

  const url = value.trim();

  if (
    url.startsWith('https://') ||
    url.startsWith('http://')
  ) {
    return url;
  }

  return undefined;
}

function getOfferTitle(offer: OfferItem): string {
  return offer.title?.trim() || 'Healthcare Offer';
}

function getOfferDescription(
  offer: OfferItem,
): string {
  return (
    offer.subtitle?.trim() ||
    offer.description?.trim() ||
    ''
  );
}

/* =====================================================
   OFFER CARD
===================================================== */

const OfferCard = memo(function OfferCard({
  offer,
  width,
  primaryColor,
  textPrimary,
  textSecondary,
  isDiwali,
  onPress,
  testID,
}: OfferCardProps) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const imageUrl =
    getValidImageUrl(offer.imageUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const backgroundColor =
    isValidHexColor(offer.backgroundColor)
      ? offer.backgroundColor!
      : isDiwali
        ? DIWALI_BACKGROUND
        : NORMAL_BACKGROUND;

  const textColor =
    isValidHexColor(offer.textColor)
      ? offer.textColor!
      : textPrimary;

  const actionText =
    offer.ctaText?.trim() ||
    'Explore Offer';

  const offerTitle =
    getOfferTitle(offer);

  const offerDescription =
    getOfferDescription(offer);

  const showImage =
    Boolean(imageUrl && !imageFailed);

  const handlePress = useCallback(() => {
    onPress(offer);
  }, [offer, onPress]);

  const cardContent = (
    <View style={styles.cardContent}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.offerIconContainer,
            {
              backgroundColor: isDiwali
                ? 'rgba(156,77,18,0.12)'
                : 'rgba(8,127,115,0.10)',
            },
          ]}>
          {isDiwali ? (
            <Sparkles
              size={20}
              color={primaryColor}
            />
          ) : (
            <Gift
              size={20}
              color={primaryColor}
            />
          )}
        </View>

        {offer.badge ? (
          <View style={styles.badge}>
            <Tag
              size={11}
              color="#FFFFFF"
            />

            <Text
              numberOfLines={1}
              style={styles.badgeText}>
              {offer.badge}
            </Text>
          </View>
        ) : null}
      </View>

      {offer.discountText ? (
        <Text
          numberOfLines={1}
          style={[
            styles.discountText,
            {color: primaryColor},
          ]}>
          {offer.discountText}
        </Text>
      ) : null}

      <Text
        numberOfLines={2}
        style={[
          styles.offerTitle,
          {color: textColor},
        ]}>
        {offerTitle}
      </Text>

      {offerDescription ? (
        <Text
          numberOfLines={2}
          style={[
            styles.offerSubtitle,
            {
              color: isValidHexColor(
                offer.textColor,
              )
                ? textColor
                : textSecondary,
            },
          ]}>
          {offerDescription}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        {offer.couponCode ? (
          <View style={styles.couponContainer}>
            <Text
              numberOfLines={1}
              style={styles.couponText}>
              {offer.couponCode}
            </Text>
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}

        <View
          style={[
            styles.ctaButton,
            {backgroundColor: primaryColor},
          ]}>
          <Text
            numberOfLines={1}
            style={styles.ctaText}>
            {actionText}
          </Text>

          <ArrowRight
            size={15}
            color="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        `${offerTitle}. ${actionText}` +
        (offer.couponCode
          ? `. Coupon code ${offer.couponCode}`
          : '')
      }
      style={({pressed}) => [
        styles.card,
        {
          width,
          backgroundColor,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      {showImage ? (
        <ImageBackground
          source={{uri: imageUrl}}
          resizeMode="cover"
          style={styles.imageBackground}
          onError={() => {
            setImageFailed(true);
          }}>
          <View
            pointerEvents="none"
            style={styles.imageOverlay}
          />

          {cardContent}
        </ImageBackground>
      ) : (
        cardContent
      )}
    </Pressable>
  );
});

/* =====================================================
   OFFER STRIP
===================================================== */

function OfferStrip({
  section,
  offers,
  title,
  subtitle,
  onOfferPress,
  style,
  testID,
}: OfferStripProps) {
  const navigation =
    useNavigation<OfferNavigation>();

  const {config, mode} =
    useAppConfig();

  const {width: screenWidth} =
    useWindowDimensions();

  const isDiwali =
    mode === 'diwali';

  const colors = useMemo(
    () => ({
      ...(isDiwali
        ? diwaliColors
        : defaultColors),
      ...config?.theme,
    }),
    [isDiwali, config?.theme],
  );

  const cardWidth = useMemo(
    () =>
      Math.min(
        MAX_CARD_WIDTH,
        Math.max(
          MIN_CARD_WIDTH,
          screenWidth - 64,
        ),
      ),
    [screenWidth],
  );

  const items = useMemo(() => {
    const source =
      offers ?? section?.items ?? [];

    return source.filter(
      offer =>
        Boolean(
          offer &&
            typeof offer.id === 'string' &&
            offer.id.trim().length > 0,
        ),
    );
  }, [offers, section?.items]);

  const heading =
    title ??
    section?.title ??
    (isDiwali
      ? 'Diwali Special Offers'
      : 'Special Health Offers');

  const description =
    subtitle ??
    section?.subtitle ??
    'Save more on your healthcare needs';

  /* ===================================================
     NAVIGATION
  =================================================== */

  const handleOfferPress = useCallback(
    (offer: OfferItem) => {
      if (onOfferPress) {
        onOfferPress(offer);
        return;
      }

      const action = normalizeAction(
        offer.ctaAction ??
          offer.action ??
          offer.route,
      );

      switch (action) {
        case 'doctor':
        case 'doctors':
        case 'consultation':
        case 'finddoctor':
        case 'bookdoctor':
          navigation.navigate('Doctors');
          return;

        case 'booking':
        case 'bookappointment':
        case 'booknow':
          if (offer.doctorId) {
            navigation.navigate('Booking', {
              doctorId: offer.doctorId,
            });
          } else {
            navigation.navigate('Doctors');
          }
          return;

        case 'bookings':
        case 'appointments':
        case 'mybookings':
          navigation.navigate('MainTabs', {
            screen: 'Bookings',
          });
          return;

        case 'prescription':
        case 'prescriptions':
        case 'myprescriptions':
        case 'prescriptiondetail':
        case 'viewprescription':
          if (offer.prescriptionId) {
            navigation.navigate(
              'PrescriptionDetail',
              {
                prescriptionId:
                  offer.prescriptionId,
              },
            );
          } else {
            navigation.navigate('MainTabs', {
              screen: 'Prescriptions',
            });
          }
          return;

        case 'reminder':
        case 'reminders':
        case 'medicinereminders':
          navigation.navigate('Reminders');
          return;

        case 'profile':
        case 'myprofile':
          navigation.navigate('MainTabs', {
            screen: 'Profile',
          });
          return;

        case 'home':
          navigation.navigate('MainTabs', {
            screen: 'Home',
          });
          return;

        default:
          navigation.navigate('Doctors');
          return;
      }
    },
    [navigation, onOfferPress],
  );

  /* ===================================================
     LIST RENDERING
  =================================================== */

  const renderOffer = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<OfferItem>) => (
      <OfferCard
        offer={item}
        width={cardWidth}
        primaryColor={colors.primary}
        textPrimary={colors.textPrimary}
        textSecondary={colors.textSecondary}
        isDiwali={isDiwali}
        onPress={handleOfferPress}
        testID={
          testID
            ? `${testID}-offer-${index}`
            : undefined
        }
      />
    ),
    [
      cardWidth,
      colors.primary,
      colors.textPrimary,
      colors.textSecondary,
      isDiwali,
      handleOfferPress,
      testID,
    ],
  );

  const keyExtractor = useCallback(
    (item: OfferItem) => item.id,
    [],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <View
      testID={testID}
      style={[styles.container, style]}>
      <View style={styles.headingContainer}>
        <View style={styles.headingRow}>
          <Text
            style={[
              styles.heading,
              {color: colors.textPrimary},
            ]}>
            {heading}
          </Text>

          {isDiwali ? (
            <Sparkles
              size={20}
              color={colors.primary}
            />
          ) : (
            <Gift
              size={20}
              color={colors.primary}
            />
          )}
        </View>

        {description ? (
          <Text
            style={[
              styles.sectionSubtitle,
              {color: colors.textSecondary},
            ]}>
            {description}
          </Text>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderOffer}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.listContent
        }
        ItemSeparatorComponent={
          OfferSeparator
        }
        snapToInterval={
          cardWidth + CARD_GAP
        }
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={false}
        nestedScrollEnabled
        getItemLayout={(_, index) => ({
          length: cardWidth + CARD_GAP,
          offset:
            index * (cardWidth + CARD_GAP),
          index,
        })}
      />
    </View>
  );
}

/* =====================================================
   SEPARATOR
===================================================== */

function OfferSeparator() {
  return (
    <View style={{width: CARD_GAP}} />
  );
}

/* =====================================================
   EXPORT
===================================================== */

export default memo(OfferStrip);

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 14,
  },

  headingContainer: {
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 15,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  heading: {
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  listContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: 8,
  },

  card: {
    minHeight: 220,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  imageBackground: {
    flex: 1,
  },

  /**
   * React Native 0.88 TypeScript fix:
   * absoluteFillObject -> absoluteFill
   */
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      'rgba(255,255,255,0.82)',
  },

  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  offerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: 150,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  discountText: {
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
  },

  offerTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 5,
  },

  offerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },

  couponContainer: {
    maxWidth: '42%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    backgroundColor:
      'rgba(255,255,255,0.85)',
  },

  couponText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },

  footerSpacer: {
    flex: 1,
  },

  ctaButton: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 1,
  },

  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
});
