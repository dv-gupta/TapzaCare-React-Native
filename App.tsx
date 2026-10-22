
import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';

import {AppConfigProvider} from './src/context/AppConfigContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

export default function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppConfigProvider>
          <View style={styles.container}>
            {showSplash ? (
              <SplashScreen
                onFinish={() => {
                  setShowSplash(false);
                }}
              />
            ) : (
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            )}
          </View>
        </AppConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
