
import React, {useEffect, useRef} from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
  useWindowDimensions,
} from 'react-native';

import {ShieldCheck} from 'lucide-react-native';

type SplashScreenProps = {
  onFinish: () => void;
};

const COLORS = {
  primary: '#009E91',
  secondary: '#26C6A8',
  background: '#FFFFFF',
  dark: '#064E49',
  white: '#FFFFFF',
  muted: '#607D79',
};

const SPLASH_DURATION = 2500;

export default function SplashScreen({
  onFinish,
}: SplashScreenProps) {
  const {width} = useWindowDimensions();

  const fadeAnim = useRef(
    new Animated.Value(0),
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.8),
  ).current;

  const slideAnim = useRef(
    new Animated.Value(25),
  ).current;

  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinishRef.current();
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(timer);
    };
  }, [fadeAnim, scaleAnim, slideAnim]);

  const imageWidth = Math.min(width - 48, 330);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {scale: scaleAnim},
              {translateY: slideAnim},
            ],
          },
        ]}>

        {/* TAPZA CARE LOGO IMAGE */}

        <Image
          source={require('../assets/images/splashlogonew.png')}
          style={[
            styles.logoImage,
            {
              width: imageWidth,
              height: imageWidth,
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="Tapza Care logo"
        />

        {/* TAGLINE */}

        <Text style={styles.tagline}>
          Better Health. Brighter Tomorrow.
        </Text>

        <View style={styles.trustRow}>
          <ShieldCheck
            size={17}
            color={COLORS.primary}
          />

          <Text style={styles.trustText}>
            Your health, our priority
          </Text>
        </View>
      </Animated.View>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MADE FOR YOUR HEALTH
        </Text>

        <Text style={styles.footerVersion}>
          TapzaCare
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  topCircle: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#EAFBF7',
    top: -145,
    right: -130,
  },

  bottomCircle: {
    position: 'absolute',
    width: 370,
    height: 370,
    borderRadius: 185,
    backgroundColor: '#EAFBF7',
    bottom: -180,
    left: -155,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },

  logoImage: {
    alignSelf: 'center',
  },

  tagline: {
    marginTop: -10,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },

  trustRow: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },

  footer: {
    position: 'absolute',
    bottom: 35,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.primary,
  },

  footerVersion: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 8,
  },
});
