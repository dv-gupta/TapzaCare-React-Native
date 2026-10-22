
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ListRenderItemInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  ArrowRight,
  Stethoscope,
  Languages,
  IndianRupee,
  UserRound,
} from 'lucide-react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {mockApi} from '../../api/mockApi';

import type {
  Doctor,
} from '../../types/doctor';

import type {
  RootStackParamList,
} from '../../navigation/navigationTypes';

import {
  useAppConfig,
} from '../../hooks/useAppConfig';

import {
  defaultColors,
  diwaliColors,
} from '../../theme/theme';

import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

/* =====================================================
   TYPES
===================================================== */

type DoctorNavigation =
  NavigationProp<RootStackParamList>;

export interface DoctorCarouselSection {
  id?: string;
  type?: 'doctor_carousel';
  title?: string;
  subtitle?: string;
  limit?: number;
}

export interface DoctorCarouselProps {
  section?: DoctorCarouselSection;

  title?: string;

  doctors?: Doctor[];

  onDoctorPress?: (
    doctor: Doctor,
  ) => void;

  onViewAll?: () => void;

  showViewAll?: boolean;

  style?: StyleProp<ViewStyle>;

  testID?: string;
}

interface DoctorCardColors {
  primary: string;
  secondary: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
}

interface DoctorCarouselCardProps {
  doctor: Doctor;

  width: number;

  colors: DoctorCardColors;

  onPress: (
    doctor: Doctor,
  ) => void;

  testID?: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const CARD_GAP = 12;
const SIDE_PADDING = 16;

const MIN_CARD_WIDTH = 220;
const MAX_CARD_WIDTH = 290;

/* =====================================================
   HELPERS
===================================================== */

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return 'Unable to load doctors. Please try again.';
}

function formatFee(
  fee: number,
): string {
  if (
    !Number.isFinite(fee) ||
    fee < 0
  ) {
    return '0';
  }

  return fee.toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  );
}

function isValidImageUrl(
  value: string,
): boolean {
  return (
    value.startsWith('https://') ||
    value.startsWith('http://')
  );
}

/* =====================================================
   DOCTOR CARD
===================================================== */

const DoctorCarouselCard = memo(
  function DoctorCarouselCard({
    doctor,
    width,
    colors,
    onPress,
    testID,
  }: DoctorCarouselCardProps) {
    const [
      imageFailed,
      setImageFailed,
    ] = useState(false);

    const imageUrl =
      typeof doctor.photoUrl ===
        'string'
        ? doctor.photoUrl.trim()
        : '';

    const hasValidImage =
      isValidImageUrl(imageUrl);

    const languages =
      Array.isArray(
        doctor.languages,
      )
        ? doctor.languages
        : [];

    const doctorName =
      doctor.name?.trim() ||
      'Doctor';

    const specialty =
      doctor.specialty?.trim() ||
      'General Physician';

    const fee =
      typeof doctor.feeInr ===
        'number'
        ? doctor.feeInr
        : 0;

    /**
     * Reset failed image state
     * when image URL changes.
     */
    useEffect(() => {
      setImageFailed(false);
    }, [imageUrl]);

    const handlePress =
      useCallback(() => {
        onPress(doctor);
      }, [
        doctor,
        onPress,
      ]);

    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={
          `Book appointment with ${doctorName}, ` +
          `${specialty}, consultation fee ${fee} rupees`
        }
        style={({pressed}) => [
          styles.card,
          {
            width,
            backgroundColor:
              colors.surface,
            borderColor:
              colors.secondary,
            opacity:
              pressed
                ? 0.85
                : 1,
          },
        ]}>
        {/* Doctor image + info */}
        <View
          style={
            styles.doctorTopRow
          }>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            {hasValidImage &&
            !imageFailed ? (
              <Image
                source={{
                  uri: imageUrl,
                }}
                style={
                  styles.avatar
                }
                resizeMode="cover"
                onError={() => {
                  setImageFailed(
                    true,
                  );
                }}
                accessibilityLabel={
                  doctorName
                }
              />
            ) : (
              <View
                style={
                  styles.avatarFallback
                }>
                <UserRound
                  size={30}
                  color={
                    colors.primary
                  }
                />
              </View>
            )}
          </View>

          <View
            style={
              styles.doctorInfo
            }>
            <Text
              numberOfLines={2}
              style={[
                styles.doctorName,
                {
                  color:
                    colors.textPrimary,
                },
              ]}>
              {doctorName}
            </Text>

            <Text
              numberOfLines={2}
              style={[
                styles.specialty,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {specialty}
            </Text>
          </View>
        </View>

        {/* Languages */}
        <View
          style={
            styles.infoRow
          }>
          <Languages
            size={15}
            color={
              colors.textSecondary
            }
          />

          <Text
            numberOfLines={1}
            style={[
              styles.infoText,
              {
                color:
                  colors.textSecondary,
              },
            ]}>
            {languages.length > 0
              ? languages.join(', ')
              : 'Language not specified'}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                colors.secondary,
            },
          ]}
        />

        {/* Fee + Booking */}
        <View
          style={
            styles.feeRow
          }>
          <View
            style={
              styles.feeContainer
            }>
            <Text
              style={[
                styles.feeLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              Consultation Fee
            </Text>

            <View
              style={
                styles.priceRow
              }>
              <IndianRupee
                size={17}
                color={
                  colors.textPrimary
                }
                strokeWidth={2.5}
              />

              <Text
                style={[
                  styles.feeAmount,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}>
                {formatFee(
                  fee,
                )}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.bookButton,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}>
            <Text
              style={
                styles.bookButtonText
              }>
              Book Now
            </Text>

            <ArrowRight
              size={15}
              color="#FFFFFF"
            />
          </View>
        </View>
      </Pressable>
    );
  },
);

