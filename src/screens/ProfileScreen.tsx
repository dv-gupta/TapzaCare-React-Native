
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {
  Pencil,
  CalendarDays,
  ClipboardList,
  Bell,
  Stethoscope,
  Palette,
  Sun,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  X,
  Save,
  HeartPulse,
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';

import type {
  RootStackParamList,
} from '../navigation/navigationTypes';

import type {
  ConfigMode,
} from '../api/mockApi';

import {useAppConfig} from '../hooks/useAppConfig';

import {defaultColors} from '../theme/theme';

/* =====================================================
   TYPES
===================================================== */

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  iconColor: string;
  textColor: string;
  mutedColor: string;
  backgroundColor: string;
  onPress: () => void;
  showDivider?: boolean;
}

type ProfileNavigation =
  NavigationProp<RootStackParamList>;

/* =====================================================
   CONSTANTS
===================================================== */

const PROFILE_STORAGE_KEY = '@tapza/profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'TapzaCare User',
  email: '',
  phone: '',
};

/* =====================================================
   MENU ITEM
===================================================== */

function MenuItem({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  textColor,
  mutedColor,
  backgroundColor,
  onPress,
  showDivider = true,
}: MenuItemProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({pressed}) => [
          styles.menuItem,
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <View
          style={[
            styles.menuIcon,
            {backgroundColor},
          ]}>
          <Icon
            size={20}
            color={iconColor}
          />
        </View>

        <View style={styles.menuInfo}>
          <Text
            style={[
              styles.menuTitle,
              {color: textColor},
            ]}>
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.menuSubtitle,
                {color: mutedColor},
              ]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <ChevronRight
          size={19}
          color={mutedColor}
        />
      </Pressable>

      {showDivider ? (
        <View style={styles.menuDivider} />
      ) : null}
    </>
  );
}

/* =====================================================
   PROFILE SCREEN
===================================================== */