/* =====================================================
   LOADING SKELETON
===================================================== */

interface DoctorSkeletonProps {
  cardWidth: number;
  colors: DoctorCardColors;
}

function DoctorSkeleton({
  cardWidth,
  colors,
}: DoctorSkeletonProps) {
  return (
    <View
      style={
        styles.skeletonRow
      }>
      {[0, 1].map(index => (
        <View
          key={index}
          style={[
            styles.skeletonCard,
            {
              width: cardWidth,
              backgroundColor:
                colors.surface,
              borderColor:
                colors.secondary,
            },
          ]}>
          <View
            style={[
              styles.skeletonAvatar,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}
          />

          <View
            style={[
              styles.skeletonLineLong,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}
          />

          <View
            style={[
              styles.skeletonLineShort,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}
          />

          <View
            style={[
              styles.skeletonDivider,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}
          />

          <View
            style={[
              styles.skeletonButton,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

/* =====================================================
   DOCTOR CAROUSEL
===================================================== */

function DoctorCarousel({
  section,
  title,
  doctors: providedDoctors,
  onDoctorPress,
  onViewAll,
  showViewAll = true,
  style,
  testID,
}: DoctorCarouselProps) {
  const navigation =
    useNavigation<DoctorNavigation>();

  const {
    config,
    mode,
  } = useAppConfig();

  const {
    width: screenWidth,
  } = useWindowDimensions();

  /* =================================================
     THEME
  ================================================= */

  const colors =
    useMemo(
      () => ({
        ...(mode === 'diwali'
          ? diwaliColors
          : defaultColors),

        ...config?.theme,
      }),
      [
        mode,
        config?.theme,
      ],
    );

  /* =================================================
     RESPONSIVE CARD WIDTH
  ================================================= */

  const cardWidth =
    useMemo(
      () =>
        Math.min(
          MAX_CARD_WIDTH,
          Math.max(
            MIN_CARD_WIDTH,
            screenWidth - 72,
          ),
        ),
      [
        screenWidth,
      ],
    );

  /* =================================================
     STATE
  ================================================= */

  const [
    fetchedDoctors,
    setFetchedDoctors,
  ] = useState<Doctor[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(
    providedDoctors === undefined,
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const mountedRef =
    useRef(false);

  const requestIdRef =
    useRef(0);

  /* =================================================
     FETCH DOCTORS
  ================================================= */

  const loadDoctors =
    useCallback(
      async () => {
        if (
          providedDoctors !==
          undefined
        ) {
          return;
        }

        const requestId =
          ++requestIdRef.current;

        if (
          mountedRef.current
        ) {
          setLoading(true);
          setError(null);
        }

        try {
          const response =
            await mockApi.getDoctors();

          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setFetchedDoctors(
            Array.isArray(
              response,
            )
              ? response
              : [],
          );

          setError(null);
        } catch (
          fetchError
        ) {
          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setError(
            getErrorMessage(
              fetchError,
            ),
          );
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              requestIdRef.current
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [
        providedDoctors,
      ],
    );

  /* =================================================
     LIFECYCLE
  ================================================= */

  useEffect(() => {
    mountedRef.current = true;

    if (
      providedDoctors ===
      undefined
    ) {
      void loadDoctors();
    } else {
      requestIdRef.current += 1;
    }

    return () => {
      mountedRef.current = false;

      requestIdRef.current += 1;
    };
  }, [
    loadDoctors,
    providedDoctors,
  ]);

  /* =================================================
     NAVIGATION
  ================================================= */

  const handleDoctorPress =
    useCallback(
      (
        doctor:
          Doctor,
      ) => {
        if (
          onDoctorPress
        ) {
          onDoctorPress(
            doctor,
          );
          return;
        }

        navigation.navigate(
          'Booking',
          {
            doctorId:
              doctor.id,
          },
        );
      },
      [
        navigation,
        onDoctorPress,
      ],
    );

  const handleViewAll =
    useCallback(
      () => {
        if (
          onViewAll
        ) {
          onViewAll();
          return;
        }

        navigation.navigate(
          'Doctors',
        );
      },
      [
        navigation,
        onViewAll,
      ],
    );

  /* =================================================
     DISPLAY DATA
  ================================================= */

  const displayDoctors =
    useMemo(() => {
      const source =
        providedDoctors ??
        fetchedDoctors;

      if (
        !Array.isArray(
          source,
        )
      ) {
        return [];
      }

      const validDoctors =
        source.filter(
          doctor =>
            doctor &&
            typeof doctor.id ===
              'string' &&
            doctor.id.trim()
              .length > 0,
        );

      const limit =
        section?.limit;

      if (
        typeof limit ===
          'number' &&
        Number.isFinite(
          limit,
        ) &&
        limit > 0
      ) {
        return validDoctors.slice(
          0,
          Math.floor(limit),
        );
      }

      return validDoctors;
    }, [
      providedDoctors,
      fetchedDoctors,
      section?.limit,
    ]);

  const heading =
    title ??
    section?.title ??
    'Our Doctors';

  const subtitle =
    section?.subtitle ??
    'Find experienced doctors for your healthcare needs';

  const shouldShowLoading =
    providedDoctors === undefined &&
    loading;

  const shouldShowError =
    providedDoctors === undefined &&
    Boolean(error);

  /* =================================================
     RENDER DOCTOR
  ================================================= */

  const renderDoctor =
    useCallback(
      ({
        item,
        index,
      }: ListRenderItemInfo<Doctor>) => (
        <DoctorCarouselCard
          doctor={
            item
          }
          width={
            cardWidth
          }
          colors={
            colors
          }
          onPress={
            handleDoctorPress
          }
          testID={
            testID
              ? `${testID}-doctor-${index}`
              : undefined
          }
        />
      ),
      [
        cardWidth,
        colors,
        handleDoctorPress,
        testID,
      ],
    );

  const keyExtractor =
    useCallback(
      (
        item:
          Doctor,
      ) => item.id,
      [],
    );

  /* =================================================
     RENDER
  ================================================= */

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        style,
      ]}>
      {/* Header */}
      <View
        style={
          styles.headingRow
        }>
        <View
          style={
            styles.headingContent
          }>
          <Text
            style={[
              styles.heading,
              {
                color:
                  colors.textPrimary,
              },
            ]}>
            {heading}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {showViewAll &&
          !shouldShowLoading &&
          !shouldShowError && (
            <Pressable
              onPress={
                handleViewAll
              }
              accessibilityRole="button"
              accessibilityLabel="View all doctors"
              style={({pressed}) => [
                styles.viewAllButton,
                {
                  opacity:
                    pressed
                      ? 0.7
                      : 1,
                },
              ]}>
              <Text
                style={[
                  styles.viewAllText,
                  {
                    color:
                      colors.primary,
                  },
                ]}>
                View All
              </Text>

              <ArrowRight
                size={16}
                color={
                  colors.primary
                }
              />
            </Pressable>
          )}
      </View>

      {/* Loading */}
      {shouldShowLoading ? (
        <DoctorSkeleton
          cardWidth={
            cardWidth
          }
          colors={
            colors
          }
        />
      ) : shouldShowError ? (
        /* Error */
        <View
          style={
            styles.stateContainer
          }>
          <ErrorState
            type="network"
            title="Unable to Load Doctors"
            message={
              error ??
              'Something went wrong.'
            }
            onRetry={() => {
              void loadDoctors();
            }}
          />
        </View>
      ) : displayDoctors.length ===
        0 ? (
        /* Empty */
        <View
          style={
            styles.stateContainer
          }>
          <EmptyState
            icon={
              Stethoscope
            }
            title="No Doctors Available"
            message="There are no doctors available right now. Please check again later."
            actionTitle={
              providedDoctors ===
              undefined
                ? 'Try Again'
                : undefined
            }
            onAction={
              providedDoctors ===
              undefined
                ? () => {
                    void loadDoctors();
                  }
                : undefined
            }
          />
        </View>
      ) : (
        /* Horizontal carousel */
        <FlatList
          data={
            displayDoctors
          }
          horizontal
          keyExtractor={
            keyExtractor
          }
          renderItem={
            renderDoctor
          }
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.listContent
          }
          ItemSeparatorComponent={
            DoctorSeparator
          }
          snapToInterval={
            cardWidth +
            CARD_GAP
          }
          snapToAlignment="start"
          decelerationRate="fast"
          removeClippedSubviews={
            false
          }
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          nestedScrollEnabled
          getItemLayout={(
            _,
            index,
          ) => ({
            length:
              cardWidth +
              CARD_GAP,

            offset:
              (
                cardWidth +
                CARD_GAP
              ) * index,

            index,
          })}
        />
      )}
    </View>
  );
}

/* =====================================================
   SEPARATOR
===================================================== */

function DoctorSeparator() {
  return (
    <View
      style={{
        width: CARD_GAP,
      }}
    />
  );
}

export default memo(
  DoctorCarousel,
);

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: 14,
    },

    headingRow: {
      paddingHorizontal:
        SIDE_PADDING,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 16,
      gap: 8,
    },

    headingContent: {
      flex: 1,
    },

    heading: {
      fontSize: 19,
      fontWeight: '800',
    },

    subtitle: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    viewAllButton: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 4,
      paddingHorizontal: 4,
    },

    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
    },

    listContent: {
      paddingHorizontal:
        SIDE_PADDING,
      paddingBottom: 8,
    },

    stateContainer: {
      marginHorizontal:
        SIDE_PADDING,
    },

    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 15,
      minHeight: 208,
      justifyContent:
        'space-between',
    },

    doctorTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    avatarContainer: {
      width: 68,
      height: 68,
      borderRadius: 16,
      overflow: 'hidden',
    },

    avatar: {
      width: '100%',
      height: '100%',
    },

    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    doctorInfo: {
      flex: 1,
    },

    doctorName: {
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 21,
    },

    specialty: {
      fontSize: 12,
      marginTop: 5,
      lineHeight: 17,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 15,
    },

    infoText: {
      flex: 1,
      fontSize: 12,
    },

    divider: {
      height: 1,
      marginVertical: 15,
    },

    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 8,
    },

    feeContainer: {
      flexShrink: 1,
    },

    feeLabel: {
      fontSize: 11,
      marginBottom: 5,
    },

    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    feeAmount: {
      fontSize: 19,
      fontWeight: '800',
    },

    bookButton: {
      minHeight: 42,
      paddingHorizontal: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 5,
    },

    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },

    skeletonRow: {
      flexDirection: 'row',
      paddingHorizontal:
        SIDE_PADDING,
      gap: CARD_GAP,
      overflow: 'hidden',
    },

    skeletonCard: {
      height: 208,
      borderRadius: 18,
      borderWidth: 1,
      padding: 15,
    },

    skeletonAvatar: {
      width: 68,
      height: 68,
      borderRadius: 16,
    },

    skeletonLineLong: {
      width: '85%',
      height: 13,
      borderRadius: 7,
      marginTop: 15,
    },

    skeletonLineShort: {
      width: '55%',
      height: 11,
      borderRadius: 6,
      marginTop: 10,
    },

    skeletonDivider: {
      height: 1,
      marginTop: 14,
    },

    skeletonButton: {
      width: '45%',
      height: 30,
      borderRadius: 10,
      alignSelf: 'flex-end',
      marginTop: 12,
    },
  });