export default function ProfileScreen() {
  const navigation =
    useNavigation<ProfileNavigation>();

  const {
    config,
    mode,
    loading: configLoading,
    error: configError,
    switchMode,
    refresh,
  } = useAppConfig();

  const colors = config?.theme ?? defaultColors;

  const isDiwali = mode === 'diwali';

  /* ===================================================
     PROFILE STATE
  =================================================== */

  const [profile, setProfile] =
    useState<UserProfile>(DEFAULT_PROFILE);

  const [draftProfile, setDraftProfile] =
    useState<UserProfile>(DEFAULT_PROFILE);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [
    editModalVisible,
    setEditModalVisible,
  ] = useState(false);

  const [
    switchingTheme,
    setSwitchingTheme,
  ] = useState(false);

  /* ===================================================
     LOAD PROFILE FROM ASYNC STORAGE
  =================================================== */

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            PROFILE_STORAGE_KEY,
          );

        if (!active) {
          return;
        }

        if (stored) {
          const parsed: unknown =
            JSON.parse(stored);

          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            const data =
              parsed as Partial<UserProfile>;

            const restored: UserProfile = {
              name:
                typeof data.name === 'string'
                  ? data.name
                  : DEFAULT_PROFILE.name,

              email:
                typeof data.email === 'string'
                  ? data.email
                  : '',

              phone:
                typeof data.phone === 'string'
                  ? data.phone
                  : '',
            };

            setProfile(restored);
            setDraftProfile(restored);
          }
        }
      } catch (error) {
        console.warn(
          '[Profile] Unable to load profile:',
          error,
        );
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  /* ===================================================
     EDIT PROFILE
  =================================================== */

  const handleEditProfile = useCallback(() => {
    setDraftProfile({...profile});
    setEditModalVisible(true);
  }, [profile]);

  /* ===================================================
     SAVE PROFILE
  =================================================== */

  const handleSaveProfile = useCallback(
    async () => {
      if (savingProfile) {
        return;
      }

      const name = draftProfile.name.trim();
      const email = draftProfile.email.trim();
      const phone = draftProfile.phone.trim();

      if (!name) {
        Alert.alert(
          'Name Required',
          'Please enter your full name.',
        );
        return;
      }

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address.',
        );
        return;
      }

      if (
        phone &&
        !/^[6-9]\d{9}$/.test(phone)
      ) {
        Alert.alert(
          'Invalid Phone Number',
          'Please enter a valid 10-digit Indian mobile number.',
        );
        return;
      }

      const updated: UserProfile = {
        name,
        email,
        phone,
      };

      setSavingProfile(true);

      try {
        await AsyncStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(updated),
        );

        setProfile(updated);
        setDraftProfile(updated);
        setEditModalVisible(false);
      } catch (error) {
        console.warn(
          '[Profile] Unable to save profile:',
          error,
        );

        Alert.alert(
          'Save Failed',
          'Unable to save your profile. Please try again.',
        );
      } finally {
        setSavingProfile(false);
      }
    },
    [draftProfile, savingProfile],
  );

  /* ===================================================
     THEME SWITCH
  =================================================== */

  const handleThemeChange = useCallback(
    async (nextMode: ConfigMode) => {
      if (
        switchingTheme ||
        configLoading ||
        nextMode === mode
      ) {
        return;
      }

      setSwitchingTheme(true);

      try {
        await switchMode(nextMode);
      } catch (error) {
        console.warn(
          '[Profile] Theme switch failed:',
          error,
        );

        Alert.alert(
          'Theme Error',
          'Unable to change the theme. Please try again.',
        );
      } finally {
        setSwitchingTheme(false);
      }
    },
    [
      switchingTheme,
      configLoading,
      mode,
      switchMode,
    ],
  );

  /* ===================================================
     REFRESH CONFIGURATION
  =================================================== */

  const handleRefreshConfig = useCallback(
    async () => {
      try {
        await refresh();
      } catch (error) {
        console.warn(
          '[Profile] Config refresh failed:',
          error,
        );
      }
    },
    [refresh],
  );

  /* ===================================================
     NAVIGATION
  =================================================== */

  const navigateToDoctors = useCallback(() => {
    navigation.navigate('Doctors');
  }, [navigation]);

  const navigateToBookings = useCallback(() => {
    navigation.navigate('MainTabs', {
      screen: 'Bookings',
    });
  }, [navigation]);

  const navigateToPrescriptions =
    useCallback(() => {
      navigation.navigate('MainTabs', {
        screen: 'Prescriptions',
      });
    }, [navigation]);

  const navigateToReminders = useCallback(() => {
    navigation.navigate('Reminders');
  }, [navigation]);

  /* ===================================================
     PROFILE INITIALS
  =================================================== */

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word =>
      word.charAt(0).toUpperCase(),
    )
    .join('');

  /* ===================================================
     MAIN RENDER
  =================================================== */

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}>

      {/* STATUS BAR - TYPESCRIPT FIX */}

      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* PAGE HEADING */}

        <View style={styles.pageHeading}>
          <Text
            style={[
              styles.pageTitle,
              {color: colors.textPrimary},
            ]}>
            My Profile
          </Text>

          <Text
            style={[
              styles.pageSubtitle,
              {color: colors.textSecondary},
            ]}>
            Manage your profile and preferences
          </Text>
        </View>

        {/* DIWALI GREETING */}

        {isDiwali ? (
          <View
            style={[
              styles.festivalBanner,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <Sparkles
              size={19}
              color={colors.primary}
            />

            <Text
              style={[
                styles.festivalText,
                {color: colors.primary},
              ]}>
              Happy Diwali! Stay happy and healthy.
            </Text>
          </View>
        ) : null}

        {/* PROFILE CARD */}

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor:
                colors.surface,
            },
          ]}>
          <View style={styles.profileTop}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              {profileLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              ) : (
                <Text
                  style={[
                    styles.avatarText,
                    {color: colors.primary},
                  ]}>
                  {initials || 'TC'}
                </Text>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text
                numberOfLines={1}
                style={[
                  styles.profileName,
                  {color: colors.textPrimary},
                ]}>
                {profile.name}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.profileDetail,
                  {color: colors.textSecondary},
                ]}>
                {profile.email ||
                  'Email not added'}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.profileDetail,
                  {color: colors.textSecondary},
                ]}>
                {profile.phone ||
                  'Mobile number not added'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={[
              styles.editProfileButton,
              {
                backgroundColor:
                  colors.secondary,
              },
            ]}>
            <Pencil
              size={17}
              color={colors.primary}
            />

            <Text
              style={[
                styles.editProfileText,
                {color: colors.primary},
              ]}>
              Edit Profile
            </Text>
          </Pressable>
        </View>

        {/* HEALTHCARE SHORTCUTS */}

        <Text
          style={[
            styles.sectionHeading,
            {color: colors.textPrimary},
          ]}>
          My Healthcare
        </Text>

        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.surface,
            },
          ]}>
          <MenuItem
            title="Find Doctors"
            subtitle="Browse and book appointments"
            icon={Stethoscope}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={navigateToDoctors}
          />

          <MenuItem
            title="My Bookings"
            subtitle="View your appointments"
            icon={CalendarDays}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={navigateToBookings}
          />

          <MenuItem
            title="My Prescriptions"
            subtitle="View prescriptions and medicines"
            icon={ClipboardList}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={navigateToPrescriptions}
          />

          <MenuItem
            title="Medicine Reminders"
            subtitle="Track your medication schedule"
            icon={Bell}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={navigateToReminders}
            showDivider={false}
          />
        </View>

        {/* APPEARANCE */}

        <Text
          style={[
            styles.sectionHeading,
            {color: colors.textPrimary},
          ]}>
          Appearance
        </Text>

        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: colors.surface,
            },
          ]}>
          <View style={styles.themeHeading}>
            <View
              style={[
                styles.themeIcon,
                {
                  backgroundColor:
                    colors.secondary,
                },
              ]}>
              <Palette
                size={21}
                color={colors.primary}
              />
            </View>

            <View style={styles.themeHeadingInfo}>
              <Text
                style={[
                  styles.themeTitle,
                  {color: colors.textPrimary},
                ]}>
                App Theme
              </Text>

              <Text
                style={[
                  styles.themeSubtitle,
                  {color: colors.textSecondary},
                ]}>
                Switch theme without restarting
              </Text>
            </View>
          </View>

          <View style={styles.themeOptions}>

            {/* NORMAL THEME */}

            <Pressable
              onPress={() => {
                void handleThemeChange('normal');
              }}
              disabled={
                switchingTheme || configLoading
              }
              accessibilityRole="radio"
              accessibilityState={{
                checked: mode === 'normal',
                disabled:
                  switchingTheme || configLoading,
              }}
              style={[
                styles.themeOption,
                {
                  backgroundColor:
                    mode === 'normal'
                      ? colors.secondary
                      : colors.background,

                  borderColor:
                    mode === 'normal'
                      ? colors.primary
                      : '#E2E8F0',
                },
              ]}>
              <Sun
                size={22}
                color={
                  mode === 'normal'
                    ? colors.primary
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.themeOptionText,
                  {color: colors.textPrimary},
                ]}>
                Normal
              </Text>

              {mode === 'normal' ? (
                <CheckCircle2
                  size={17}
                  color={colors.primary}
                />
              ) : null}
            </Pressable>

            {/* DIWALI THEME */}

            <Pressable
              onPress={() => {
                void handleThemeChange('diwali');
              }}
              disabled={
                switchingTheme || configLoading
              }
              accessibilityRole="radio"
              accessibilityState={{
                checked: mode === 'diwali',
                disabled:
                  switchingTheme || configLoading,
              }}
              style={[
                styles.themeOption,
                {
                  backgroundColor:
                    mode === 'diwali'
                      ? colors.secondary
                      : colors.background,

                  borderColor:
                    mode === 'diwali'
                      ? colors.primary
                      : '#E2E8F0',
                },
              ]}>
              <Sparkles
                size={22}
                color={
                  mode === 'diwali'
                    ? colors.primary
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.themeOptionText,
                  {color: colors.textPrimary},
                ]}>
                Diwali
              </Text>

              {mode === 'diwali' ? (
                <CheckCircle2
                  size={17}
                  color={colors.primary}
                />
              ) : null}
            </Pressable>
          </View>

          {/* THEME LOADING */}

          {switchingTheme || configLoading ? (
            <View style={styles.themeLoadingRow}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text
                style={[
                  styles.themeLoadingText,
                  {color: colors.textSecondary},
                ]}>
                Updating app theme...
              </Text>
            </View>
          ) : null}

          {/* CONFIG ERROR */}

          {configError ? (
            <View style={styles.configErrorRow}>
              <AlertTriangle
                size={16}
                color="#B45309"
              />

              <Text style={styles.configErrorText}>
                {configError}
              </Text>
            </View>
          ) : null}
        </View>

        {/* APP SETTINGS */}

        <Text
          style={[
            styles.sectionHeading,
            {color: colors.textPrimary},
          ]}>
          App Settings
        </Text>

        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.surface,
            },
          ]}>
          <MenuItem
            title="Refresh App Configuration"
            subtitle="Reload current layout and theme"
            icon={RefreshCw}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={() => {
              void handleRefreshConfig();
            }}
          />

          <MenuItem
            title="About TapzaCare"
            subtitle="Healthcare at your fingertips"
            icon={Info}
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            mutedColor={colors.textSecondary}
            backgroundColor={colors.secondary}
            onPress={() => {
              Alert.alert(
                'About TapzaCare',
                'TapzaCare is a healthcare demo application featuring doctor bookings, prescriptions, medicine tracking, and dynamic themes.',
              );
            }}
            showDivider={false}
          />
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <HeartPulse
              size={22}
              color={colors.primary}
            />

            <Text
              style={[
                styles.footerBrandText,
                {color: colors.primary},
              ]}>
              TapzaCare
            </Text>
          </View>

          <Text
            style={[
              styles.footerText,
              {color: colors.textSecondary},
            ]}>
            Your health, our priority
          </Text>

          <Text
            style={[
              styles.footerVersion,
              {color: colors.textSecondary},
            ]}>
            Demo Application
          </Text>
        </View>
      </ScrollView>

      {/* ================================================
          EDIT PROFILE MODAL
      ================================================= */}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingProfile) {
            setEditModalVisible(false);
          }
        }}>
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.surface,
              },
            ]}>

            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    {color: colors.textPrimary},
                  ]}>
                  Edit Profile
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {color: colors.textSecondary},
                  ]}>
                  Update your personal details
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (!savingProfile) {
                    setEditModalVisible(false);
                  }
                }}
                disabled={savingProfile}
                accessibilityRole="button"
                accessibilityLabel="Close edit profile"
                style={styles.modalClose}>
                <X
                  size={22}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>

            {/* FULL NAME */}

            <Text
              style={[
                styles.inputLabel,
                {color: colors.textPrimary},
              ]}>
              Full Name
            </Text>

            <TextInput
              value={draftProfile.name}
              onChangeText={value => {
                setDraftProfile(previous => ({
                  ...previous,
                  name: value,
                }));
              }}
              placeholder="Enter full name"
              placeholderTextColor={
                colors.textSecondary
              }
              autoCapitalize="words"
              maxLength={60}
              style={[
                styles.modalInput,
                {
                  color: colors.textPrimary,
                  backgroundColor:
                    colors.background,
                },
              ]}
            />

            {/* EMAIL */}

            <Text
              style={[
                styles.inputLabel,
                {color: colors.textPrimary},
              ]}>
              Email Address
            </Text>

            <TextInput
              value={draftProfile.email}
              onChangeText={value => {
                setDraftProfile(previous => ({
                  ...previous,
                  email: value,
                }));
              }}
              placeholder="Enter email address"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              style={[
                styles.modalInput,
                {
                  color: colors.textPrimary,
                  backgroundColor:
                    colors.background,
                },
              ]}
            />

            {/* MOBILE NUMBER */}

            <Text
              style={[
                styles.inputLabel,
                {color: colors.textPrimary},
              ]}>
              Mobile Number
            </Text>

            <TextInput
              value={draftProfile.phone}
              onChangeText={value => {
                setDraftProfile(previous => ({
                  ...previous,
                  phone: value.replace(/\D/g, ''),
                }));
              }}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="phone-pad"
              maxLength={10}
              style={[
                styles.modalInput,
                {
                  color: colors.textPrimary,
                  backgroundColor:
                    colors.background,
                },
              ]}
            />

            {/* SAVE BUTTON */}

            <Pressable
              onPress={() => {
                void handleSaveProfile();
              }}
              disabled={savingProfile}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    colors.primary,

                  opacity: savingProfile
                    ? 0.6
                    : 1,
                },
              ]}>
              {savingProfile ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Save
                  size={19}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.saveButtonText}>
                {savingProfile
                  ? 'Saving...'
                  : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },

  pageHeading: {
    marginBottom: 20,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
  },

  pageSubtitle: {
    fontSize: 12,
    marginTop: 6,
  },

  festivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },

  festivalText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },

  profileCard: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 23,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 23,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },

  profileDetail: {
    fontSize: 11,
    marginBottom: 5,
  },

  editProfileButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  editProfileText: {
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 13,
  },

  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 60,
  },

  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuInfo: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  menuSubtitle: {
    fontSize: 11,
    marginTop: 5,
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 55,
  },

  themeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 24,
  },

  themeHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  themeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  themeHeadingInfo: {
    flex: 1,
    marginLeft: 12,
  },

  themeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  themeSubtitle: {
    fontSize: 11,
    marginTop: 5,
  },

  themeOptions: {
    flexDirection: 'row',
    gap: 11,
  },

  themeOption: {
    flex: 1,
    minHeight: 90,
    borderWidth: 1.5,
    borderRadius: 13,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  themeOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },

  themeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 15,
  },

  themeLoadingText: {
    fontSize: 11,
  },

  configErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 11,
    borderRadius: 10,
    marginTop: 14,
  },

  configErrorText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
  },

  footer: {
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 20,
  },

  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  footerBrandText: {
    fontSize: 17,
    fontWeight: '800',
  },

  footerText: {
    fontSize: 11,
    marginTop: 8,
  },

  footerVersion: {
    fontSize: 10,
    marginTop: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 23,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 6,
  },

  modalClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 9,
  },

  modalInput: {
    height: 49,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    fontSize: 13,
    marginBottom: 18,
  },

  saveButton: {
    height: 49,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
